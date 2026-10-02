import { impact } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'
import './Impact.css'

export default function Impact() {
  return (
    <section id="impact" className="section impact" aria-labelledby="impact-title">
      <div className="container--wide">
        <div className="impact__panel">
          <div className="impact__head">
            <SectionHeading id="impact-title" eyebrow={impact.eyebrow} title={impact.title} />
            <p className="impact__note">{impact.note}</p>
          </div>

          <ul className="impact__stats">
            {impact.stats.map((stat) => (
              <li key={stat.label} className="impact__stat">
                <span className={`impact__value impact__value--${stat.tone}`}>{stat.value}</span>
                <h3>{stat.label}</h3>
                <p>{stat.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
