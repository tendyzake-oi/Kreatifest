import { useState } from 'react'
import { brand } from '../../data/content'
import { authRequest } from '../../services/auth'
import Icon from '../ui/Icon'
import './Portal.css'

export default function RegisterPage({ onRegister, onLogin }) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const password = form.elements.password.value
    const confirmPassword = form.elements.confirmPassword

    confirmPassword.setCustomValidity(
      password === confirmPassword.value ? '' : 'Konfirmasi kata sandi tidak cocok.',
    )
    if (!form.reportValidity()) return
    setError('')
    setSubmitting(true)
    try {
      const result = await authRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.elements.name.value,
          email: form.elements.email.value,
          phone: form.elements.phone.value,
          password,
        }),
      })
      onRegister(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="portal-login">
      <section className="portal-login__intro" aria-label="Bergabung dengan Kreatifest">
        <a className="portal-brand" href="/">
          <img src={brand.logo} alt="" />
          <span>{brand.name}</span>
        </a>
        <div className="portal-login__message">
          <span className="portal-eyebrow"><span /> Mulai berkolaborasi</span>
          <h1>Setiap karya<br /><em>dimulai dari ide.</em></h1>
          <p>Buat akun untuk bergabung dengan komunitas kreatifest serta fitur lainnya</p>
          <div className="portal-login__note">
            <Icon name="sparkles" size={20} />
            <span>Satu ruang untuk menyatukan ide, proses, dan hasil kreatif Anda.</span>
          </div>
        </div>
        <span className="portal-login__copyright">© {new Date().getFullYear()} Kreatifest Indonesia</span>
      </section>

      <section className="portal-login__form-wrap">
        <button className="portal-back-link" type="button" onClick={onLogin}>
          <Icon name="arrow-right" size={16} /> Kembali ke login
        </button>
        <div className="portal-register__content">
          <span className="portal-eyebrow">Bergabung dengan kami</span>
          <h2>Buat akun baru</h2>
          <p>Isi detail berikut untuk membuat akun dan bergabung dengan komunitas Kreatifest.</p>

          <form className="portal-form" onSubmit={handleSubmit}>
            <label htmlFor="register-name">Nama lengkap</label>
            <input id="register-name" name="name" type="text" placeholder="Nama Anda" autoComplete="name" required />

            <label htmlFor="register-email">Email</label>
            <input id="register-email" name="email" type="email" placeholder="nama@email.com" autoComplete="email" required />

            <label htmlFor="register-phone">Nomor telepon / WhatsApp</label>
            <input id="register-phone" name="phone" type="tel" placeholder="+62 812-3456-7890" autoComplete="tel" inputMode="tel" pattern="[0-9+(). -]{8,24}" title="Masukkan nomor telepon dengan 8 sampai 15 digit." required />

            <label htmlFor="register-password">Kata sandi</label>
            <input id="register-password" name="password" type="password" placeholder="Minimal 8 karakter" autoComplete="new-password" minLength={8} required onChange={(event) => {
              const confirmPassword = event.currentTarget.form.elements.confirmPassword
              confirmPassword.setCustomValidity('')
            }} />

            <label htmlFor="register-confirm-password">Konfirmasi kata sandi</label>
            <input id="register-confirm-password" name="confirmPassword" type="password" placeholder="Ulangi kata sandi" autoComplete="new-password" minLength={8} required onChange={(event) => event.currentTarget.setCustomValidity('')} />

            {error && <p className="portal-form__error" role="alert">{error}</p>}
            <button className="portal-submit" type="submit" disabled={submitting}>
              {submitting ? 'Membuat akun...' : 'Buat akun'} <Icon name="arrow-up-right" size={18} />
            </button>
          </form>

          <p className="portal-register__notice" role="status">
            <Icon name="info" size={17} />
            Pendaftaran membuat akun pengguna baru. Peran admin hanya dapat diberikan oleh administrator.
          </p>
          <p className="portal-login__help">Sudah punya akun? <button type="button" onClick={onLogin}>Masuk</button></p>
        </div>
      </section>
    </main>
  )
}
