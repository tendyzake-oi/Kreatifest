import Icon from '../ui/Icon'
import useTheme from '../../hooks/useTheme'
import './ThemeToggle.css'

/**
 * Tombol pengganti tema terang/gelap.
 * Ikon bulan tampil saat tema terang (klik → gelap), ikon matahari saat gelap.
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={20} />
    </button>
  )
}
