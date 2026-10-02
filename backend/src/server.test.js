import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'

// Set sebelum import supaya server.js tidak memanggil app.listen() dan daftar
// origin terbaca dari environment di bawah.
process.env.VERCEL = '1'
process.env.FRONTEND_ORIGINS = 'https://my-app*.vercel.app,https://www.domain.tld'

const serverModule = await import('./server.js')
const { isOriginAllowed, wantsFreshData } = serverModule
const app = serverModule.default

test('menerima origin frontend yang terdaftar', () => {
  assert.equal(isOriginAllowed('http://localhost:5173'), true)
  assert.equal(isOriginAllowed('http://127.0.0.1:5173'), true)
  assert.equal(isOriginAllowed('https://www.domain.tld'), true)
})

test('menerima domain production dan preview frontend Kreatifest', () => {
  assert.equal(isOriginAllowed('https://kreatifest-v1.vercel.app'), true)
  assert.equal(isOriginAllowed('https://kreatifest-v1-v16n.vercel.app'), true)
  assert.equal(isOriginAllowed('https://kreatifest-v1-v16n-git-main.vercel.app'), true)
})

test('menerima domain preview Vercel milik project yang sama', () => {
  assert.equal(isOriginAllowed('https://my-app.vercel.app'), true)
  assert.equal(isOriginAllowed('https://my-app-a1b2c3d4.vercel.app'), true)
})

test('menolak origin dari project Vercel lain', () => {
  // Wildcard hanya untuk label host milik project itu sendiri, bukan *.vercel.app
  assert.equal(isOriginAllowed('https://other-app.vercel.app'), false)
  assert.equal(isOriginAllowed('https://my-app.vercel.app.evil.example'), false)
  assert.equal(isOriginAllowed('https://evil.example'), false)
})

test('wildcard tidak boleh melewati titik', () => {
  assert.equal(isOriginAllowed('https://my-app.a.b.vercel.app'), false)
})

test('request tanpa Origin tetap diizinkan', () => {
  assert.equal(isOriginAllowed(undefined), true)
  assert.equal(isOriginAllowed(''), true)
})

test('middleware CORS menjawab request, bukan menggantung', async (context) => {
  const server = app.listen(0)
  await once(server, 'listening')
  context.after(() => server.close())

  const { port } = server.address()
  const call = (origin) => fetch(`http://127.0.0.1:${port}/api/health`, {
    headers: { Origin: origin },
    signal: AbortSignal.timeout(5000),
  })

  // CORSPredicate yang tidak memanggil callback akan membuat fetch ini
  // menggantung selamanya, jadi batas waktu di atas mengubahnya jadi kegagalan.
  const allowed = await call('https://my-app.vercel.app')
  assert.equal(allowed.status, 200)
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://my-app.vercel.app')

  const production = await call('https://kreatifest-v1-v16n.vercel.app')
  assert.equal(production.status, 200)
  assert.equal(production.headers.get('access-control-allow-origin'), 'https://kreatifest-v1-v16n.vercel.app')

  const rejected = await call('https://other-app.vercel.app')
  assert.equal(rejected.status, 200)
  assert.equal(rejected.headers.get('access-control-allow-origin'), null)
})

const request = (query = {}, headers = {}) => ({ query, headers })

test('force refresh hanya dipicu secara eksplisit', () => {
  assert.equal(wantsFreshData(request({ refresh: '1' })), true)
  assert.equal(wantsFreshData(request({}, { 'cache-control': 'no-cache' })), true)
  assert.equal(wantsFreshData(request()), false)
  assert.equal(wantsFreshData(request({}, { 'cache-control': 'max-age=0' })), false)
})

test('revalidasi kondisional bukan force refresh', () => {
  // Browser dan fetch otomatis menambah Cache-Control: no-cache pada
  // permintaan bersyarat. Kalau ini dianggap force, TTL 15 menit di produksi
  // selalu dilewati, publisher dibanjiri request, dan 304 tidak pernah terjadi.
  assert.equal(wantsFreshData(request({}, { 'if-none-match': '"abc"' })), false)
  assert.equal(wantsFreshData(request({}, {
    'if-none-match': '"abc"',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
  })), false)
  assert.equal(wantsFreshData(request({}, {
    'if-modified-since': 'Wed, 30 Sep 2026 07:00:00 GMT',
    'cache-control': 'no-cache',
  })), false)
})

test('force refresh eksplisit tetap menang dari header kondisional', () => {
  assert.equal(wantsFreshData(
    request({ refresh: '1' }, { 'if-none-match': '"abc"', 'cache-control': 'no-cache' }),
  ), true)
})
