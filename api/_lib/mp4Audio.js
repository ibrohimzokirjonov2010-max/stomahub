/**
 * Bunny MP4 dan AAC ni ajratib .m4a yig‘adi.
 *
 * VoiceLab STT MP4 konteynerni qabul qilmaydi (MP3, WAV, M4A/AAC, OGG, WebM, FLAC).
 * Vercel funksiyasida ffmpeg yo‘q va 20–60 daqiqalik videoni butunlay xotiraga olish mumkin emas.
 * Shuning uchun moov atomidan audio namunalarining bayt oralig‘ini o‘qiymiz va faqat shu
 * oraliqlarni Range so‘rov bilan tortamiz (videoni tashlab yuboramiz), so‘ng AAC ni M4A ga
 * qayta joylaymiz (qayta kodlamaymiz).
 *
 * Savdo: past sifatli MP4 fallback (240p) moov i boshida bo‘lsa, original 1 GB faylni
 * yuklab o‘tirmaymiz. Fallback yoqilmagan bo‘lsa originaldan ham xuddi shu usul ishlaydi,
 * lekin moov oxirda bo‘lsa avval uning joyini topamiz. Audio AAC (mp4a) bo‘lmasa, to‘xtaymiz.
 */

export function readBoxHeader(buf, offset) {
  if (offset + 8 > buf.length) return null
  let size = buf.readUInt32BE(offset)
  const type = buf.toString('latin1', offset + 4, offset + 8)
  let header = 8
  if (size === 1) {
    if (offset + 16 > buf.length) return null
    size = Number(buf.readBigUInt64BE(offset + 8))
    header = 16
  } else if (size === 0) {
    return { type, size: buf.length - offset, header, toEof: true }
  }
  if (!Number.isFinite(size) || size < header) return { type, size: 0, header, broken: true }
  return { type, size, header }
}

export function boxesIn(buf, start, end) {
  const boxes = []
  let offset = start
  const stop = Math.min(end, buf.length)
  while (offset + 8 <= stop) {
    const header = readBoxHeader(buf, offset)
    if (!header || header.broken) break
    const complete = offset + header.size <= stop
    boxes.push({
      type: header.type,
      start: offset,
      size: header.size,
      header: header.header,
      dataStart: offset + header.header,
      dataEnd: complete ? offset + header.size : stop,
      complete,
      toEof: header.toEof === true,
    })
    if (!complete || header.toEof) break
    offset += header.size
  }
  return boxes
}

function childBoxes(buf, box) {
  if (!box?.complete) return []
  return boxesIn(buf, box.dataStart, box.dataEnd).filter((item) => item.complete)
}

function findChild(buf, box, type) {
  return childBoxes(buf, box).find((item) => item.type === type) || null
}

function findChildren(buf, box, type) {
  return childBoxes(buf, box).filter((item) => item.type === type)
}

/** Deraza ichidan moov ni qidiradi. Katta mdat ni sakrab o‘tish uchun continueFrom qaytaradi. */
export function scanForMoov(buf, base, fileSize) {
  let offset = 0
  while (offset + 8 <= buf.length) {
    const header = readBoxHeader(buf, offset)
    if (!header || header.broken) return { error: 'MP4 tuzilmasi o‘qilmadi' }
    const abs = base + offset
    if (header.toEof) {
      if (header.type === 'moov') return { error: 'moov hajmi noma’lum' }
      return { error: 'moov topilmadi' }
    }
    if (header.type === 'moov') {
      if (header.size > 32 * 1024 * 1024) return { error: 'Video xarita fayli juda katta' }
      if (offset + header.size <= buf.length) return { moov: buf.subarray(offset, offset + header.size) }
      return { need: { start: abs, end: abs + header.size } }
    }
    if (fileSize && abs + header.size > fileSize + 32) return { error: 'MP4 tuzilmasi o‘qilmadi' }
    if (offset + header.size > buf.length) return { continueFrom: abs + header.size }
    offset += header.size
  }
  if (fileSize && base + buf.length >= fileSize) return { error: 'Videoda moov topilmadi' }
  return { continueFrom: base + buf.length }
}

function u32(buf, offset) {
  return buf.readUInt32BE(offset)
}

function handlerType(buf, hdlr) {
  if (!hdlr || hdlr.dataEnd - hdlr.dataStart < 12) return ''
  return buf.toString('latin1', hdlr.dataStart + 8, hdlr.dataStart + 12)
}

function parseMdhd(buf, mdhd) {
  const version = buf[mdhd.dataStart]
  if (version === 1) {
    return {
      timescale: u32(buf, mdhd.dataStart + 20),
      duration: Number(buf.readBigUInt64BE(mdhd.dataStart + 24)),
    }
  }
  return {
    timescale: u32(buf, mdhd.dataStart + 12),
    duration: u32(buf, mdhd.dataStart + 16),
  }
}

function parseStts(buf, stts) {
  const count = u32(buf, stts.dataStart + 4)
  const entries = []
  let offset = stts.dataStart + 8
  for (let i = 0; i < count && offset + 8 <= stts.dataEnd; i += 1) {
    entries.push({ count: u32(buf, offset), delta: u32(buf, offset + 4) })
    offset += 8
  }
  return entries
}

function parseStsc(buf, stsc) {
  const count = u32(buf, stsc.dataStart + 4)
  const entries = []
  let offset = stsc.dataStart + 8
  for (let i = 0; i < count && offset + 12 <= stsc.dataEnd; i += 1) {
    entries.push({
      first: u32(buf, offset),
      perChunk: u32(buf, offset + 4),
      desc: u32(buf, offset + 8),
    })
    offset += 12
  }
  return entries
}

function parseStsz(buf, stsz) {
  const sampleSize = u32(buf, stsz.dataStart + 4)
  const count = u32(buf, stsz.dataStart + 8)
  if (sampleSize > 0) return { count, sizes: null, sampleSize }
  const sizes = []
  let offset = stsz.dataStart + 12
  for (let i = 0; i < count && offset + 4 <= stsz.dataEnd; i += 1) {
    sizes.push(u32(buf, offset))
    offset += 4
  }
  return { count, sizes, sampleSize: 0 }
}

function parseChunkOffsets(buf, stbl) {
  const stco = findChild(buf, stbl, 'stco')
  if (stco) {
    const count = u32(buf, stco.dataStart + 4)
    const offsets = []
    let offset = stco.dataStart + 8
    for (let i = 0; i < count && offset + 4 <= stco.dataEnd; i += 1) {
      offsets.push(u32(buf, offset))
      offset += 4
    }
    return offsets
  }
  const co64 = findChild(buf, stbl, 'co64')
  if (!co64) return []
  const count = u32(buf, co64.dataStart + 4)
  const offsets = []
  let offset = co64.dataStart + 8
  for (let i = 0; i < count && offset + 8 <= co64.dataEnd; i += 1) {
    offsets.push(Number(buf.readBigUInt64BE(offset)))
    offset += 8
  }
  return offsets
}

function samplesInChunk(stsc, chunkIndex) {
  let current = stsc[0]
  for (const entry of stsc) {
    if (entry.first <= chunkIndex) current = entry
    else break
  }
  return current?.perChunk || 0
}

function audioSampleEntry(buf, stsd) {
  const count = u32(buf, stsd.dataStart + 4)
  let offset = stsd.dataStart + 8
  for (let i = 0; i < count && offset + 8 <= stsd.dataEnd; i += 1) {
    const header = readBoxHeader(buf, offset)
    if (!header || header.broken || header.toEof) break
    if (header.type === 'mp4a') return buf.subarray(offset, offset + header.size)
    offset += header.size
  }
  return null
}

export function audioPlanFromMoov(moovBuf) {
  const root = boxesIn(moovBuf, 0, moovBuf.length)[0]
  if (!root || root.type !== 'moov' || !root.complete) {
    const error = new Error('Videoda moov topilmadi')
    error.code = 'no_audio'
    throw error
  }
  let audio = null
  for (const trak of findChildren(moovBuf, root, 'trak')) {
    const mdia = findChild(moovBuf, trak, 'mdia')
    const hdlr = mdia && findChild(moovBuf, mdia, 'hdlr')
    if (handlerType(moovBuf, hdlr) === 'soun') {
      audio = { trak, mdia }
      break
    }
  }
  if (!audio) {
    const error = new Error('Videoda audio izi topilmadi')
    error.code = 'no_audio'
    throw error
  }
  const mdhd = findChild(moovBuf, audio.mdia, 'mdhd')
  const minf = findChild(moovBuf, audio.mdia, 'minf')
  const stbl = minf && findChild(moovBuf, minf, 'stbl')
  const stsd = stbl && findChild(moovBuf, stbl, 'stsd')
  const sttsBox = stbl && findChild(moovBuf, stbl, 'stts')
  const stscBox = stbl && findChild(moovBuf, stbl, 'stsc')
  const stszBox = stbl && findChild(moovBuf, stbl, 'stsz')
  if (!mdhd || !stsd || !sttsBox || !stscBox || !stszBox) {
    const error = new Error('Audio xaritasi to‘liq emas')
    error.code = 'no_audio'
    throw error
  }
  const sampleEntry = audioSampleEntry(moovBuf, stsd)
  if (!sampleEntry) {
    const error = new Error('Video audiosi AAC emas. Boshqa kodekni o‘qib bo‘lmaydi')
    error.code = 'codec'
    throw error
  }
  const timing = parseMdhd(moovBuf, mdhd)
  const stts = parseStts(moovBuf, sttsBox)
  const stsc = parseStsc(moovBuf, stscBox)
  const stsz = parseStsz(moovBuf, stszBox)
  const chunkOffsets = parseChunkOffsets(moovBuf, stbl)
  const sizes = []
  const ranges = []
  let sampleIndex = 0
  for (let i = 0; i < chunkOffsets.length; i += 1) {
    const count = samplesInChunk(stsc, i + 1)
    const first = sampleIndex
    let bytes = 0
    for (let n = 0; n < count; n += 1) {
      const size = stsz.sampleSize || stsz.sizes[sampleIndex] || 0
      sizes.push(size)
      bytes += size
      sampleIndex += 1
    }
    if (bytes > 0) ranges.push({ start: chunkOffsets[i], end: chunkOffsets[i] + bytes, first, count })
  }
  const delta = stts[0]?.delta || 1024
  return {
    timescale: timing.timescale || 48000,
    sampleDelta: delta,
    sampleEntry: Buffer.from(sampleEntry),
    sizes,
    ranges,
    sampleCount: sizes.length,
  }
}

export function coalesceRanges(ranges) {
  const out = []
  for (const range of ranges) {
    const prev = out[out.length - 1]
    if (prev && prev.end === range.start && prev.first + prev.count === range.first) {
      prev.end = range.end
      prev.count += range.count
    } else {
      out.push({ ...range })
    }
  }
  return out
}

export function splitFrames(bytes, sizes) {
  const frames = []
  let offset = 0
  for (const size of sizes) {
    if (size < 0 || offset + size > bytes.length) {
      const error = new Error('Audio namunasi fayl bilan mos kelmadi')
      error.code = 'no_audio'
      throw error
    }
    frames.push(Buffer.from(bytes.subarray(offset, offset + size)))
    offset += size
  }
  if (offset !== bytes.length) {
    const error = new Error('Audio namunasi fayl bilan mos kelmadi')
    error.code = 'no_audio'
    throw error
  }
  return frames
}

function box(type, payload) {
  const out = Buffer.alloc(8 + payload.length)
  out.writeUInt32BE(out.length, 0)
  out.write(type, 4, 4, 'latin1')
  payload.copy(out, 8)
  return out
}

function fullBox(type, version, flags, payload) {
  const head = Buffer.alloc(4)
  head.writeUInt32BE((version << 24) | flags, 0)
  return box(type, Buffer.concat([head, payload]))
}

function u32buf(value) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32BE(value >>> 0, 0)
  return buf
}

function buildFtyp() {
  const brands = Buffer.alloc(4 + 4 + 4 * 3)
  brands.write('M4A ', 0, 4, 'latin1')
  brands.writeUInt32BE(0, 4)
  brands.write('M4A ', 8, 4, 'latin1')
  brands.write('mp42', 12, 4, 'latin1')
  brands.write('isom', 16, 4, 'latin1')
  return box('ftyp', brands)
}

function buildMoov({ frameCount, timescale, sampleDelta, sampleEntry, dataOffset }) {
  const duration = frameCount * sampleDelta
  const mvhd = fullBox('mvhd', 0, 0, Buffer.concat([
    u32buf(0), u32buf(0), u32buf(timescale), u32buf(duration),
    u32buf(0x00010000), Buffer.from([0x01, 0x00]), Buffer.alloc(10),
    Buffer.from([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x40, 0, 0, 0]),
    Buffer.alloc(24), u32buf(2),
  ]))
  const tkhd = fullBox('tkhd', 0, 3, Buffer.concat([
    u32buf(0), u32buf(0), u32buf(1), Buffer.alloc(4), u32buf(duration),
    Buffer.alloc(8), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
    Buffer.from([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x40, 0, 0, 0]),
    u32buf(0), u32buf(0),
  ]))
  const mdhd = fullBox('mdhd', 0, 0, Buffer.concat([
    u32buf(0), u32buf(0), u32buf(timescale), u32buf(duration), Buffer.alloc(4),
  ]))
  const hdlrBody = Buffer.concat([
    u32buf(0), Buffer.from('soun', 'latin1'), Buffer.alloc(12), Buffer.from('SoundHandler\0', 'latin1'),
  ])
  const hdlr = fullBox('hdlr', 0, 0, hdlrBody)
  const smhd = fullBox('smhd', 0, 0, Buffer.alloc(4))
  const url = fullBox('url ', 0, 1, Buffer.alloc(0))
  const dref = fullBox('dref', 0, 0, Buffer.concat([u32buf(1), url]))
  const dinf = box('dinf', dref)
  const stsd = fullBox('stsd', 0, 0, Buffer.concat([u32buf(1), sampleEntry]))
  const stts = fullBox('stts', 0, 0, Buffer.concat([u32buf(1), u32buf(frameCount), u32buf(sampleDelta)]))
  const stsc = fullBox('stsc', 0, 0, Buffer.concat([u32buf(1), u32buf(1), u32buf(frameCount), u32buf(1)]))
  const stszBody = Buffer.alloc(8 + frameCount * 4)
  stszBody.writeUInt32BE(0, 0)
  stszBody.writeUInt32BE(frameCount, 4)
  const stcoBody = Buffer.concat([u32buf(1), u32buf(dataOffset)])
  const stsz = fullBox('stsz', 0, 0, stszBody)
  const stco = fullBox('stco', 0, 0, stcoBody)
  const stbl = box('stbl', Buffer.concat([stsd, stts, stsc, stsz, stco]))
  const minf = box('minf', Buffer.concat([smhd, dinf, stbl]))
  const mdia = box('mdia', Buffer.concat([mdhd, hdlr, minf]))
  const trak = box('trak', Buffer.concat([tkhd, mdia]))
  return box('moov', Buffer.concat([mvhd, trak]))
}

export function buildM4a({ frames, sampleEntry, timescale, sampleDelta }) {
  const samples = frames.map((frame) => Buffer.from(frame))
  if (!samples.length) {
    const error = new Error('Audio bo‘sh chiqdi')
    error.code = 'no_audio'
    throw error
  }
  if (!sampleEntry?.length) {
    const error = new Error('Audio kodek ma’lumoti yo‘q')
    error.code = 'codec'
    throw error
  }
  const ftyp = buildFtyp()
  const delta = sampleDelta || 1024
  const scale = timescale || 48000
  const probe = buildMoov({
    frameCount: samples.length,
    timescale: scale,
    sampleDelta: delta,
    sampleEntry,
    dataOffset: 0,
  })
  const dataOffset = ftyp.length + probe.length + 8
  const moov = buildMoov({
    frameCount: samples.length,
    timescale: scale,
    sampleDelta: delta,
    sampleEntry,
    dataOffset,
  })
  const payload = Buffer.concat(samples)
  const mdat = box('mdat', payload)
  const file = Buffer.concat([ftyp, moov, mdat])
  const stszAt = findStszSizes(file)
  let cursor = stszAt
  for (const sample of samples) {
    file.writeUInt32BE(sample.length, cursor)
    cursor += 4
  }
  return file
}

function findStszSizes(file) {
  const top = boxesIn(file, 0, file.length)
  const moov = top.find((item) => item.type === 'moov')
  const trak = findChild(file, moov, 'trak')
  const mdia = findChild(file, trak, 'mdia')
  const minf = findChild(file, mdia, 'minf')
  const stbl = findChild(file, minf, 'stbl')
  const stsz = findChild(file, stbl, 'stsz')
  return stsz.dataStart + 12
}

export function encodeAudioPart(frames) {
  const header = Buffer.alloc(8 + frames.length * 4)
  header.write('QZA1', 0, 4, 'latin1')
  header.writeUInt32BE(frames.length, 4)
  frames.forEach((frame, index) => header.writeUInt32BE(frame.length, 8 + index * 4))
  return Buffer.concat([header, ...frames.map((frame) => Buffer.from(frame))])
}

export function decodeAudioPart(buf) {
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
  if (bytes.toString('latin1', 0, 4) !== 'QZA1') {
    const error = new Error('Audio bo‘lagi buzilgan')
    error.code = 'no_audio'
    throw error
  }
  const count = bytes.readUInt32BE(4)
  const frames = []
  let cursor = 8 + count * 4
  for (let i = 0; i < count; i += 1) {
    const size = bytes.readUInt32BE(8 + i * 4)
    frames.push(Buffer.from(bytes.subarray(cursor, cursor + size)))
    cursor += size
  }
  return frames
}

export function encodeSizes(sizes) {
  const buf = Buffer.alloc(sizes.length * 4)
  sizes.forEach((size, index) => buf.writeUInt32LE(size, index * 4))
  return buf
}

export function decodeSizes(buf, first, count) {
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
  const sizes = []
  for (let i = 0; i < count; i += 1) sizes.push(bytes.readUInt32LE((first + i) * 4))
  return sizes
}
