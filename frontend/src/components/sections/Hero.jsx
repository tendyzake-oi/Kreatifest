import { motion } from 'motion/react'
import { hero } from '../../data/content'
import Button from '../ui/Button'
import './Hero.css'
import Picture from '../../../Assets/Dashboard.jpeg'

/** Ilustrasi kartu di sisi kanan hero dengan animasi Motion.dev. */
function HeroVisual() {
  return (
    <div className="hero-visual">
      <div className="hero-visual__stage">
        <motion.span
          className="hero-visual__plate"
          aria-hidden="true"
          animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />

        <motion.figure
          className="hero-visual__photo-card"
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -6, scale: 1.02 }}
        >
          <img
            src={Picture}
            alt="Tim kreatif sedang merancang karya bersama"
          />
          <figcaption>
            <span>KREATIFEST INDONESIA</span>
            <strong>Digital Creative Agency</strong>
          </figcaption>
        </motion.figure>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      {/* Dekorasi latar dengan floating animation halus */}
      <motion.span
        className="hero__deco hero__deco--ring"
        aria-hidden="true"
        animate={{ y: [0, -12, 0], rotate: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
      />
      <motion.span
        className="hero__deco hero__deco--sun"
        aria-hidden="true"
        animate={{ scale: [1, 1.05, 1], y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      />
      <motion.span
        className="hero__deco hero__deco--dot"
        aria-hidden="true"
        animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      />

      <div className="container hero__inner">
        <motion.div
          className="hero__copy"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.14, delayChildren: 0.1 },
            },
          }}
        >
          <motion.p
            className="hero__badge"
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <span className="hero__badge-dot" />
            {hero.badge}
          </motion.p>

          <motion.h1
            id="hero-title"
            className="hero__title"
            variants={{
              hidden: { opacity: 0, y: 25 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            {hero.title}
          </motion.h1>

          <motion.p
            className="hero__desc"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            {hero.description}
          </motion.p>

          <motion.div
            className="hero__actions"
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <Button href={hero.primaryCta.href} icon="arrow-right">{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary" icon="sparkles">{hero.secondaryCta.label}</Button>
          </motion.div>
        </motion.div>

        <HeroVisual />
      </div>
    </section>
  )
}
