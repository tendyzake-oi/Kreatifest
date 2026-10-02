import { cta } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'
import Button from '../ui/Button'
import './CallToAction.css'

export default function CallToAction() {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="container--wide">
        <div className="cta__panel">
          <SectionHeading id="cta-title" eyebrow={cta.eyebrow} title={cta.title} description={cta.text} align="center" tone="inverse" />
          <Button href={cta.button.href} variant="light" icon="arrow-right" className="cta__button">
            {cta.button.label}
          </Button>
        </div>
      </div>
    </section>
  )
}
