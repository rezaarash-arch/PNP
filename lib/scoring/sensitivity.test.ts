import { describe, it, expect } from 'vitest'
import { computeSensitivity } from './sensitivity'
import bcBase from '@/lib/data/rules/bc-entrepreneur-base.json'
import minimalCandidate from './__fixtures__/minimal-candidate.json'
import strongCandidate from './__fixtures__/strong-candidate.json'
import type { UserProfile } from '@/lib/types/assessment'

describe('computeSensitivity', () => {
  it('returns improvement suggestions for minimal candidate', () => {
    const results = computeSensitivity(minimalCandidate as UserProfile, bcBase)
    expect(results.length).toBeGreaterThan(0)
  })

  it('each suggestion has factor, currentValue, improvedValue, scoreChange, effort', () => {
    const results = computeSensitivity(minimalCandidate as UserProfile, bcBase)
    for (const r of results) {
      expect(r.factor).toBeTruthy()
      expect(r.currentValue).toBeTruthy()
      expect(r.improvedValue).toBeTruthy()
      expect(r.scoreChange).toBeGreaterThan(0)
      expect(['low', 'medium', 'high']).toContain(r.effort)
      expect(r.description).toBeTruthy()
    }
  })

  it('results are sorted by scoreChange descending', () => {
    const results = computeSensitivity(minimalCandidate as UserProfile, bcBase)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].scoreChange).toBeLessThanOrEqual(results[i - 1].scoreChange)
    }
  })

  it('strong candidate has fewer or smaller improvements available', () => {
    const strongResults = computeSensitivity(strongCandidate as UserProfile, bcBase)
    const minimalResults = computeSensitivity(minimalCandidate as UserProfile, bcBase)
    // Strong candidate should have fewer improvements since they already score high
    const strongTotalDelta = strongResults.reduce((s, r) => s + r.scoreChange, 0)
    const minimalTotalDelta = minimalResults.reduce((s, r) => s + r.scoreChange, 0)
    expect(minimalTotalDelta).toBeGreaterThanOrEqual(strongTotalDelta)
  })
})
