import { useState } from 'react'
import { contact } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'
import IconTile from '../ui/IconTile'
import Icon from '../ui/Icon'
import './Contact.css'

export default function Contact() {
  // State untuk menyimpan indeks FAQ yang sedang terbuka
  const [openIndex, setOpenIndex] = useState(null)

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container--wide contact__inner">
        {/* Bagian Kiri: Channels */}
        <div className="contact__info">
          <SectionHeading id="contact-title" eyebrow={contact.eyebrow} title={contact.title} description={contact.description} />

          <ul className="contact__channels" style={{ listStyle: 'none', padding: 0 }}>
            {contact.channels.map((channel) => {
              let href = ''

              if (channel.icon === 'whatsapp') {
                const textParam = channel.text ? `?text=${encodeURIComponent(channel.text)}` : ''
                href = `https://wa.me/${channel.value}${textParam}`
              } else if (channel.icon === 'mail') {
                const to = encodeURIComponent(channel.value)
                const su = channel.subject ? encodeURIComponent(channel.subject) : ''
                const body = channel.body ? encodeURIComponent(channel.body) : ''
                href = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`
              } else if (channel.icon === 'instagram') {
                href = `https://ig.me/m/${channel.value}`
              } else {
                href = channel.value
              }

              let displayValue = channel.value
              if (channel.icon === 'whatsapp') {
                displayValue = `+${channel.value}`
              } else if (channel.icon === 'instagram') {
                displayValue = `@${channel.value}`
              }

              return (
                <li key={channel.label} className="contact__channel" style={{ marginBottom: '1rem' }}>
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'flex', gap: '1rem', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}
                  >
                    <IconTile name={channel.icon} tone={channel.tone} />
                    <div>
                      <p className="contact__channel-label" style={{ margin: 0, fontWeight: 'bold' }}>{channel.label}</p>
                      <p className="contact__channel-value" style={{ margin: 0 }}>
                        {displayValue}
                      </p>
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Bagian Kanan: Komponen Accordion FAQ */}
        <div className="contact__faq">
          <h3 className="faq__title">Pertanyaan Umum</h3>
          <div className="faq__list">
            {contact.faqs.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <div key={index} className={`faq__item ${isOpen ? 'faq__item--open' : ''}`}>
                  <button className="faq__question" onClick={() => toggleFaq(index)} aria-expanded={isOpen}>
                    <span>{faq.question}</span>
                    <span className="faq__icon">
                      <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={20} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="faq__answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}