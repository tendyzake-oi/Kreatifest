import { motion } from 'motion/react'
import { highlights } from '../../data/content'
import IconTile from '../ui/IconTile'
import './Highlights.css'

/** Baris poin singkat tepat di bawah hero dengan Motion.dev. */
export default function Highlights() {
  return (
    <section className="highlights" aria-label="Sorotan">
      <motion.ul
        className="container highlights__list"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.08 },
          },
        }}
      >
        {highlights.map((item) => (
          <motion.li
            key={item.label}
            className="highlights__item"
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            whileHover={{ y: -3, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <IconTile name={item.icon} tone={item.tone} size="sm" />
            <span>{item.label}</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
