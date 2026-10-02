import { hero } from '../../data/content'
import Button from '../ui/Button'
import './Hero.css'
import Picture from '../../../Assets/Dashboard.jpeg'

/** Ilustrasi kartu di sisi kanan hero — murni CSS/SVG, tanpa gambar. */
function HeroVisual() {
  return (
    <div className="hero-visual">
      <div className="hero-visual__stage">
        <span className="hero-visual__plate" aria-hidden="true" />

        <figure className="hero-visual__photo-card">
          <img
            src={Picture}
            alt="Tim kreatif sedang merancang karya bersama"
          />
          <figcaption>
            <span>KREATIFEST INDONESIA</span>
            <strong>Digital Creative Agency</strong>
          </figcaption>
        </figure>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      {/* Dekorasi latar */}
      <span className="hero__deco hero__deco--ring" aria-hidden="true" />
      <span className="hero__deco hero__deco--sun" aria-hidden="true" />
      <span className="hero__deco hero__deco--dot" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="hero__badge">
            <span className="hero__badge-dot" />
            {hero.badge}
          </p>
          <h1 id="hero-title" className="hero__title">{hero.title}</h1>
          <p className="hero__desc">{hero.description}</p>

          <div className="hero__actions">
            <Button href={hero.primaryCta.href} icon="arrow-right">{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary" icon="sparkles">{hero.secondaryCta.label}</Button>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}
