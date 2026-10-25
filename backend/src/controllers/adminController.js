import bcrypt from 'bcrypt'
import { timingSafeEqual } from 'node:crypto'
import pool from '../config/database.js'
import { isValidEmail, normalizeEmail, validateName, validatePassword, validatePhone } from '../utils/accountValidation.js'
import { isValidWhatsAppGroupUrl } from '../utils/appSettings.js'

function publicUser(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role || 'user', // Gunakan row.role jika ada, jika tidak default ke 'user'
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    loginCount: Number(row.login_count || 0),
  }
}

function isDuplicateEmail(error) {
  return error.code === 'ER_DUP_ENTRY'
}

export async function getSetupStatus(_req, res) {
  const [[state]] = await pool.execute('SELECT setup_complete FROM admin_setup_state WHERE id = 1')
  const [[admins]] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'")
  return res.json({
    available: Boolean(process.env.ADMIN_SETUP_KEY)
      && Boolean(state)
      && !Boolean(state.setup_complete)
      && Number(admins.total) === 0,
  })
}

export async function setupInitialAdmin(req, res) {
  const configuredKey = process.env.ADMIN_SETUP_KEY
  const providedKey = req.body?.setupKey
  if (!configuredKey || configuredKey.length < 32 || typeof providedKey !== 'string') {
    return res.status(503).json({ error: 'Setup admin awal belum dikonfigurasi di server.' })
  }
  const expected = Buffer.from(configuredKey)
  const received = Buffer.from(providedKey)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return res.status(401).json({ error: 'Kunci setup tidak valid.' })
  }

  const admin = req.body?.admin ?? {}
  if (!validateName(admin.name) || !isValidEmail(admin.email) || !validatePassword(admin.password)) {
    return res.status(400).json({ error: 'Nama, email, atau kata sandi admin tidak valid.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [stateRows] = await connection.execute(
      'SELECT setup_complete FROM admin_setup_state WHERE id = 1 FOR UPDATE',
    )
    const [adminRows] = await connection.execute(
      "SELECT id FROM users WHERE role = 'admin' FOR UPDATE",
    )
    if (!stateRows[0] || stateRows[0].setup_complete || adminRows.length > 0) {
      await connection.rollback()
      return res.status(409).json({ error: 'Setup admin awal sudah pernah dilakukan atau tidak tersedia.' })
    }

    const normalizedEmail = normalizeEmail(admin.email)
    const [existingRows] = await connection.execute(
      'SELECT id, password_hash FROM users WHERE email = ? FOR UPDATE',
      [normalizedEmail],
    )
    if (existingRows[0]) {
      if (!(await bcrypt.compare(admin.password, existingRows[0].password_hash))) {
        await connection.rollback()
        return res.status(401).json({
          error: 'Kata sandi akun yang sudah terdaftar tidak cocok. Masukkan kata sandi akun tersebut.',
        })
      }
      await connection.execute(
        "UPDATE users SET role = 'admin', session_version = session_version + 1 WHERE id = ?",
        [existingRows[0].id],
      )
    } else {
      const passwordHash = await bcrypt.hash(admin.password, 12)
      await connection.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
        [admin.name.trim(), normalizedEmail, passwordHash],
      )
    }
    await connection.execute('UPDATE admin_setup_state SET setup_complete = TRUE WHERE id = 1')
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    if (isDuplicateEmail(error)) {
      return res.status(409).json({ error: 'Email sudah terdaftar.' })
    }
    throw error
  } finally {
    connection.release()
  }

  return res.status(201).json({ message: 'Akun admin awal berhasil disiapkan. Silakan masuk sebagai admin.' })
}

export async function getOverview(_req, res) {
  const [[users]] = await pool.execute('SELECT COUNT(*) AS total FROM users')
  const [[logins]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM login_events WHERE logged_at >= CURRENT_DATE()',
  )
  return res.json({
    users: Number(users.total),
    loginsToday: Number(logins.total),
  })
}

export async function listUsers(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const [rows] = search
    ? await pool.execute(
      `SELECT id, name, email, phone, role, created_at, last_login_at, login_count FROM users
       WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC, id DESC`,
      [`%${search}%`, `%${search}%`],
    )
    : await pool.execute(
      'SELECT id, name, email, phone, role, created_at, last_login_at, login_count FROM users ORDER BY created_at DESC, id DESC',
    )
  return res.json({ users: rows.map(publicUser) })
}

export async function createUser(req, res) {
  const { name, email, password, role = 'user', phone = '' } = req.body ?? {}
  if (!validateName(name) || !isValidEmail(email) || !validatePassword(password)) {
    return res.status(400).json({ error: 'Nama, email, atau kata sandi tidak valid.' })
  }
  if (typeof phone !== 'string' || (phone.trim() !== '' && !validatePhone(phone))) {
    return res.status(400).json({ error: 'Nomor telepon harus berisi 8 sampai 15 digit.' })
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Peran akun tidak valid.' })
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), normalizeEmail(email), phone.trim(), passwordHash, role],
    )
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, role, created_at, last_login_at, login_count FROM users WHERE id = ? LIMIT 1',
      [result.insertId],
    )
    return res.status(201).json({ user: publicUser(rows[0]) })
  } catch (error) {
    if (isDuplicateEmail(error)) return res.status(409).json({ error: 'Email sudah digunakan akun lain.' })
    throw error
  }
}

export async function importUsers(req, res) {
  const rawList = Array.isArray(req.body?.users) ? req.body.users : []
  if (rawList.length === 0) {
    return res.status(400).json({ error: 'Tidak ada data pengguna yang valid untuk diimpor.' })
  }

  const createdUsers = []
  const updatedUsers = []
  const failedUsers = []

  for (const item of rawList) {
    const { name, email, role = 'user', phone = '', password = 'Kreatifest123!' } = item
    if (!validateName(name) || !isValidEmail(email)) {
      failedUsers.push({ email, reason: 'Nama atau format email tidak valid' })
      continue
    }
    const cleanRole = role === 'admin' ? 'admin' : 'user'
    const cleanPhone = typeof phone === 'string' && validatePhone(phone) ? phone.trim() : ''
    const cleanPass = typeof password === 'string' && password.length >= 8 ? password : 'Kreatifest123!'
    const normalizedEmail = normalizeEmail(email)

    try {
      const [existing] = await pool.execute('SELECT id, role, phone FROM users WHERE email = ? LIMIT 1', [normalizedEmail])
      if (existing.length > 0) {
        const existingId = existing[0].id
        const finalPhone = cleanPhone || existing[0].phone || ''
        await pool.execute(
          `UPDATE users SET name = ?, phone = ?, role = ?,
           session_version = session_version + IF(role <> ?, 1, 0) WHERE id = ?`,
          [name.trim(), finalPhone, cleanRole, cleanRole, existingId],
        )
        const [rows] = await pool.execute(
          'SELECT id, name, email, phone, role, created_at, last_login_at, login_count FROM users WHERE id = ? LIMIT 1',
          [existingId],
        )
        updatedUsers.push(publicUser(rows[0]))
      } else {
        const passwordHash = await bcrypt.hash(cleanPass, 12)
        const [result] = await pool.execute(
          'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
          [name.trim(), normalizedEmail, cleanPhone, passwordHash, cleanRole],
        )
        const [rows] = await pool.execute(
          'SELECT id, name, email, phone, role, created_at, last_login_at, login_count FROM users WHERE id = ? LIMIT 1',
          [result.insertId],
        )
        createdUsers.push(publicUser(rows[0]))
      }
    } catch (err) {
      failedUsers.push({ email, reason: err.message || 'Gagal menyimpan ke database' })
    }
  }

  return res.json({
    message: 'Berhasil memproses import: ' + createdUsers.length + ' akun baru dibuat, ' + updatedUsers.length + ' akun diperbarui.' + (failedUsers.length ? ' ' + failedUsers.length + ' akun dilewati.' : ''),
    createdCount: createdUsers.length,
    updatedCount: updatedUsers.length,
    failedCount: failedUsers.length,
    createdUsers,
    updatedUsers,
    failedUsers,
  })
}

export async function updateUser(req, res) {
  const { name, email, role, phone = '' } = req.body ?? {}
  const userId = req.params.id
  if (!/^\d+$/.test(userId)) return res.status(400).json({ error: 'ID akun tidak valid.' })
  if (!validateName(name) || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Nama atau email tidak valid.' })
  }
  if (typeof phone !== 'string' || (phone.trim() !== '' && !validatePhone(phone))) {
    return res.status(400).json({ error: 'Nomor telepon harus berisi 8 sampai 15 digit.' })
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Peran akun tidak valid.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [adminRows] = await connection.execute(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE",
    )
    const [rows] = await connection.execute(
      'SELECT id, role FROM users WHERE id = ? FOR UPDATE',
      [userId],
    )
    if (!rows[0]) {
      await connection.rollback()
      return res.status(404).json({ error: 'Akun tidak ditemukan.' })
    }
    if (String(userId) === String(req.userId) && role !== 'admin') {
      await connection.rollback()
      return res.status(409).json({ error: 'Anda tidak dapat mengubah role admin pada akun yang sedang digunakan.' })
    }
    if (rows[0].role === 'admin' && role === 'user' && adminRows.length <= 1) {
      await connection.rollback()
      return res.status(409).json({ error: 'Admin terakhir tidak dapat diubah menjadi pengguna.' })
    }

    await connection.execute(
      `UPDATE users SET name = ?, email = ?, phone = ?,
       session_version = session_version + IF(role <> ?, 1, 0), role = ? WHERE id = ?`,
      [name.trim(), normalizeEmail(email), phone.trim(), role, role, userId],
    )
    const [updatedRows] = await connection.execute(
      'SELECT id, name, email, phone, role, created_at, last_login_at, login_count FROM users WHERE id = ? LIMIT 1',
      [userId],
    )
    await connection.commit()
    return res.json({ user: publicUser(updatedRows[0]) })
  } catch (error) {
    await connection.rollback()
    if (isDuplicateEmail(error)) return res.status(409).json({ error: 'Email sudah digunakan akun lain.' })
    throw error
  } finally {
    connection.release()
  }
}

export async function deleteUser(req, res) {
  const userId = req.params.id
  if (!/^\d+$/.test(userId)) return res.status(400).json({ error: 'ID akun tidak valid.' })
  if (String(req.userId) === userId) {
    return res.status(409).json({ error: 'Admin tidak dapat menghapus akunnya sendiri.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [adminRows] = await connection.execute(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE",
    )
    const [rows] = await connection.execute(
      'SELECT id, role FROM users WHERE id = ? FOR UPDATE',
      [userId],
    )
    if (!rows[0]) {
      await connection.rollback()
      return res.status(404).json({ error: 'Akun tidak ditemukan.' })
    }
    if (rows[0].role === 'admin' && adminRows.length <= 1) {
      await connection.rollback()
      return res.status(409).json({ error: 'Admin terakhir tidak dapat dihapus.' })
    }

    await connection.execute('DELETE FROM projects WHERE owner_user_id = ?', [userId])
    await connection.execute('DELETE FROM users WHERE id = ?', [userId])
    await connection.commit()
    return res.json({ message: 'Akun dan proyek terkait berhasil dihapus.' })
  } catch (error) {
    await connection.rollback()
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Akun memiliki proyek. Hapus atau pindahkan proyek terlebih dahulu.' })
    }
    throw error
  } finally {
    connection.release()
  }
}

export async function listProjects(_req, res) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.owner_user_id, p.name, p.category, p.status, p.progress, p.due_date,
      p.created_at, p.updated_at, u.name AS owner_name, u.email AS owner_email
     FROM projects p JOIN users u ON u.id = p.owner_user_id
     ORDER BY p.updated_at DESC, p.id DESC`,
  )
  return res.json({ projects: rows.map((row) => ({
    ...row,
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
  })) })
}

export async function createProject(req, res) {
  const { ownerUserId, name, category, dueDate = null } = req.body ?? {}
  if (!/^\d+$/.test(String(ownerUserId ?? ''))) {
    return res.status(400).json({ error: 'ID pengguna pemilik proyek tidak valid.' })
  }
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 180
    || typeof category !== 'string' || !category.trim() || category.trim().length > 100) {
    return res.status(400).json({ error: 'Nama proyek dan kategori wajib diisi.' })
  }
  if (dueDate !== null && (typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))) {
    return res.status(400).json({ error: 'Tanggal tenggat tidak valid.' })
  }

  const [result] = await pool.execute(
    'INSERT INTO projects (owner_user_id, name, category, due_date) VALUES (?, ?, ?, ?)',
    [ownerUserId, name.trim(), category.trim(), dueDate],
  )
  const [rows] = await pool.execute(
    `SELECT id, owner_user_id, name, category, status, progress, due_date, created_at, updated_at
     FROM projects WHERE id = ? LIMIT 1`,
    [result.insertId],
  )
  return res.status(201).json({ project: { ...rows[0], id: String(rows[0].id), ownerUserId: String(rows[0].owner_user_id) } })
}

export async function listActivities(_req, res) {
  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.description, a.visibility, a.created_at, p.name AS project_name, u.name AS actor_name
     FROM activities a
     LEFT JOIN projects p ON p.id = a.project_id
     LEFT JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC, a.id DESC LIMIT 100`,
  )
  return res.json({ activities: rows.map((row) => ({ ...row, id: String(row.id) })) })
}

export async function listLogins(_req, res) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, email, role, logged_at
     FROM login_events ORDER BY logged_at DESC, id DESC LIMIT 200`,
  )
  return res.json({ logins: rows.map((row) => ({
    ...row,
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
  })) })
}

export async function getSettings(_req, res) {
  const [rows] = await pool.execute(
    "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('whatsapp_group_url', 'admin_email')",
  )
  const settings = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]))
  return res.json({
    whatsappGroupUrl: settings.whatsapp_group_url || '',
    adminEmail: settings.admin_email || process.env.ADMIN_EMAIL || 'kreatifest.ind@gmail.com',
  })
}

export async function updateWhatsAppGroup(req, res) {
  const { url } = req.body ?? {}
  if (typeof url !== 'string' || !isValidWhatsAppGroupUrl(url.trim())) {
    return res.status(400).json({ error: 'Masukkan tautan undangan grup WhatsApp yang valid (https://chat.whatsapp.com/...).' })
  }

  await pool.execute(
    `INSERT INTO app_settings (setting_key, setting_value) VALUES ('whatsapp_group_url', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [url.trim()],
  )
  return res.json({ whatsappGroupUrl: url.trim() })
}

export async function updateOwnPassword(req, res) {
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
