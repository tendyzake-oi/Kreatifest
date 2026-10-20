import { useEffect, useState } from 'react'
import { brand, navLinks } from '../../data/content'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import ThemeToggle from './ThemeToggle'
import './Navbar.css'

export default function Navbar({ user, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const dashboardLabel = user?.name || 'Dashboard'
  const navigateToDashboard = (event) => {
    closeMenu()
    if (!onNavigate) return
    event.preventDefault()
    onNavigate('/dashboard')
  }

  // Tutup menu mobile dengan tombol Escape
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <a href="#home" className="navbar__logo" onClick={closeMenu}>
          <img src={brand.logo} alt={brand.name} className="navbar__logo-img" />
          <span>{brand.name}</span>
        </a>

        <nav
          id="primary-nav"
          className={`navbar__menu ${menuOpen ? 'is-open' : ''}`}
          aria-label="Navigasi utama"
        >
          <ul className="navbar__links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={closeMenu}>{link.label}</a>
              </li>
            ))}
          </ul>
          {/* Tombol dashboard di dalam menu hanya tampil di mobile */}
          <Button href={user ? '/dashboard' : '/login'} icon="arrow-up-right" size="sm" className="navbar__cta navbar__cta--mobile" onClick={navigateToDashboard} aria-label={user ? `Dashboard ${user.name}` : 'Dashboard'}>
            {dashboardLabel}
          </Button>
        </nav>

        <div className="navbar__actions">
          <ThemeToggle />
          <Button href={user ? '/dashboard' : '/login'} icon="arrow-up-right" size="sm" className="navbar__cta navbar__cta--desktop" onClick={navigateToDashboard} aria-label={user ? `Dashboard ${user.name}` : 'Dashboard'}>
            {dashboardLabel}
          </Button>
          <button
            type="button"
            className="navbar__burger"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>
    </header>
  )
}
