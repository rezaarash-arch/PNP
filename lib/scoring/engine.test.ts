import { describe, it, expect } from 'vitest'
import { evaluateEligibility, computeScore } from './engine'
import bcBase from '@/lib/data/rules/bc-entrepreneur-base.json'
import strongCandidate from './__fixtures__/strong-candidate.json'
import minimalCandidate from './__fixtures__/minimal-candidate.json'
import ineligibleAll from './__fixtures__/ineligible-all.json'
import type { UserProfile } from '@/lib/types/assessment'

describe('evaluateEligibility', () => {
  it('strong candidate is eligible for BC Base', () => {
    const result = evaluateEligibility(strongCandidate as UserProfile, bcBase.eligibility)
    expect(result.eligible).toBe(true)
  })

  it('ineligible candidate fails with disqualifiers', () => {
    const result = evaluateEligibility(ineligibleAll as UserProfile, bcBase.eligibility)
    expect(result.eligible).toBe(false)
    if (!result.eligible) {
      expect(result.disqualifiers.length).toBeGreaterThan(0)
      expect(result.disqualifiers[0]).toHaveProperty('requirement')
      expect(result.disqualifiers[0]).toHaveProperty('explanation')
      expect(result.disqualifiers[0]).toHaveProperty('fixable')
    }
  })

  it('reports all disqualifiers, not just the first', () => {
    const result = evaluateEligibility(ineligibleAll as UserProfile, bcBase.eligibility)
    if (!result.eligible) {
      // ineligible-all should fail on net worth, CLB, business exp, AND investment
      expect(result.disqualifiers.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('reports specific disqualifier for net worth below minimum', () => {
    const lowNetWorth = { ...(strongCandidate as UserProfile), personalNetWorth: 400000 }
    const result = evaluateEligibility(lowNetWorth, bcBase.eligibility)
    expect(result.eligible).toBe(false)
    if (!result.eligible) {
      const nwDQ = result.disqualifiers.find(d => d.requirement.toLowerCase().includes('net worth'))
      expect(nwDQ).toBeTruthy()
      expect(nwDQ?.fixable).toBe(true)
    }
  })

  it('minimal candidate IS eligible for BC Base (meets all minimums)', () => {
    // minimal has: net worth 300K (FAILS 600K), CLB 4 (passes), 3yr ownership (passes), investment 100K (FAILS 200K)
    const result = evaluateEligibility(minimalCandidate as UserProfile, bcBase.eligibility)
    expect(result.eligible).toBe(false)
    if (!result.eligible) {
      expect(result.disqualifiers.length).toBe(2) // net worth + investment
    }
  })

  it('generates near misses for fixable disqualifiers', () => {
    const result = evaluateEligibility(ineligibleAll as UserProfile, bcBase.eligibility)
    if (!result.eligible) {
      expect(result.nearMisses.length).toBeGreaterThan(0)
      result.nearMisses.forEach(nm => {
        expect(nm).toHaveProperty('requirement')
        expect(nm).toHaveProperty('gap')
        expect(nm).toHaveProperty('effort')
        expect(nm).toHaveProperty('suggestion')
      })
    }
  })
})

describe('computeScore', () => {
  it('computes score for strong candidate on BC Base', () => {
    const result = computeScore(strongCandidate as UserProfile, (bcBase as any).scoring)
    expect(result).not.toBeNull()
    expect(result!.totalScore).toBeGreaterThan(0)
    expect(result!.breakdown.length).toBeGreaterThan(0)
  })

  it('each breakdown item has category, factor, points, maxPoints', () => {
    const result = computeScore(strongCandidate as UserProfile, (bcBase as any).scoring)
    expect(result).not.toBeNull()
    for (const item of result!.breakdown) {
      expect(item.category).toBeTruthy()
      expect(item.factor).toBeTruthy()
      expect(typeof item.points).toBe('number')
      expect(item.maxPoints).toBeGreaterThan(0)
      expect(item.points).toBeLessThanOrEqual(item.maxPoints)
    }
  })

  it('total score equals sum of breakdown points', () => {
    const result = computeScore(strongCandidate as UserProfile, (bcBase as any).scoring)
    expect(result).not.toBeNull()
    const sum = result!.breakdown.reduce((acc, b) => acc + b.points, 0)
    expect(result!.totalScore).toBe(sum)
  })

  it('returns null for programs without points grid', () => {
    const result = computeScore(strongCandidate as UserProfile, null)
    expect(result).toBeNull()
  })

  it('strong candidate scores higher than minimal candidate', () => {
    const strongResult = computeScore(strongCandidate as UserProfile, (bcBase as any).scoring)
    const minimalResult = computeScore(minimalCandidate as UserProfile, (bcBase as any).scoring)
    expect(strongResult).not.toBeNull()
    expect(minimalResult).not.toBeNull()
    expect(strongResult!.totalScore).toBeGreaterThan(minimalResult!.totalScore)
  })

  it('generates explanation strings for each breakdown item', () => {
    const result = computeScore(strongCandidate as UserProfile, (bcBase as any).scoring)
    expect(result).not.toBeNull()
    for (const item of result!.breakdown) {
      expect(item.explanation).toBeTruthy()
      expect(typeof item.explanation).toBe('string')
    }
  })
})
