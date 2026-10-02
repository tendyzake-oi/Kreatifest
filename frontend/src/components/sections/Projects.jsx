import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { highlights, projects } from '../../data/content'
import Icon from '../ui/Icon'
import SectionHeading from '../ui/SectionHeading'
import './Projects.css'

const AUTOPLAY_DELAY = 3200

const projectPhotos = import.meta.glob('../../../Assets/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const photosByName = Object.fromEntries(
  Object.entries(projectPhotos).map(([path, url]) => [path.split('/').pop().toLowerCase(), url]),
)

export default function Projects() {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const [position, setPosition] = useState(highlights.length)
  const [step, setStep] = useState(0)
  const [pointerPaused, setPointerPaused] = useState(false)
  const [focusPaused, setFocusPaused] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return undefined

    const updateStep = () => {
      const card = track.querySelector('.projects__item')
      if (!card) return
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
      setStep(card.getBoundingClientRect().width + gap)
    }

    updateStep()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateStep)
      return () => window.removeEventListener('resize', updateStep)
    }

    const observer = new ResizeObserver(updateStep)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (pointerPaused || focusPaused || prefersReducedMotion) return undefined

    const interval = window.setInterval(() => {
      setPosition((currentPosition) => currentPosition + 1)
    }, AUTOPLAY_DELAY)
    return () => window.clearInterval(interval)
  }, [focusPaused, pointerPaused, prefersReducedMotion])

  useEffect(() => {
    if (!isResetting) return undefined
    const frame = window.requestAnimationFrame(() => setIsResetting(false))
    return () => window.cancelAnimationFrame(frame)
  }, [isResetting])

  const move = (direction) => {
    if (prefersReducedMotion) {
      setPosition((currentPosition) =>
        highlights.length + ((currentPosition - highlights.length + direction + highlights.length) % highlights.length),
      )
      return
    }
    setPosition((currentPosition) => currentPosition + direction)
  }

  const handleTrackTransitionEnd = (event) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || isResetting) return

    if (position >= highlights.length * 2) {
      setIsResetting(true)
      setPosition(highlights.length)
    } else if (position < highlights.length) {
      setIsResetting(true)
      setPosition(highlights.length * 2 - 1)
    }
  }

  const repeatedHighlights = [
    ...highlights.map((item) => ({ item, copy: 'before', isDuplicate: true })),
    ...highlights.map((item) => ({ item, copy: 'main', isDuplicate: false })),
    ...highlights.map((item) => ({ item, copy: 'after', isDuplicate: true })),
  ]

  return (
    <section id="portfolio" className="section projects" aria-labelledby="projects-title">
      <div className="container">
        <SectionHeading
          id="projects-title"
          eyebrow={projects.eyebrow}
          title={projects.title}
          description={projects.description}
        />

        <div
          className="projects__carousel"
          role="group"
          aria-label="Galeri proyek"
          onPointerEnter={() => setPointerPaused(true)}
          onPointerLeave={() => setPointerPaused(false)}
          onFocusCapture={() => setFocusPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocusPaused(false)
          }}
        >
          <div className="projects__viewport" ref={viewportRef}>
            <ul
              className={`projects__track${isResetting ? ' projects__track--resetting' : ''}`}
              ref={trackRef}
              style={{ transform: `translate3d(-${step * position}px, 0, 0)` }}
              onTransitionEnd={handleTrackTransitionEnd}
              aria-live="off"
            >
              {repeatedHighlights.map(({ item, copy, isDuplicate }) => (
                <li
                  className="projects__item"
                  key={`${copy}-${item.label}`}
                  aria-hidden={isDuplicate || undefined}
                >
                  <article className="project-card">
                    <figure className="project-card__photo">
                      {photosByName[item.photo.toLowerCase()] ? (
                        <img
                          src={photosByName[item.photo.toLowerCase()]}
                          alt={item.label}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="project-card__placeholder" aria-hidden="true">
                          <span>Tambahkan foto</span>
                        </div>
                      )}
                      <figcaption className="project-card__caption">
                        <h3>{item.label}</h3>
                      </figcaption>
                    </figure>
                  </article>
                </li>
              ))}
            </ul>
          </div>

          <div className="projects__controls">
            <button
              className="projects__control projects__control--previous"
              type="button"
              aria-label="Geser ke proyek sebelumnya"
              title="Proyek sebelumnya"
              onClick={() => move(-1)}
            >
              <Icon name="arrow-right" />
            </button>
            <button
              className="projects__control"
              type="button"
              aria-label="Geser ke proyek berikutnya"
              title="Proyek berikutnya"
              onClick={() => move(1)}
            >
              <Icon name="arrow-right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
