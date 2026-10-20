export function isValidWhatsAppGroupUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && url.hostname === 'chat.whatsapp.com'
      && !url.port
      && !url.username
      && !url.password
      && url.pathname.length > 1
  } catch {
    return false
  }
}
