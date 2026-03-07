import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from './crypto'

describe('Session crypto', () => {
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' // 64 hex chars = 32 bytes

  it('encrypts and decrypts a round trip', () => {
    const plaintext = JSON.stringify({ foo: 'bar', num: 42 })
    const encrypted = encrypt(plaintext, testKey)
    const decrypted = decrypt(encrypted, testKey)
    expect(decrypted).toBe(plaintext)
  })

  it('ciphertext differs from plaintext', () => {
    const plaintext = 'hello world'
    const encrypted = encrypt(plaintext, testKey)
    expect(encrypted).not.toBe(plaintext)
  })

  it('different encryptions produce different ciphertexts (random IV)', () => {
    const plaintext = 'same input'
    const e1 = encrypt(plaintext, testKey)
    const e2 = encrypt(plaintext, testKey)
    expect(e1).not.toBe(e2) // random IV each time
  })

  it('wrong key fails to decrypt', () => {
    const plaintext = 'secret data'
    const encrypted = encrypt(plaintext, testKey)
    const wrongKey = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    expect(() => decrypt(encrypted, wrongKey)).toThrow()
  })
})
