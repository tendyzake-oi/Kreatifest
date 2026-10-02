import Parser from 'rss-parser'

const FEED_TIMEOUT_MS = 8000
const STALE_CACHE_TTL_MS = 6 * 60 * 60 * 1000
// Default 0 menit: setiap request Stateless meng-fetch feed terbaru.
// Set CACHE_TTL_MS=15 di produksi agar tidak membebani publisher.
const CACHE_TTL_MS = Math.max(0, Number(process.env.CACHE_TTL_MS) || 0) * 60 * 1000
// Batas item yang dibaca per sumber, supaya cache tidak membengkak.
const SOURCE_ITEM_LIMIT = 25
// Permintaan paksa yang datang saat refresh masih berjalan boleh ikut memakai
// hasil refresh tersebut selama belum terlalu basi.
const FORCE_JOIN_WINDOW_MS = 10 * 1000

const sources = [
  { name: 'Search Engine Journal', region: 'international', url: 'https://www.searchenginejournal.com/feed/' },
  { name: 'Social Media Today', region: 'international', url: 'https://www.socialmediatoday.com/feeds/news/' },
  { name: 'HubSpot Marketing', region: 'international', url: 'https://blog.hubspot.com/marketing/rss.xml' },
  { name: 'Marketing.co.id', region: 'indonesia', url: 'https://marketing.co.id/feed/' },
  { name: 'DailySocial', region: 'indonesia', url: 'https://dailysocial.id/feed' },
]

const parser = new Parser()

const topics = [
  {
    key: 'seo',
    label: 'SEO & Search',
    pattern: /\bseo\b|search engine|organic search|google search|ai search/i,
  },
  {
    key: 'social',
    label: 'Media Sosial',
    pattern: /social media|instagram|tiktok|facebook|linkedin|youtube|snapchat|reddit/i,
  },
  {
    key: 'content',
    label: 'Konten & Kreator',
    pattern: /content|creator|influencer|video marketing|newsletter/i,
  },
  {
    key: 'ads',
    label: 'Iklan Digital',
    pattern: /\bppc\b|paid media|paid search|advertis|\bads\b|campaign|\bcpc\b/i,
  },
  {
    key: 'analytics',
    label: 'Analitik',
    pattern: /analytics|attribution|measurement|data and|\bdata\b|conversion/i,
  },
  {
    key: 'commerce',
    label: 'E-commerce',
    pattern: /e-commerce|ecommerce|retail media|online store|shopping/i,
  },
  {
    key: 'martech',
    label: 'MarTech & AI',
    pattern: /\bai\b|artificial intelligence|marketing technology|\bmartech\b|automation|kecerdasan buatan|agen ai/i,
  },
  {
    key: 'marketing',
    label: 'Strategi Marketing',
    pattern: /digital marketing|pemasaran digital|marketing|pemasaran|brand|campaign|kampanye|customer experience|pengalaman pelanggan|cmo|public relations|\bpr\b/i,
  },
]

const digitalMarketingPattern = /digital marketing|pemasaran digital|\bseo\b|search engine|social media|media sosial|instagram|tiktok|facebook|linkedin|youtube|creator|influencer|content marketing|konten digital|campaign|kampanye|advertising|advertisement|paid media|paid search|\bppc\b|\bcpc\b|\bads?\b|martech|marketing automation|marketing strategy|strategi marketing|strategi pemasaran|branding|brand strategy|brand campaign|e-?commerce|retail media|email marketing|customer acquisition|customer engagement|konversi|conversion|marketing analytics|marketing metrics|marketing measurement|digital pr|public relations/i

let cachedArticles = []
let cacheUpdatedAt = null
let cacheIsStale = false
let lastRefreshAt = 0
let lastSuccessfulRefreshAt = 0
let refreshInProgress = null
let refreshStartedAt = 0

function cleanText(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getTopic(article) {
  const searchableText = getSearchableText(article)

  return topics.find((topic) => topic.pattern.test(searchableText)) || {
    key: 'marketing',
    label: 'Strategi Marketing',
  }
}

function getSearchableText(article) {
  const categories = Array.isArray(article.categories) ? article.categories.join(' ') : ''
  const title = cleanText(article.title || '')
    .replace(/\s+via\s+@sejournal(?:,\s*@[a-z0-9_.-]+)*$/i, '')
  const description = cleanText(article.description || article.contentSnippet || article.summary || article.content || '')
    .replace(/^Marketing\.co\.id\s*[–—-]\s*Berita[^|]*\|\s*/i, '')
    .replace(/\s+The post\b.+?\bappeared first on\b.+$/i, '')
  return `${title} ${description} ${categories}`
}

export function normalizeArticle(item, source) {
  let articleUrl
  try {
    articleUrl = new URL(item.link)
  } catch {
    return null
  }

  if (articleUrl.protocol !== 'https:') return null

  const title = cleanText(item.title || '')
    .replace(/\s+via\s+@sejournal(?:,\s*@[a-z0-9_.-]+)*$/i, '')
    .trim()
  if (!title) return null

  const publishedDate = new Date(item.isoDate || item.pubDate || '')
  const publishedAt = Number.isNaN(publishedDate.getTime()) ? null : publishedDate.toISOString()
  const feedSummary = cleanText(item.contentSnippet || item.summary || '')
  const feedContent = item.content || item['content:encoded'] || ''
  const description = cleanText(
      /^dear (?:subscribers?|innovators),?\s*/i.test(feedSummary) ? feedContent : feedSummary || feedContent,
  )
    .replace(/^Dear (?:subscribers?|innovators),?\s*/i, '')
    .replace(/\s+The post\b.+?\bappeared first on\b.+$/i, '')
    .trim()
  // Filter relevansi hanya boleh melihat judul, ringkasan bersih, dan kategori.
  // Jika HTML mentah ikut diuji, hampir semua artikel akan lolos.
  const relevanceItem = { ...item, title, description, contentSnippet: undefined, content: undefined, summary: undefined }
  if (!digitalMarketingPattern.test(getSearchableText(relevanceItem))) return null
  const topic = getTopic(relevanceItem)
  const contentImage = feedContent.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1]
  const imageCandidates = [
    item.enclosure?.url,
    item['media:content']?.url,
    item['media:content']?.$?.url,
    item['media:thumbnail']?.url,
    item['media:thumbnail']?.$?.url,
    contentImage,
  ]
  const imageUrl = imageCandidates.find((candidate) => {
    try {
      return new URL(candidate).protocol === 'https:'
    } catch {
      return false
    }
  }) || null

  return {
    id: articleUrl.href,
    title,
    description: description.slice(0, 240),
    source: typeof source === 'string' ? source : source.name,
    region: typeof source === 'string' ? 'international' : source.region,
    url: articleUrl.href,
    imageUrl,
    publishedAt,
    topic: topic.label,
    topicKey: topic.key,
  }
}

export function sortAndDedupeArticles(articles) {
  const uniqueArticles = new Map()

  for (const article of articles) {
    if (article && !uniqueArticles.has(article.url)) uniqueArticles.set(article.url, article)
  }

  // Tidak ada batas global di sini. Pemotongan per region dilakukan di
  // groupArticles, jika tidak satu region's slot akan habis oleh region lain.
  return [...uniqueArticles.values()]
    .sort((first, second) => {
      const firstDate = first.publishedAt ? Date.parse(first.publishedAt) : 0
      const secondDate = second.publishedAt ? Date.parse(second.publishedAt) : 0
      return secondDate - firstDate
    })
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: { 'user-agent': 'KreatifestNewsFeed/1.0' },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`${source.name} returned HTTP ${response.status}`)

  const feed = await parser.parseString(await response.text())
  return (feed.items || []).slice(0, SOURCE_ITEM_LIMIT).map((item) => normalizeArticle(item, source))
}

async function refreshNews() {
  const results = await Promise.allSettled(sources.map(fetchSource))
  const availableArticles = results
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)

  if (availableArticles.length === 0) {
    if (cachedArticles.length && Date.now() - lastSuccessfulRefreshAt < STALE_CACHE_TTL_MS) {
      cacheIsStale = true
      return { articles: cachedArticles, updatedAt: cacheUpdatedAt, stale: true }
    }
    throw new Error('All news sources are unavailable')
  }

  cachedArticles = sortAndDedupeArticles(availableArticles)
  cacheUpdatedAt = new Date().toISOString()
  cacheIsStale = false
  lastSuccessfulRefreshAt = Date.now()

  return { articles: cachedArticles, updatedAt: cacheUpdatedAt, stale: false }
}

export function groupArticles(articles, limit) {
  return {
    indonesia: articles.filter((article) => article.region === 'indonesia').slice(0, limit),
    international: articles.filter((article) => article.region === 'international').slice(0, limit),
  }
}

function startRefresh() {
  lastRefreshAt = Date.now()
  refreshStartedAt = lastRefreshAt
  const pending = refreshNews()
  refreshInProgress = pending
  pending
    .catch(() => {
      // Refresh gagal: jangan kunci TTL, biar request berikutnya mencoba lagi.
      lastRefreshAt = 0
    })
    .finally(() => {
      if (refreshInProgress === pending) refreshInProgress = null
    })
  return pending
}

/**
 * @param {number} limit jumlah artikel per region
 * @param {{ force?: boolean }} options force=true mengabaikan cache dan
 *   memaksa fetch feed baru (dipakai saat browser meminta refresh).
 */
export async function getLatestNews(limit = 6, { force = false } = {}) {
  const now = Date.now()
  if (!force && cachedArticles.length && now - lastRefreshAt < CACHE_TTL_MS) {
    return { articles: groupArticles(cachedArticles, limit), updatedAt: cacheUpdatedAt, stale: cacheIsStale }
  }

  const inFlightIsUsable = refreshInProgress && now - refreshStartedAt <= FORCE_JOIN_WINDOW_MS
  if (!inFlightIsUsable) startRefresh()

  const result = await refreshInProgress
  return { ...result, articles: groupArticles(result.articles, limit) }
}

/**
 * Ringkasan kondisi cache untuk endpoint health check.
 * Exposed lewat fungsi supaya state internal tetap private.
 */
export function getCacheStatus() {
  return {
    ttlMinutes: CACHE_TTL_MS / 60_000,
    articleCount: cachedArticles.length,
    lastUpdatedAt: cacheUpdatedAt,
    lastRefreshAt: lastRefreshAt ? new Date(lastRefreshAt).toISOString() : null,
    stale: cacheIsStale,
    refreshInProgress: Boolean(refreshInProgress),
  }
}

/** Isi cache saat server start supaya request pertama tidak menunggu feed. */
export async function prewarmNews() {
  try {
    await getLatestNews(6)
    console.log('News cache warmed')
  } catch {
    console.warn('News cache warm-up failed, will retry on first request')
  }
}