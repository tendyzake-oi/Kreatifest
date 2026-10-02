import { createHash } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { getCacheStatus, getLatestNews, prewarmNews } from './news.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS) || 0
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 0

// Vercel menjalankan ini sebagai Vercel Function: jangan panggil app.listen(),
// cukup ekspor app supaya deteksi zero-config Express berhasil. Di Hostinger
// dan lokal, isServerless false sehingga app tetap berjalan sebagai server.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

const CACHED_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=30'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Origin Vercel untuk preview deployment punya suffix acak
 * (https://nama-project-hash.vercel.app), jadi daftar origin harus bisa
 * memakai wildcard. Wildcard hanya menggantikan label host, bukan karakter
 * bebas apa pun, supaya pattern tidak ikut mencocokkan project lain.
 *
 * `*` boleh cocok dengan string kosong supaya satu pattern juga menutup URL
 * production: https://my-app*.vercel.app harus menerima my-app.vercel.app
 * sekaligus my-app-a1b2c3d4.vercel.app.
 */
function toOriginMatcher(pattern) {
  if (!pattern.includes('*')) return (origin) => origin === pattern
  const regex = new RegExp(`^${pattern.split('*').map(escapeRegExp).join('[a-zA-Z0-9-]*')}$`)
  return (origin) => regex.test(origin)
}

const originMatchers = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://kreatifest-v1.vercel.app',
  'https://kreatifest-v1-v16n*.vercel.app',
  'https://kreatifest-zesn-g2j7azgph-tendy3.vercel.app/',
  ...(process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((pattern) => pattern.trim())
    .filter(Boolean),
].map((pattern) => ({ pattern, match: toOriginMatcher(pattern) }))

export function isOriginAllowed(origin) {
  if (!origin) return true
  const allowed = originMatchers.some(({ match }) => match(origin))
  if (!allowed) {
    // Log di server karena penolakan diam-diam hanya terlihat sebagai
    // kegagalan jaringan di browser.
    const configured = originMatchers.map(({ pattern }) => pattern).join(', ')
    console.warn(`CORS ditolak untuk origin: ${origin} (FRONTEND_ORIGINS: ${configured})`)
  }
  return allowed
}

app.set('trust proxy', trustProxyHops)
app.use(cors({
  // cors memanggil origin(req.headers.origin, callback), jadi callback WAJIB
  // dipanggil. Mengembalikan boolean secara langsung akan menggantung request.
  origin(origin, callback) {
    callback(null, isOriginAllowed(origin))
  },
}))

const newsLimiter = rateLimitMax > 0
  ? rateLimit({ windowMs: 60 * 1000, limit: rateLimitMax, standardHeaders: true, legacyHeaders: false })
  : (_request, _response, next) => next()

/**
 * Force refresh hanya boleh dipicu secara eksplisit.
 *
 * Cache-Control: no-cache TIDAK bisa dipakai sebagai penanda force, karena
 * browser dan fetch otomatis mengirim header itu pada setiap permintaan
 * kondisional (If-None-Match/If-Modified-Since). Kalau header itu diperlakukan
 * sebagai force, setiap reload halaman akan membatalkan TTL dan mengambil ulang
 * feed RSS, serta membuat ETag tidak pernah cocok sehingga 304 mustahil terjadi.
 */
export function wantsFreshData(request) {
  if (request.query.refresh === '1') return true
  if (request.headers['if-none-match'] || request.headers['if-modified-since']) return false
  return String(request.headers['cache-control'] || '').includes('no-cache')
}

app.get('/api/health', (_request, response) => {
  response.set('Cache-Control', 'no-store')
  response.json({ status: 'ok', rateLimitMax, ...getCacheStatus() })
})

app.get('/api/news', newsLimiter, async (request, response) => {
  const requestedLimit = Number(request.query.limit ?? 6)
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    return response.status(400).json({ error: 'Parameter limit harus berupa angka positif.' })
  }

  const force = wantsFreshData(request)

  try {
    const result = await getLatestNews(Math.min(requestedLimit, 12), { force })
    const etag = `"${createHash('sha1').update(`${result.updatedAt}|${requestedLimit}`).digest('hex')}"`

    response.set('Cache-Control', force ? 'no-store' : CACHED_CACHE_CONTROL)

    if (request.headers['if-none-match'] === etag) {
      return response.status(304).end()
    }

    response.set('ETag', etag)
    return response.json(result)
  } catch (error) {
    console.error('GET /api/news failed:', error.message)
    return response.status(503).json({ error: 'Sumber berita sedang tidak tersedia.' })
  }
})

export default app

if (!isServerless) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`News API listening on port ${port} (rate limit ${rateLimitMax}/menit)`)
    prewarmNews()
  })
}
