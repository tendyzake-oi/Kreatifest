import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

export default async function authMiddleware(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token autentikasi diperlukan.' })
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'kreatifest',
    })
  } catch {
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan masuk kembali.' })
  }

  if (
    typeof payload !== 'object'
    || typeof payload.sub !== 'string'
    || (payload.sessionVersion !== undefined
      && (!Number.isInteger(payload.sessionVersion) || payload.sessionVersion < 0))
  ) {
    return res.status(401).json({ error: 'Token autentikasi tidak valid.' })
  }

  const [rows] = await pool.execute(
    'SELECT session_version FROM users WHERE id = ? LIMIT 1',
    [payload.sub],
  )
  if (!rows[0] || Number(rows[0].session_version) !== (payload.sessionVersion ?? 0)) {
    return res.status(401).json({ error: 'Sesi tidak lagi valid. Silakan masuk kembali.' })
  }

  req.userId = payload.sub
  return next()
}
