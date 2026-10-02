import { useEffect, useRef, useState } from 'react'
import SectionHeading from '../ui/SectionHeading'
import Icon from '../ui/Icon'
import { fetchLatestNews } from '../../services/news'
import fallbackImage from '../../../Assets/default-news/default-news-foto.jpeg'
import './News.css'

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})

function formatDate(value) {
  if (!value) return 'Tanggal tidak tersedia'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Tanggal tidak tersedia' : dateFormatter.format(date)
}

const regions = [
  { key: 'indonesia', label: 'Berita Indonesia', tag: 'Dalam Negeri' },
  { key: 'international', label: 'Berita Internasional', tag: 'Luar Negeri' },
]

function NewsCarousel({ region, articles }) {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [failedImageUrl, setFailedImageUrl] = useState(null)
  const timerRef = useRef(null)
  const activeIndex = articles.length ? index % articles.length : 0
  const article = articles[activeIndex]

  // Menyimpan URL yang gagal (bukan boolean) supaya state ikut ter-reset
  // otomatis saat artikel berganti, tanpa effect tambahan.
  const imageUrl = article?.imageUrl || null
  const imageSrc = !imageUrl || failedImageUrl === imageUrl ? fallbackImage : imageUrl
  const imageAlt = imageUrl && failedImageUrl !== imageUrl ? article.title : 'Ilustrasi pemasaran digital'

  useEffect(() => {
    if (articles.length < 2) return undefined

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')

    function stopTimer() {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    function restartTimer() {
      stopTimer()
      if (isPaused || document.hidden || motionPreference.matches) return
      timerRef.current = window.setInterval(() => {
        setIndex((currentIndex) => (currentIndex + 1) % articles.length)
      }, 7000)
    }

    document.addEventListener('visibilitychange', restartTimer)
    motionPreference.addEventListener('change', restartTimer)
    restartTimer()

    return () => {
      stopTimer()
      document.removeEventListener('visibilitychange', restartTimer)
      motionPreference.removeEventListener('change', restartTimer)
    }
  }, [articles.length, isPaused])

  function move(direction) {
    if (articles.length < 2) return
    setIndex((currentIndex) => (currentIndex + direction + articles.length) % articles.length)
  }

  return (
    <article
      className="news-card"
      aria-label={region.label}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="news-card__topline">
        <span className={`news-card__region news-card__region--${region.key}`}>{region.tag}</span>
        {article && <span className="news-card__source">{article.source}</span>}
      </div>

      {article ? (
        <>
          <div className="news-card__image-frame">
            <img
              className="news-card__image"
              src={imageSrc}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
              onError={() => setFailedImageUrl(imageUrl)}
            />
          </div>

          <div className="news-card__body">
            <span className={`news-card__topic news-card__topic--${article.topicKey}`}>{article.topic}</span>
            <h3 className="news-card__title">
              <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
            </h3>
            {article.description && <p className="news-card__description">{article.description}</p>}
            <time className="news-card__date" dateTime={article.publishedAt || undefined}>
              {formatDate(article.publishedAt)}
            </time>
          </div>
        </>
      ) : (
        <p className="news-card__empty">Belum ada berita yang tersedia untuk kategori ini.</p>
      )}

      <div className="news-card__controls">
        <button
          type="button"
          className="news-card__arrow"
          onClick={() => move(-1)}
          disabled={articles.length < 2}
          aria-label={`Berita sebelumnya: ${region.label}`}
          title="Berita sebelumnya"
        >
          <Icon name="arrow-right" size={18} className="news-card__arrow-icon news-card__arrow-icon--previous" />
        </button>
        <span className="news-card__position">
          {articles.length ? `${activeIndex + 1} / ${articles.length}` : '0 / 0'}
        </span>
        <button
          type="button"
          className="news-card__arrow"
          onClick={() => move(1)}
          disabled={articles.length < 2}
          aria-label={`Berita berikutnya: ${region.label}`}
          title="Berita berikutnya"
        >
          <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </article>
  )
}

export default function News() {
  const [news, setNews] = useState({
    articles: { indonesia: [], international: [] },
    stale: false,
    updatedAt: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadNews() {
      setIsLoading(true)
      setError('')

      try {
        const result = await fetchLatestNews(controller.signal)
        setNews(result)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Terjadi kendala saat memuat berita.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadNews()
    return () => controller.abort()
  }, [attempt])

  const hasArticles = Object.values(news.articles).some((articles) => articles.length > 0)

  return (
    <section id="news" className="section news-section" aria-labelledby="news-title">
      <div className="container">
        <div className="news-section__intro">
          <SectionHeading
            id="news-title"
            eyebrow="Insights & Updates"
            title="Berita Terbaru"
            description="Kabar terkini seputar SEO, media sosial, konten, iklan digital, dan teknologi pemasaran."
          />
          <p className="news-section__note">Sorotan digital marketing dari Indonesia dan dunia</p>
        </div>

        {isLoading && !hasArticles && (
          <p className="news-section__message" role="status">Memuat berita terbaru...</p>
        )}

        {error && !hasArticles && (
          <div className="news-section__message news-section__message--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setAttempt((currentAttempt) => currentAttempt + 1)}>
              Coba lagi
            </button>
          </div>
        )}

        {!isLoading && !error && !hasArticles && (
          <p className="news-section__message">Belum ada berita yang tersedia saat ini.</p>
        )}

        {hasArticles && (
          <>
            {news.stale && (
              <p className="news-section__notice" role="status">
                Menampilkan berita tersimpan karena sumber berita sedang tidak merespons.
              </p>
            )}
            <div className="news-section__grid">
              {regions.map((region) => (
                <NewsCarousel key={region.key} region={region} articles={news.articles[region.key]} />
              ))}
            </div>
            <div className="news-section__updated">
              {news.updatedAt && <span>Data diperbarui {formatDate(news.updatedAt)} waktu Jakarta</span>}
              <button
                type="button"
                className="news-section__refresh"
                onClick={() => setAttempt((currentAttempt) => currentAttempt + 1)}
                disabled={isLoading}
              >
                {isLoading ? 'Memuat ulang...' : 'Muat ulang berita'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}