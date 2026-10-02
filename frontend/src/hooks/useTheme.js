import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'kreatifest-theme'

/** Tema awal: yang tersimpan → preferensi sistem → terang. */
function getInitialTheme() {
  // index.html sudah memasang data-theme sebelum React jalan; pakai itu dulu.
  const fromDom = document.documentElement.getAttribute('data-theme')
  if (fromDom === 'light' || fromDom === 'dark') return fromDom
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Hook tema terang/gelap.
 * Mengembalikan { theme, isDark, toggleTheme }.
 * Efeknya: mengubah <html data-theme> dan menyimpan pilihan ke localStorage.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* localStorage bisa diblokir (mode privat) — abaikan */
    }
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    [],
  )

  return { theme, isDark: theme === 'dark', toggleTheme }
}
