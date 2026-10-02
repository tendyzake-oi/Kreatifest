import { services } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'
import IconTile from '../ui/IconTile'
import './Services.css'

export default function Services() {
  return (
    <section id="services" className="section section--alt services" aria-labelledby="services-title">
      <div className="container--wide">
        <div className="services__head">
          <SectionHeading id="services-title" eyebrow={services.eyebrow} title={services.title} />
          <p className="services__note">{services.note}</p>
        </div>

        <ul className="services__grid">
          {services.items.map((item) => (
            <li key={item.title} className="services__card">
              <IconTile name={item.icon} tone={item.tone} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
