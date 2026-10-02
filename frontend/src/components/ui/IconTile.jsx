import Icon from './Icon'
import './IconTile.css'

/** Kotak ikon berwarna lembut. tone: 'violet' | 'coral' | 'amber' */
export default function IconTile({ name, tone = 'violet', size = 'md' }) {
  return (
    <span className={`icon-tile icon-tile--${tone} icon-tile--${size}`}>
      <Icon name={name} size={size === 'sm' ? 17 : 21} />
    </span>
  )
}
