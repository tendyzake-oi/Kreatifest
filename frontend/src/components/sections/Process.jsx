import { process } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'
import './Process.css'

const brandLogos = Object.entries(
  import.meta.glob('../../../Assets/brands/*.{svg,png,jpg,jpeg,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)
  .map(([path, src]) => {
    const filename = path.split('/').pop().replace(/\.[^.]+$/, '')
    const label = filename.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    return { src, label }
  })
  .sort((first, second) => first.label.localeCompare(second.label))

export default function Process() {
  return (
    <section id="process" className="section process" aria-labelledby="process-title">
      <div className="container--wide">
        <SectionHeading id="process-title" eyebrow={process.eyebrow} title={process.title} tone="inverse" />

        {brandLogos.length > 0 && (
          <div className="process__marquee" role="group" aria-label="Logo brand" tabIndex={0}>
            <div className="process__track">
              {[false, true].map((isDuplicate) => (
                <ul
                  className="process__group"
                  key={isDuplicate ? 'duplicate' : 'original'}
                  aria-hidden={isDuplicate || undefined}
                >
                  {brandLogos.map((logo) => (
                    <li className="process__logo" key={logo.src}>
                      <img
                        src={logo.src}
                        alt={isDuplicate ? '' : logo.label}
                        decoding="async"
                        aria-hidden={isDuplicate || undefined}
                      />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
