import { about } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'
import IconTile from '../ui/IconTile'
import './About.css'
import Picture from '../../../Assets/Kreatifest_Indonesia.jpeg'

export default function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="container about__inner">
        {/* Visual */}
        <div className="about__visual">
          <figure className="about__photo-card">
            <img src={Picture} alt="Tim kreatif sedang merancang karya bersama" />
            <figcaption className="about__glass">
            <p className="about__glass-label">{about.visual.label}</p>
            <p className="about__glass-text">{about.visual.text}</p>
            </figcaption>
          </figure>
        </div>

        {/* Teks */}
        <div className="about__copy">
          <SectionHeading id="about-title" eyebrow={about.eyebrow} title={about.title} />
          <div className="about__paragraphs">
            {about.paragraphs.map((text) => <p key={text}>{text}</p>)}
          </div>

          <ul className="about__values">
            {about.values.map((value) => (
              <li key={value.title} className="about__value">
                <IconTile name={value.icon} tone={value.tone} size="sm" />
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
