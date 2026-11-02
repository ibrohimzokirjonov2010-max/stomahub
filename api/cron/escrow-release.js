import { send } from '../_lib/http.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

/**
 * Vercel Cron (vercel.json → crons): har kuni escrowdagi, yetkazilganiga N kun (ESCROW_AUTO_RELEASE_DAYS, default 3)
 * bo‘lgan va nizo ochilmagan onlayn to‘lovlarni sotuvchiga chiqaradi (escrow_auto_release, service_role).
 * Vercel cron so‘rovida Authorization: Bearer ${CRON_SECRET} yuboradi.
 */
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET || ''
  if (!secret || String(req.headers.authorization || '') !== `Bearer ${secret}`) {
    return send(res, 401, { ok: false, error: 'Ruxsat yo‘q' })
  }
  try {
    const days = Math.min(30, Math.max(1, Number(process.env.ESCROW_AUTO_RELEASE_DAYS) || 3))
    const { data, error } = await adminClient().rpc('escrow_auto_release', { p_days: days })
    if (error) throw error
    return send(res, 200, { ok: true, ...data })
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message })
  }
}
