import { highlights } from '../../data/content'
import IconTile from '../ui/IconTile'
import './Highlights.css'

/** Baris empat poin singkat tepat di bawah hero. */
export default function Highlights() {
  return (
    <section className="highlights" aria-label="Sorotan">
      <ul className="container highlights__list">
        {highlights.map((item) => (
          <li key={item.label} className="highlights__item">
            <IconTile name={item.icon} tone={item.tone} size="sm" />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
