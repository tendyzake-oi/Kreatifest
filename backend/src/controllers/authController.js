import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { isValidEmail, normalizeEmail, validateName, validatePassword, validatePhone } from '../utils/accountValidation.js'

function publicUser(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    createdAt: row.created_at,
  }
}

function createToken(user) {
  return jwt.sign({ sessionVersion: Number(user.session_version) }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(user.id),
    issuer: 'kreatifest',
    expiresIn: '10h',
  })
}

function isDuplicateEmail(error) {
  return error.code === 'ER_DUP_ENTRY'
}

export async function register(req, res) {
  const { name, email, phone, password } = req.body ?? {}
  if (!validateName(name)) {
    return res.status(400).json({ error: 'Nama wajib diisi dan maksimal 120 karakter.' })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Format email tidak valid.' })
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'Nomor telepon wajib diisi dengan 8 sampai 15 digit.' })
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Kata sandi harus minimal 8 karakter dan maksimal 72 byte.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name.trim(), normalizeEmail(email), phone.trim(), passwordHash],
    )
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, role, created_at, session_version FROM users WHERE id = ? LIMIT 1',
      [result.insertId],
    )
    return res.status(201).json({
      token: createToken(rows[0]),
      user: publicUser(rows[0]),
    })
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.' })
    }
    throw error
  }
}

export async function login(req, res) {
  const { email, password, expectedRole } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' })
  }
  if (expectedRole !== undefined && expectedRole !== null && !['user', 'admin'].includes(expectedRole)) {
    return res.status(400).json({ error: 'Jenis login tidak valid.' })
  }
  if (!isValidEmail(email) || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Email atau kata sandi tidak valid.' })
  }

  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, password_hash, role, created_at, session_version FROM users WHERE email = ? LIMIT 1',
    [normalizeEmail(email)],
  )
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Email atau kata sandi salah.' })
  }
  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({
      error: expectedRole === 'admin'
        ? 'Akun ini belum memiliki akses admin. Silakan masuk sebagai pengguna.'
        : 'Akun ini adalah admin. Silakan pilih jenis akun admin.',
    })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?',
      [user.id],
    )
    await connection.execute(
      'INSERT INTO login_events (user_id, email, role) VALUES (?, ?, ?)',
      [user.id, user.email, user.role],
    )
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
  return res.json({ token: createToken(user), user: publicUser(user) })
}

export async function me(req, res) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1',
    [req.userId],
  )
  if (!rows[0]) return res.status(401).json({ error: 'Sesi tidak lagi valid. Silakan masuk kembali.' })
  return res.json({ user: publicUser(rows[0]) })
}

export async function updateMyProfile(req, res) {
  const { name, email, phone } = req.body ?? {}
  if (!validateName(name)) {
    return res.status(400).json({ error: 'Nama wajib diisi dan maksimal 120 karakter.' })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Format email tidak valid.' })
  }
  if (typeof phone !== 'string' || (phone.trim() !== '' && !validatePhone(phone))) {
    return res.status(400).json({ error: 'Nomor telepon harus berisi 8 sampai 15 digit.' })
  }

  try {
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name.trim(), normalizeEmail(email), phone.trim(), req.userId],
    )
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return res.status(409).json({ error: 'Email sudah digunakan akun lain.' })
    }
    throw error
  }

  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1',
    [req.userId],
  )
  if (!rows[0]) return res.status(404).json({ error: 'Akun tidak ditemukan.' })
  return res.json({ user: publicUser(rows[0]), message: 'Informasi akun berhasil diperbarui.' })
}

export async function getMyProjects(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, name, category, status, progress, due_date, created_at, updated_at
     FROM projects WHERE owner_user_id = ? ORDER BY updated_at DESC, id DESC`,
    [req.userId],
  )
  return res.json({ projects: rows.map((row) => ({ ...row, id: String(row.id), ownerUserId: req.userId })) })
}

export async function getMyActivities(req, res) {
  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.description, a.visibility, a.created_at, p.name AS project_name
     FROM activities a
     LEFT JOIN projects p ON p.id = a.project_id
     WHERE a.visibility IN ('all', 'client')
       AND (a.project_id IS NULL OR p.owner_user_id = ?)
     ORDER BY a.created_at DESC, a.id DESC LIMIT 50`,
    [req.userId],
  )
  return res.json({ activities: rows.map((row) => ({ ...row, id: String(row.id) })) })
}

export async function getMySettings(_req, res) {
  const [rows] = await pool.execute(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'whatsapp_group_url' LIMIT 1",
  )
  return res.json({
    whatsappGroupUrl: rows[0]?.setting_value || '',
    adminEmail: process.env.ADMIN_EMAIL || 'kreatifest.ind@gmail.com',
  })
}

export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body ?? {}
  if (typeof currentPassword !== 'string' || !currentPassword || Buffer.byteLength(currentPassword, 'utf8') > 72) {
    return res.status(400).json({ error: 'Kata sandi saat ini wajib diisi.' })
  }
  if (!validatePassword(newPassword)) {
    return res.status(400).json({ error: 'Kata sandi baru harus minimal 8 karakter dan maksimal 72 byte.' })
  }

  const [rows] = await pool.execute(
    'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
    [req.userId],
  )
  if (!rows[0]) return res.status(404).json({ error: 'Akun tidak ditemukan.' })
  if (!(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Kata sandi saat ini salah.' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await pool.execute(
    'UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?',
    [passwordHash, req.userId],
  )
  return res.json({ message: 'Kata sandi berhasil diperbarui. Silakan masuk kembali.' })
}

export async function deleteMyAccount(req, res) {
  const { confirmation } = req.body ?? {}
  if (typeof confirmation !== 'string' || confirmation.trim().toLowerCase() !== 'hapus akun') {
    return res.status(400).json({ error: 'Ketik "hapus akun" untuk mengonfirmasi penghapusan.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [users] = await connection.execute(
      'SELECT id, name, role FROM users WHERE id = ? FOR UPDATE',
      [req.userId],
    )
    if (!users[0]) {
      await connection.rollback()
      return res.status(404).json({ error: 'Akun tidak ditemukan.' })
    }
    if (users[0].role === 'admin') {
      await connection.rollback()
      return res.status(403).json({ error: 'Penghapusan akun admin harus dilakukan oleh admin lain.' })
    }

    await connection.execute('DELETE FROM projects WHERE owner_user_id = ?', [req.userId])
    await connection.execute('DELETE FROM users WHERE id = ?', [req.userId])
    await connection.commit()
    return res.json({ message: `Akun ${users[0].name} dan proyek terkait berhasil dihapus.` })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
