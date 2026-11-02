// Foydalanuvchiga hech qachon xom SQL/PostgREST xatosi ko‘rsatilmaydi.
const RAW = /query|function|relation|column|syntax|violates|constraint|permission denied|PGRST|JWT|null value|duplicate key|schema cache|operator|does not exist|plpgsql|destination|failed to fetch|networkerror|unexpected|undefined|TypeError/i

export function friendlyError(e, fallback = 'Xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.') {
  const msg = (e && (e.message || e.error_description || e.hint)) || (typeof e === 'string' ? e : '')
  if (msg) console.warn('[xato]', msg)
  if (!msg || RAW.test(msg) || /[а-яё]/i.test(msg)) {
    if (/failed to fetch|networkerror/i.test(msg)) return 'Internet aloqasi yo‘q. Ulanishni tekshirib, qayta urinib ko‘ring.'
    return fallback
  }
  return msg
}
