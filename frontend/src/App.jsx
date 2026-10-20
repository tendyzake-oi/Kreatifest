import { useEffect, useState } from 'react'
import { AUTH_TOKEN_KEY, authRequest } from './services/auth'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import LoginPage from './components/pages/LoginPage'
import RegisterPage from './components/pages/RegisterPage'
import DashboardPage from './components/pages/DashboardPage'

import Hero from './components/sections/Hero'
import News from './components/sections/News'
import Highlights from './components/sections/Highlights'
import About from './components/sections/About'
import Services from './components/sections/Services'
import Projects from './components/sections/Projects'
import Process from './components/sections/Process'
import Contact from './components/sections/Contact'

/**
 * Susunan halaman dari atas ke bawah.
 * Ingin memindah / menghapus section? Cukup ubah baris di bawah ini.
 */
export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname)
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)))
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return undefined

    let active = true
    authRequest('/auth/me', { token })
      .then(({ user }) => {
        if (active) {
          setSession({ token, user })
          setSessionError('')
        }
      })
      .catch((error) => {
        if (error.status === 401) {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          if (active) setSessionError('Sesi sudah berakhir. Silakan masuk kembali.')
        } else if (active) {
          setSessionError(error.message)
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })

    return () => { active = false }
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setPathname(path)
    window.scrollTo(0, 0)
  }

  const startSession = (result) => {
    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    setSession({ token: result.token, user: result.user })
    setSessionError('')
    navigate('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setSession(null)
    navigate('/login')
  }

  if (pathname === '/login') {
    return <LoginPage onLogin={startSession} onRegister={() => navigate('/register')} notice={sessionError} />
  }

  if (pathname === '/register') {
    return <RegisterPage onRegister={startSession} onLogin={() => navigate('/login')} />
  }

  if (pathname === '/dashboard') {
    if (authLoading) {
      return <main className="portal-auth-loading" role="status">Memeriksa sesi akun...</main>
    }
    if (!session) return <LoginPage onLogin={startSession} onRegister={() => navigate('/register')} notice={sessionError} />
    return <DashboardPage
      role={session.user.role}
      user={session.user}
      token={session.token}
      onLogout={logout}
      onLandingPage={() => navigate('/')}
      onUserUpdated={(updatedUser) => setSession((current) => current ? { ...current, user: updatedUser } : current)}
    />
  }

  return (
    <>
      <a className="skip-link" href="#main">Lewati ke konten utama</a>
      <Navbar user={session?.user} onNavigate={navigate} />

      <main id="main">
        <Hero />
        <News />
        <Highlights />
        <About />
        <Services />
        <Projects />

        <Process />

        {/*<Impact />
        <Testimonial />
        <CallToAction />*/}
        
        <Contact />
      </main>

      <Footer />
    </>
  )
}
