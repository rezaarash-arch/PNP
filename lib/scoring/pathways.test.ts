import { describe, it, expect } from 'vitest'
import { computePathways } from './pathways'
import type { ProgramResult } from '@/lib/types/results'

const baseProbability = {
  percent: 0,
  confidence: 'low' as const,
  range: [0, 0] as [number, number],
  tier: 'ineligible' as const,
  explanation: '',
  caveats: [],
  dataPoints: 0,
  lastDrawDate: null,
  lastDrawMinScore: null,
}

function makeIneligible(
  programId: string,
  disqualifiers: Array<{
    requirement: string
    fixable: boolean
    effort?: 'low' | 'medium' | 'high'
  }>,
  status: 'active' | 'paused' | 'closed' = 'active'
): ProgramResult {
  return {
    programId,
    meta: { status, statusNote: null, category: 'main', officialUrl: '' },
    eligibility: {
      eligible: false,
      disqualifiers: disqualifiers.map((d) => ({
        requirement: d.requirement,
        userValue: '0',
        requiredValue: '100',
        explanation: `Missing ${d.requirement}`,
        fixable: d.fixable,
        fixSuggestion: d.fixable ? `Fix ${d.requirement}` : null,
      })),
      nearMisses: disqualifiers
        .filter((d) => d.fixable)
        .map((d) => ({
          requirement: d.requirement,
          gap: 'Short by 100',
          effort: d.effort ?? 'medium',
          suggestion: `Improve ${d.requirement}`,
        })),
    },
    probability: baseProbability,
    sensitivity: [],
  }
}

function makeEligible(programId: string): ProgramResult {
  return {
    programId,
    meta: { status: 'active', statusNote: null, category: 'main', officialUrl: '' },
    eligibility: {
      eligible: true,
      score: 100,
      maxScore: 200,
      breakdown: [],
      meetsMinScore: true,
    },
    probability: { ...baseProbability, percent: 50, tier: 'competitive' },
    sensitivity: [],
  }
}

describe('computePathways', () => {
  it('returns empty array when all programs are eligible', () => {
    const results = [makeEligible('prog-a'), makeEligible('prog-b')]
    expect(computePathways(results)).toEqual([])
  })

  it('returns at most 3 recommendations', () => {
    const results = [
      makeIneligible('a', [{ requirement: 'Net worth', fixable: true }]),
      makeIneligible('b', [{ requirement: 'Net worth', fixable: true }]),
      makeIneligible('c', [{ requirement: 'CLB', fixable: true }]),
      makeIneligible('d', [{ requirement: 'CLB', fixable: true }, { requirement: 'Net worth', fixable: true }]),
      makeIneligible('e', [{ requirement: 'Education', fixable: false }]),
    ]
    const pathways = computePathways(results)
    expect(pathways.length).toBeLessThanOrEqual(3)
  })

  it('excludes closed programs', () => {
    const results = [
      makeIneligible('closed-prog', [{ requirement: 'Net worth', fixable: true }], 'closed'),
      makeIneligible('active-prog', [{ requirement: 'Net worth', fixable: true }]),
    ]
    const pathways = computePathways(results)
    expect(pathways.every((p) => p.programId !== 'closed-prog')).toBe(true)
  })

  it('ranks programs with fewer disqualifiers higher', () => {
    const results = [
      makeIneligible('many-gaps', [
        { requirement: 'A', fixable: true },
        { requirement: 'B', fixable: true },
        { requirement: 'C', fixable: true },
      ]),
      makeIneligible('few-gaps', [{ requirement: 'A', fixable: true }]),
    ]
    const pathways = computePathways(results)
    expect(pathways[0].programId).toBe('few-gaps')
  })

  it('ranks programs with more fixable disqualifiers higher', () => {
    const results = [
      makeIneligible('no-fix', [
        { requirement: 'A', fixable: false },
        { requirement: 'B', fixable: false },
      ]),
      makeIneligible('all-fix', [
        { requirement: 'A', fixable: true },
        { requirement: 'B', fixable: true },
      ]),
    ]
    const pathways = computePathways(results)
    expect(pathways[0].programId).toBe('all-fix')
  })

  it('includes improvement details from near misses', () => {
    const results = [
      makeIneligible('prog', [
        { requirement: 'Net worth', fixable: true, effort: 'low' },
        { requirement: 'Age', fixable: false },
      ]),
    ]
    const pathways = computePathways(results)
    expect(pathways[0].improvements.length).toBe(2)
    expect(pathways[0].fixableCount).toBe(1)
    expect(pathways[0].totalDisqualifiers).toBe(2)
  })

  it('sorts improvements: fixable first, then by effort', () => {
    const results = [
      makeIneligible('prog', [
        { requirement: 'Hard one', fixable: false },
        { requirement: 'Easy fix', fixable: true, effort: 'low' },
        { requirement: 'Medium fix', fixable: true, effort: 'medium' },
      ]),
    ]
    const pathways = computePathways(results)
    const improvements = pathways[0].improvements
    // Fixable ones come first
    expect(improvements[0].fixable).toBe(true)
    expect(improvements[1].fixable).toBe(true)
    expect(improvements[2].fixable).toBe(false)
    // Among fixable, low effort comes first
    expect(improvements[0].effort).toBe('low')
    expect(improvements[1].effort).toBe('medium')
  })

  it('includes paused programs in recommendations', () => {
    const results = [
      makeIneligible('paused-prog', [{ requirement: 'CLB', fixable: true }], 'paused'),
    ]
    const pathways = computePathways(results)
    expect(pathways.length).toBe(1)
    expect(pathways[0].meta.status).toBe('paused')
  })
})
