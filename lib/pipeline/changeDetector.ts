import { createHash } from 'crypto'

/**
 * Compute a SHA-256 hash of the given data.
 * Objects have their keys sorted recursively before hashing to ensure
 * order-independent comparison.
 */
export function computeContentHash(data: unknown): string {
  const normalized = sortKeysDeep(data)
  const json = JSON.stringify(normalized) ?? 'undefined'
  return createHash('sha256').update(json).digest('hex')
}

/**
 * Compare two hashes and return true if the content has changed.
 */
export function hasChanged(newHash: string, oldHash: string): boolean {
  return newHash !== oldHash
}

/**
 * Recursively sort object keys so that key ordering does not affect the hash.
 * Arrays preserve their element order (only objects within are sorted).
 */
function sortKeysDeep(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep)
  }
  if (typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}
