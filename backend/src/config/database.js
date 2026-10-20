import mysql from 'mysql2/promise'

const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_NAME']
const missingVariables = requiredVariables.filter((name) => !process.env[name])
if (process.env.DB_PASSWORD === undefined) missingVariables.push('DB_PASSWORD')

if (missingVariables.length) {
  throw new Error(`Environment database belum lengkap: ${missingVariables.join(', ')}.`)
}

const port = Number(process.env.DB_PORT || 4000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT harus berupa nomor port yang valid.')
}

const sslSetting = process.env.DB_SSL || 'true'
if (!['true', 'false'].includes(sslSetting)) {
  throw new Error('DB_SSL harus bernilai true atau false.')
}
if (process.env.NODE_ENV === 'production' && sslSetting !== 'true') {
  throw new Error('DB_SSL=true wajib digunakan saat NODE_ENV=production.')
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslSetting === 'true' ? {} : undefined,
})

export default pool
