import { motion } from 'motion/react'
import { about } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'
import IconTile from '../ui/IconTile'
import './About.css'
import Picture from '../../../Assets/Kreatifest_Indonesia.jpeg'

export default function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="container about__inner">
        {/* Visual kiri dengan Motion.dev */}
        <motion.div
          className="about__visual"
          initial={{ opacity: 0, x: -35 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <figure className="about__photo-card">
            <img src={Picture} alt="Tim kreatif sedang merancang karya bersama" />
            <figcaption className="about__glass">
              <p className="about__glass-label">{about.visual.label}</p>
              <p className="about__glass-text">{about.visual.text}</p>
            </figcaption>
          </figure>
        </motion.div>

        {/* Teks kanan dengan Motion.dev */}
        <motion.div
          className="about__copy"
          initial={{ opacity: 0, x: 35 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionHeading id="about-title" eyebrow={about.eyebrow} title={about.title} />
          <div className="about__paragraphs">
            {about.paragraphs.map((text) => <p key={text}>{text}</p>)}
          </div>

          <motion.ul
            className="about__values"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.12 },
              },
            }}
          >
            {about.values.map((value) => (
              <motion.li
                key={value.title}
                className="about__value"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              >
                <IconTile name={value.icon} tone={value.tone} size="sm" />
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  )
}
