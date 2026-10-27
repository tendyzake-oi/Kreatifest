import { motion } from 'motion/react'
import { services } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'
import IconTile from '../ui/IconTile'
import './Services.css'

export default function Services() {
  return (
    <section id="services" className="section section--alt services" aria-labelledby="services-title">
      <div className="container--wide">
        <motion.div
          className="services__head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionHeading id="services-title" eyebrow={services.eyebrow} title={services.title} />
          <p className="services__note">{services.note}</p>
        </motion.div>

        <motion.ul
          className="services__grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {services.items.map((item) => (
            <motion.li
              key={item.title}
              className="services__card"
              variants={{
                hidden: { opacity: 0, y: 28 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              whileHover={{ y: -7, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            >
              <IconTile name={item.icon} tone={item.tone} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
