import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidWhatsAppGroupUrl } from './appSettings.js'

test('accepts secure WhatsApp group invite links', () => {
  assert.equal(isValidWhatsAppGroupUrl('https://chat.whatsapp.com/AbCdEf123'), true)
})

test('rejects insecure and unrelated invite URLs', () => {
  assert.equal(isValidWhatsAppGroupUrl('http://chat.whatsapp.com/AbCdEf123'), false)
  assert.equal(isValidWhatsAppGroupUrl('https://example.com/AbCdEf123'), false)
  assert.equal(isValidWhatsAppGroupUrl('https://chat.whatsapp.com.evil.example/AbCdEf123'), false)
  assert.equal(isValidWhatsAppGroupUrl('https://chat.whatsapp.com'), false)
  assert.equal(isValidWhatsAppGroupUrl('not a URL'), false)
})
