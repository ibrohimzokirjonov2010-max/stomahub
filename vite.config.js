import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const routes = {
  '/api/auth/telegram': 'api/auth/telegram.js',
  '/api/auth/phone/start': 'api/auth/phone/start.js',
  '/api/auth/phone/verify': 'api/auth/phone/verify.js',
  '/api/telegram/webhook': 'api/telegram/webhook.js',
  '/api/og-listing': 'api/og-listing.js',
}

function localApi(env) {
  return {
    name: 'stomahub-local-api',
    configureServer(server) {
      Object.assign(process.env, env)
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0]
        const ua = req.headers['user-agent'] || ''
        const bot = /TelegramBot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|vkShare/i.test(ua)
        if (bot) {
          const m = pathname.match(/^\/(elonlar|ortiqcha)\/([^/]+)\/?$/)
          if (m) {
            req.url = `/api/og-listing?kind=${m[1] === 'elonlar' ? 'ad' : 'surplus'}&id=${encodeURIComponent(m[2])}`
          }
        }
        const pathOnly = (req.url || '').split('?')[0]
        const file = routes[pathOnly]
        if (!file) return next()
        try {
          const mod = await import(pathToFileURL(path.resolve(file)).href)
          await mod.default(req, res)
        } catch (error) {
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: error.message || 'Server xatosi' }))
          }
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), localApi(env)],
  }
})
