import { useState } from 'react'
import { brand } from '../../data/content'
import { authRequest } from '../../services/auth'
import Icon from '../ui/Icon'
import './Portal.css'

export default function LoginPage({ onLogin, onRegister, notice = '' }) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      let result
      try {
        // First try standard login without expectedRole
        result = await authRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
      } catch (firstErr) {
        // Fallback in case deployed backend still requires expectedRole: 'admin'
        if (
          firstErr.status === 403 &&
          (firstErr.message?.toLowerCase().includes('admin') ||
            firstErr.message?.toLowerCase().includes('pilih jenis akun'))
        ) {
          result = await authRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, expectedRole: 'admin' }),
          })
        } else {
          throw firstErr
        }
      }
      onLogin(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="portal-login">
      <section className="portal-login__intro" aria-label="Tentang Kreatifest">
        <a className="portal-brand" href="/">
          <img src={brand.logo} alt="" />
          <span>{brand.name}</span>
        </a>
        <div className="portal-login__message">
          <span className="portal-eyebrow"><span /> Ruang kolaborasi Kreatifest</span>
          <h1>Ide kreatif,<br /><em>langkah nyata.</em></h1>
          <p>Masuk ke Dashboard Anda untuk mengikuti perkembangan serta berkolaborasi dengan tim kreatifest</p>
          <div className="portal-login__note">
            <Icon name="sparkles" size={20} />
            <span>Tempat ide baik tumbuh menjadi karya yang berdampak.</span>
          </div>
        </div>
        <span className="portal-login__copyright">© {new Date().getFullYear()} Kreatifest Indonesia</span>
      </section>

      <section className="portal-login__form-wrap">
        <a className="portal-back-link" href="/" aria-label="Kembali ke halaman utama">
          <Icon name="arrow-right" size={16} /> Kembali ke halaman utama
        </a>
        <div className="portal-login__form-content">
          <span className="portal-eyebrow">Selamat datang kembali</span>
          <h2>Masuk ke akun Anda</h2>
          <p className="portal-login__subtitle">Masukkan email dan kata sandi untuk melanjutkan.</p>

          <form className="portal-form" onSubmit={handleSubmit}>
            <label htmlFor="portal-email">Email</label>
            <input id="portal-email" name="email" type="email" placeholder="nama@email.com" autoComplete="email" required />

            <div className="portal-form__password-label">
              <label htmlFor="portal-password">Kata sandi</label>
              <button type="button" className="portal-text-button" onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <div className="portal-password">
              <input
                id="portal-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
                required
              />
              <Icon name="info" size={18} />
            </div>

            {error && <p className="portal-form__error" role="alert">{error}</p>}
            <button className="portal-submit" type="submit" disabled={submitting}>
              {submitting ? 'Memeriksa akun...' : 'Masuk'}
              <Icon name="arrow-up-right" size={18} />
            </button>
          </form>

          {notice
            ? <p className="portal-form__error" role="status">{notice}</p>
            : <p className="portal-demo-notice"><Icon name="info" size={16} />Login terhubung ke server. Gunakan akun yang sudah terdaftar.</p>}
          <p className="portal-login__help">Belum punya akun? <button type="button" onClick={onRegister}>Daftar sekarang</button></p>
        </div>
      </section>
    </main>
  )
}
