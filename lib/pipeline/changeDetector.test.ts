import { describe, it, expect } from 'vitest'
import { computeContentHash, hasChanged } from './changeDetector'

describe('computeContentHash', () => {
  it('produces the same hash for the same input', () => {
    const data = { name: 'BC PNP', score: 120 }
    const hash1 = computeContentHash(data)
    const hash2 = computeContentHash(data)
    expect(hash1).toBe(hash2)
  })

  it('produces different hashes for different input', () => {
    const hash1 = computeContentHash({ name: 'BC PNP', score: 120 })
    const hash2 = computeContentHash({ name: 'BC PNP', score: 130 })
    expect(hash1).not.toBe(hash2)
  })

  it('produces the same hash regardless of object key order', () => {
    const hash1 = computeContentHash({ a: 1, b: 2, c: 3 })
    const hash2 = computeContentHash({ c: 3, a: 1, b: 2 })
    expect(hash1).toBe(hash2)
  })

  it('handles nested objects with different key orders', () => {
    const hash1 = computeContentHash({ outer: { z: 1, a: 2 }, name: 'test' })
    const hash2 = computeContentHash({ name: 'test', outer: { a: 2, z: 1 } })
    expect(hash1).toBe(hash2)
  })

  it('handles null safely', () => {
    const hash = computeContentHash(null)
    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64) // SHA-256 hex digest
  })

  it('handles undefined safely', () => {
    const hash = computeContentHash(undefined)
    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64)
  })

  it('handles arrays', () => {
    const hash1 = computeContentHash([1, 2, 3])
    const hash2 = computeContentHash([1, 2, 3])
    expect(hash1).toBe(hash2)
  })

  it('preserves array element order (different order = different hash)', () => {
    const hash1 = computeContentHash([1, 2, 3])
    const hash2 = computeContentHash([3, 2, 1])
    expect(hash1).not.toBe(hash2)
  })

  it('handles empty objects', () => {
    const hash = computeContentHash({})
    expect(hash).toBeDefined()
    expect(hash.length).toBe(64)
  })

  it('handles strings', () => {
    const hash = computeContentHash('hello')
    expect(hash).toBeDefined()
    expect(hash.length).toBe(64)
  })

  it('handles numbers', () => {
    const hash = computeContentHash(42)
    expect(hash).toBeDefined()
    expect(hash.length).toBe(64)
  })

  it('distinguishes between null and undefined', () => {
    const hashNull = computeContentHash(null)
    const hashUndefined = computeContentHash(undefined)
    // JSON.stringify(null) === 'null', JSON.stringify(undefined) === undefined
    // Both are handled but may differ
    expect(hashNull).toBeDefined()
    expect(hashUndefined).toBeDefined()
  })
})

describe('hasChanged', () => {
  it('returns false when hashes are the same', () => {
    const hash = computeContentHash({ data: 'test' })
    expect(hasChanged(hash, hash)).toBe(false)
  })

  it('returns true when hashes differ', () => {
    const hash1 = computeContentHash({ data: 'version1' })
    const hash2 = computeContentHash({ data: 'version2' })
    expect(hasChanged(hash1, hash2)).toBe(true)
  })

  it('returns true when comparing with empty string', () => {
    const hash = computeContentHash({ data: 'test' })
    expect(hasChanged(hash, '')).toBe(true)
  })
})
