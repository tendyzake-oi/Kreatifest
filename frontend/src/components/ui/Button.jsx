import Icon from './Icon'
import './Button.css'

/**
 * Tombol / tautan bergaya tombol.
 *  - variant: 'primary' (gelap) | 'secondary' (outline) | 'light' (putih, untuk latar berwarna)
 *  - href   : jika diisi, dirender sebagai <a>, jika tidak sebagai <button>
 *  - icon   : nama ikon di Icon.jsx, ditampilkan setelah teks
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  icon,
  className = '',
  children,
  ...rest
}) {
  const classes = `btn btn--${variant} btn--${size} ${className}`.trim()
  const content = (
    <>
      <span>{children}</span>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
    </>
  )

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        {content}
      </a>
    )
  }
  return (
    <button className={classes} type="button" {...rest}>
      {content}
    </button>
  )
}
