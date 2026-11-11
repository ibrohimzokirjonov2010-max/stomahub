/** JPEG (DCT) ni bitta sahifali PDF ga o‘raydi. Yangi kutubxona shart emas. */
export function jpegToPdf(jpeg, pxW, pxH) {
  const img = jpeg instanceof Uint8Array ? jpeg : new Uint8Array(jpeg)
  const pageW = 420
  const pageH = Math.max(1, Math.round(pageW * (Number(pxH) || 1) / (Number(pxW) || 1)))
  const content = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`
  const enc = new TextEncoder()
  const header = (n, body) => enc.encode(`${n} 0 obj\n${body}\nendobj\n`)
  const chunks = [enc.encode('%PDF-1.4\n')]
  const offsets = [0]
  const push = (bytes) => {
    offsets.push(chunks.reduce((n, c) => n + c.length, 0))
    chunks.push(bytes)
  }
  push(header(1, '<< /Type /Catalog /Pages 2 0 R >>'))
  push(header(2, '<< /Type /Pages /Count 1 /Kids [3 0 R] >>'))
  push(header(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>`))
  push(header(4, `<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream`))
  const imgHead = enc.encode(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pxW | 0} /Height ${pxH | 0} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`)
  const imgTail = enc.encode('\nendstream\nendobj\n')
  offsets.push(chunks.reduce((n, c) => n + c.length, 0))
  chunks.push(imgHead, img, imgTail)
  const startxref = chunks.reduce((n, c) => n + c.length, 0)
  let xref = `xref\n0 6\n0000000000 65535 f \n`
  for (let i = 1; i <= 5; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`
  chunks.push(enc.encode(xref))
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let p = 0
  for (const c of chunks) { out.set(c, p); p += c.length }
  return out
}
