import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidEmail, normalizeEmail, validateName, validatePassword, validatePhone } from './accountValidation.js'

test('normalizes email and rejects invalid or oversized addresses', () => {
  assert.equal(normalizeEmail('  NAME@Example.com '), 'name@example.com')
  assert.equal(isValidEmail('NAME@Example.com'), true)
  assert.equal(isValidEmail('bad-email'), false)
  assert.equal(isValidEmail(`${'a'.repeat(250)}@example.com`), false)
})

test('validates names and bcrypt-compatible password lengths', () => {
  assert.equal(validateName(' Kreator '), true)
  assert.equal(validateName('   '), false)
  assert.equal(validateName('a'.repeat(121)), false)
  assert.equal(validatePassword('password123'), true)
  assert.equal(validatePassword('short'), false)
  assert.equal(validatePassword('a'.repeat(73)), false)
})

test('validates phone numbers with common international formatting', () => {
  assert.equal(validatePhone('+62 812-3456-7890'), true)
  assert.equal(validatePhone('(021) 5555-1234'), true)
  assert.equal(validatePhone('1234'), false)
  assert.equal(validatePhone('0812ABC56789'), false)
  assert.equal(validatePhone('1'.repeat(25)), false)
})
