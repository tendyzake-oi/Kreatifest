import { testimonial } from '../../data/content'
import Icon from '../ui/Icon'
import './Testimonial.css'

export default function Testimonial() {
  return (
    <section className="testimonial" aria-label="Testimoni klien">
      <figure className="testimonial__panel">
        <Icon name="quote" size={30} className="testimonial__icon" />
        <p className="testimonial__eyebrow">{testimonial.eyebrow}</p>
        <blockquote className="testimonial__quote">{testimonial.quote}</blockquote>
        <figcaption className="testimonial__author">{testimonial.author}</figcaption>
      </figure>
    </section>
  )
}
