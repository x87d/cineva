import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Serves the /api/*.ts handlers during `vite dev` so the app runs with a single
 * command locally. In production the same files are deployed as Vercel
 * serverless functions, so there is one source of truth for the TMDB proxy.
 */
function devApi(): Plugin {
  return {
    name: 'reelward-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const name = req.url.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '')
        const file = path.resolve(rootDir, 'api', `${name}.ts`)
        if (!name || !fs.existsSync(file)) {
          res.statusCode = 404
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Not found' }))
          return
        }
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.ts`)
          await mod.default(req, res)
        } catch (err) {
          server.ssrFixStacktrace(err as Error)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Dev API error', detail: String(err) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Expose the server-side key to the dev middleware (never bundled into the client).
  if (env.TMDB_API_KEY) process.env.TMDB_API_KEY = env.TMDB_API_KEY
  return {
    plugins: [react(), devApi()],
    resolve: { alias: { '@': path.resolve(rootDir, 'src') } },
  }
})
