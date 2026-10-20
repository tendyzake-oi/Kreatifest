const apiBaseUrl = (import.meta.env.VITE_NEWS_API_URL || '').replace(/\/$/, '')

/**
 * Data fallback statis — ditampilkan saat API tidak tersedia agar berita
 * tetap muncul di landing page. Update artikel secara berkala sesuai kebutuhan.
 */
export const FALLBACK_NEWS = {
  articles: {
    indonesia: [
      {
        id: 'fallback-id-1',
        title: 'Strategi Digital Marketing untuk UMKM Indonesia di Era AI',
        description:
          'Perkembangan kecerdasan buatan membuka peluang baru bagi pelaku UMKM untuk meningkatkan jangkauan pemasaran digital secara lebih efisien dan terukur.',
        source: 'Marketing.co.id',
        region: 'indonesia',
        url: 'https://marketing.co.id',
        imageUrl: null,
        publishedAt: null,
        topic: 'MarTech & AI',
        topicKey: 'martech',
      },
      {
        id: 'fallback-id-2',
        title: 'Tren Media Sosial 2025: TikTok dan Instagram Tetap Dominan',
        description:
          'Riset terbaru menunjukkan TikTok dan Instagram masih menjadi platform pilihan utama brand Indonesia untuk kampanye pemasaran digital.',
        source: 'DailySocial',
        region: 'indonesia',
        url: 'https://dailysocial.id',
        imageUrl: null,
        publishedAt: null,
        topic: 'Media Sosial',
        topicKey: 'social',
      },
      {
        id: 'fallback-id-3',
        title: 'Panduan SEO Lokal untuk Bisnis Indonesia: Cara Muncul di Google Maps',
        description:
          'Optimasi SEO lokal kini menjadi kunci bagi bisnis kecil dan menengah agar mudah ditemukan pelanggan di area sekitar mereka.',
        source: 'Marketing.co.id',
        region: 'indonesia',
        url: 'https://marketing.co.id',
        imageUrl: null,
        publishedAt: null,
        topic: 'SEO & Search',
        topicKey: 'seo',
      },
    ],
    international: [
      {
        id: 'fallback-id-4',
        title: 'How AI Is Reshaping Digital Marketing Strategies in 2025',
        description:
          'Marketers are increasingly turning to AI-powered tools for content creation, audience targeting, and campaign optimization as competition intensifies.',
        source: 'Search Engine Journal',
        region: 'international',
        url: 'https://www.searchenginejournal.com',
        imageUrl: null,
        publishedAt: null,
        topic: 'MarTech & AI',
        topicKey: 'martech',
      },
      {
        id: 'fallback-id-5',
        title: 'Social Media Trends: What Brands Need to Know for Q4',
        description:
          'As Q4 approaches, brands are doubling down on short-form video, creator partnerships, and social commerce to capture holiday spending.',
        source: 'Social Media Today',
        region: 'international',
        url: 'https://www.socialmediatoday.com',
        imageUrl: null,
        publishedAt: null,
        topic: 'Media Sosial',
        topicKey: 'social',
      },
      {
        id: 'fallback-id-6',
        title: 'Content Marketing ROI: Measuring What Actually Matters',
        description:
          'New research reveals the metrics that correlate most strongly with revenue growth, helping marketers focus their content efforts where it counts.',
        source: 'HubSpot Marketing',
        region: 'international',
        url: 'https://blog.hubspot.com/marketing',
        imageUrl: null,
        publishedAt: null,
        topic: 'Konten & Kreator',
        topicKey: 'content',
      },
    ],
  },
  stale: true,
  updatedAt: null,
}

/**
 * Selalu meminta data terbaru: `cache: 'no-store'` menembus cache HTTP browser,
 * header `Cache-Control: no-cache` juga menembus cache proxy/CDN di tengah jalan.
 * Jika VITE_NEWS_API_URL tidak dikonfigurasi, lempar error agar komponen
 * menampilkan data fallback statis.
 */
export async function fetchLatestNews(signal) {
  if (!apiBaseUrl) {
    throw new Error('URL API berita belum dikonfigurasi.')
  }

  const response = await fetch(`${apiBaseUrl}/api/news?limit=6`, {
    signal,
    cache: 'no-store',
    headers: import.meta.env.DEV ? { 'Cache-Control': 'no-cache' } : {},
  })

  if (!response.ok) {
    throw new Error('Berita belum dapat dimuat. Coba lagi sebentar.')
  }

  return response.json()
}
