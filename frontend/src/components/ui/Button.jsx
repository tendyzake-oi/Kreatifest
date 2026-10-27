import { motion } from 'motion/react'
import Icon from './Icon'
import './Button.css'

/**
 * Tombol / tautan bergaya tombol dengan animasi interaktif Motion.dev.
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
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} className="btn__icon" />}
    </>
  )

  const motionProps = {
    whileHover: { y: -2, scale: 1.025 },
    whileTap: { scale: 0.975 },
    transition: { type: 'spring', stiffness: 400, damping: 22 },
  }

  if (href) {
    return (
      <motion.a className={classes} href={href} {...motionProps} {...rest}>
        {content}
      </motion.a>
    )
  }
  return (
    <motion.button className={classes} type="button" {...motionProps} {...rest}>
      {content}
    </motion.button>
  )
}
