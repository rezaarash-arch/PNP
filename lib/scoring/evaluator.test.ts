import { describe, it, expect } from 'vitest'
import { evaluateAllPrograms } from './evaluator'
import strongCandidate from './__fixtures__/strong-candidate.json'
import ineligibleAll from './__fixtures__/ineligible-all.json'
import type { UserProfile } from '@/lib/types/assessment'

describe('evaluateAllPrograms', () => {
  it('returns results for every loaded program', () => {
    const results = evaluateAllPrograms(strongCandidate as UserProfile, {})
    expect(results.length).toBeGreaterThan(0)
    // Should include at least BC Base
    expect(results.some(r => r.programId === 'bc-entrepreneur-base')).toBe(true)
  })

  it('each result has programId, eligibility, probability, and sensitivity', () => {
    const results = evaluateAllPrograms(strongCandidate as UserProfile, {})
    for (const r of results) {
      expect(r.programId).toBeTruthy()
      expect(r.eligibility).toBeDefined()
      expect(r.probability).toBeDefined()
      expect(r.sensitivity).toBeDefined()
      expect(r.probability).toHaveProperty('percent')
      expect(r.probability).toHaveProperty('tier')
      expect(r.probability).toHaveProperty('range')
    }
  })

  it('results are sorted by probability descending', () => {
    const results = evaluateAllPrograms(strongCandidate as UserProfile, {})
    for (let i = 1; i < results.length; i++) {
      expect(results[i].probability.percent).toBeLessThanOrEqual(
        results[i - 1].probability.percent
      )
    }
  })

  it('ineligible candidate gets ineligible tier for programs they dont qualify for', () => {
    const results = evaluateAllPrograms(ineligibleAll as UserProfile, {})
    // ineligible-all should fail all programs
    const ineligibleResults = results.filter(r => !r.eligibility.eligible)
    expect(ineligibleResults.length).toBeGreaterThan(0)
    for (const r of ineligibleResults) {
      expect(r.probability.tier).toBe('ineligible')
    }
  })
})
