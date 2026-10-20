import pool from '../config/database.js'

export default async function adminMiddleware(req, res, next) {
  const [rows] = await pool.execute(
    'SELECT role FROM users WHERE id = ? LIMIT 1',
    [req.userId],
  )
  if (!rows[0] || rows[0].role !== 'admin') {
    return res.status(403).json({ error: 'Akses hanya tersedia untuk admin.' })
  }
  return next()
}
