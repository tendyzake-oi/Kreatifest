const apiBaseUrl = (
  import.meta.env.VITE_AUTH_API_URL
  || import.meta.env.VITE_NEWS_API_URL
  || (import.meta.env.DEV ? '' : 'https://kreatifest-ay1r.onrender.com')
).replace(/\/$/, '')

export const AUTH_TOKEN_KEY = 'kreatifest-auth-token'

export async function authRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${apiBaseUrl}/api${path}`, {
      ...options,
      headers,
      cache: 'no-store',
    })
  } catch {
    throw new Error('Tidak dapat menghubungi server. Pastikan backend berjalan dan URL API sudah benar.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error(`Server mengembalikan respons yang tidak valid (HTTP ${response.status}).`)
  }

  if (!response.ok) {
    const error = new Error(result.error || `Permintaan gagal (HTTP ${response.status}).`)
    error.status = response.status
    throw error
  }
  return result
}