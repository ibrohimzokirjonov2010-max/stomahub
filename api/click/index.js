import { send } from '../_lib/http.js'
import { clickConfigured } from '../_lib/payments.js'

export default async function handler(req, res) {
  send(res, 200, {
    ok: true,
    service: 'click',
    configured: clickConfigured(),
    endpoints: {
      prepare: '/api/click/prepare',
      complete: '/api/click/complete',
    },
  })
}
