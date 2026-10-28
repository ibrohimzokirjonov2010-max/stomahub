// Seller order exports: .xlsx (hand-built OOXML, no dependency) and a 1C-friendly CSV
// (Windows-1251, ';' separator, dd.mm.yyyy dates, decimal comma, one row per order line).

// ---------- tiny ZIP (store, no compression) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }

export function zipStore(files) {
  const enc = new TextEncoder()
  const parts = []; const central = []; let offset = 0
  for (const [name, text] of files) {
    const nb = enc.encode(name); const data = typeof text === 'string' ? enc.encode(text) : text; const crc = crc32(data)
    const h = new DataView(new ArrayBuffer(30))
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true)
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nb.length, true)
    parts.push(new Uint8Array(h.buffer), nb, data)
    const c = new DataView(new ArrayBuffer(46))
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true)
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nb.length, true); c.setUint32(42, offset, true)
    central.push(new Uint8Array(c.buffer), nb)
    offset += 30 + nb.length + data.length
  }
  const size = central.reduce((s, x) => s + x.length, 0)
  const e = new DataView(new ArrayBuffer(22))
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, offset, true)
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' })
}

// ---------- xlsx ----------
const xml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
const col = (i) => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26) } return s }

export function xlsxBlob(rows, sheet = 'Buyurtmalar') {
  const body = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
    const ref = `${col(ci)}${ri + 1}`
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${ri === 0 ? ' s="1"' : ''}><v>${v}</v></c>`
    return `<c r="${ref}" t="inlineStr"${ri === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xml(v)}</t></is></c>`
  }).join('')}</row>`).join('')
  const widths = (rows[0] || []).map((_, i) => Math.min(48, Math.max(10, ...rows.map((r) => String(r[i] ?? '').length + 2))))
  const files = [
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(sheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs></styleSheet>'],
    ['xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${body}</sheetData></worksheet>`],
  ]
  const z = zipStore(files)
  return new Blob([z], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ---------- 1C CSV (Windows-1251) ----------
const CP1251_EXTRA = { 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2013: 0x96, 0x2014: 0x97, 0x2116: 0xb9, 0x401: 0xa8, 0x451: 0xb8, 0x2bb: 0x91, 0x2bc: 0x92, 0xa0: 0x20 }
export function cp1251(text) {
  const out = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    out[i] = c < 0x80 ? c : c >= 0x410 && c <= 0x44f ? c - 0x350 : CP1251_EXTRA[c] ?? 0x3f
  }
  return out
}
const d1c = (iso) => { const d = new Date(iso); if (Number.isNaN(+d)) return ''; const p = (n) => String(n).padStart(2, '0'); return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}` }
const n1c = (v) => (Math.round((Number(v) || 0) * 100) / 100).toFixed(2).replace('.', ',')
const esc = (v) => { const t = String(v ?? ''); return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t }

export function oneCRows(orders, legal = {}) {
  const head = ['НомерДокумента', 'Дата', 'Контрагент', 'Телефон', 'Адрес', 'Номенклатура', 'Артикул', 'Характеристика', 'Количество', 'ЕдиницаИзмерения', 'Цена', 'Сумма', 'Комиссия', 'КВыплате', 'СпособОплаты', 'Статус', 'ИННПродавца']
  const rows = [head]
  for (const o of orders) {
    for (const i of o.items?.length ? o.items : [{}]) {
      rows.push([o.code, d1c(o.created_at), o.customer_name, o.customer_phone, [o.city, o.address].filter(Boolean).join(', '),
        i.name || '', i.sku || '', i.variant || '', i.qty ?? '', i.uom || 'шт', n1c(i.price), n1c(Number(i.price || 0) * Number(i.qty || 0)),
        n1c(o.commission), n1c(o.payout), o.payment_method || '', o.status || '', legal.stir || ''])
    }
  }
  return rows
}

export function download(blob, filename) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export const oneCBlob = (orders, legal) => new Blob([cp1251(oneCRows(orders, legal).map((r) => r.map(esc).join(';')).join('\r\n') + '\r\n')], { type: 'text/csv;charset=windows-1251' })
