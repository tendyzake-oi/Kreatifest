import express from 'express'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET wajib diisi dengan minimal 32 karakter.')
}

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))

app.use('/auth', authRoutes)
app.use('/admin', adminRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' })
})

app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500
  if (status === 500) console.error('Kesalahan API autentikasi:', error)
  res.status(status).json({
    error: status === 500 ? 'Terjadi kesalahan pada server.' : error.message,
  })
})

export default app
