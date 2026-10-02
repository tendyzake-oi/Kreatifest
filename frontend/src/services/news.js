const apiBaseUrl = (import.meta.env.VITE_NEWS_API_URL || 'https://kreatifest.vercel.app/').replace(/\/$/, '')

/**
 * Selalu meminta data terbaru: `cache: 'no-store'` menembus cache HTTP browser,
 * header `Cache-Control: no-cache` juga menembus cache proxy/CDN di tengah jalan.
 */
export async function fetchLatestNews(signal) {
  const response = await fetch(`${apiBaseUrl}/api/news?limit=6`, {
    signal,
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })

  if (!response.ok) {
    throw new Error('Berita belum dapat dimuat. Coba lagi sebentar.')
  }

  return response.json()
}
