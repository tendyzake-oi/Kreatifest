import './SectionHeading.css'

/**
 * Judul section standar: eyebrow (label kecil) + judul serif + deskripsi opsional.
 *  - align: 'left' | 'center'
 *  - tone : 'default' | 'inverse' (untuk latar gelap/berwarna)
 * `id` dipakai untuk aria-labelledby pada <section>.
 */
export default function SectionHeading({ id, eyebrow, title, description, align = 'left', tone = 'default', as: Tag = 'h2' }) {
  return (
    <header className={`section-heading section-heading--${align} section-heading--${tone}`}>
      {eyebrow && <p className="section-heading__eyebrow">{eyebrow}</p>}
      <Tag id={id} className="section-heading__title">{title}</Tag>
      {description && <p className="section-heading__desc">{description}</p>}
    </header>
  )
}
