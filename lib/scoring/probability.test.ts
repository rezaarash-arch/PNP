import { describe, it, expect } from 'vitest'
import { estimateProbability } from './probability'

const mockDraws = [
  { draw_date: '2026-01-15', min_score: 115, invitations_issued: 20 },
  { draw_date: '2025-12-10', min_score: 120, invitations_issued: 18 },
  { draw_date: '2025-11-05', min_score: 118, invitations_issued: 22 },
  { draw_date: '2025-10-01', min_score: 122, invitations_issued: 15 },
  { draw_date: '2025-09-03', min_score: 116, invitations_issued: 25 },
  { draw_date: '2025-08-01', min_score: 119, invitations_issued: 20 },
]

describe('estimateProbability', () => {
  it('returns "ineligible" tier with 0% for ineligible candidates', () => {
    const result = estimateProbability('test', null, false, [])
    expect(result.tier).toBe('ineligible')
    expect(result.percent).toBe(0)
  })

  it('returns higher probability for scores well above historical cutoff', () => {
    const high = estimateProbability('test', 150, true, mockDraws)
    const low = estimateProbability('test', 100, true, mockDraws)
    expect(high.percent).toBeGreaterThan(low.percent)
  })

  it('rounds to nearest 5%', () => {
    const result = estimateProbability('test', 130, true, mockDraws)
    expect(result.percent % 5).toBe(0)
  })

  it('always returns a range [low, high], not just a point estimate', () => {
    const result = estimateProbability('test', 120, true, mockDraws)
    expect(result.range).toHaveLength(2)
    expect(result.range[0]).toBeLessThanOrEqual(result.percent)
    expect(result.range[1]).toBeGreaterThanOrEqual(result.percent)
    expect(result.range[0] % 5).toBe(0)
    expect(result.range[1] % 5).toBe(0)
  })

  it('caps at 60% with "low" confidence for programs with < 3 draws', () => {
    const fewDraws = mockDraws.slice(0, 1)
    const result = estimateProbability('test', 200, true, fewDraws)
    expect(result.percent).toBeLessThanOrEqual(60)
    expect(result.confidence).toBe('low')
  })

  it('uses composite strength fallback when score is null (no points grid)', () => {
    const result = estimateProbability('test', null, true, [])
    expect(result.confidence).toBe('low')
    expect(result.percent).toBeLessThanOrEqual(60)
    expect(result.caveats.length).toBeGreaterThan(0)
  })

  it('classifies tiers correctly', () => {
    // Very high score -> strong or competitive
    const strong = estimateProbability('test', 180, true, mockDraws)
    expect(['strong', 'competitive']).toContain(strong.tier)

    // Very low score -> low or unlikely
    const weak = estimateProbability('test', 80, true, mockDraws)
    expect(['low', 'unlikely']).toContain(weak.tier)
  })

  it('includes data points count, last draw date, and last draw min score', () => {
    const result = estimateProbability('test', 120, true, mockDraws)
    expect(result.dataPoints).toBe(mockDraws.length)
    expect(result.lastDrawDate).toBe('2026-01-15')
    expect(result.lastDrawMinScore).toBe(115) // min_score of the most recent draw
  })

  it('returns null lastDrawMinScore when no draws are available', () => {
    const result = estimateProbability('test', 120, true, [])
    expect(result.lastDrawMinScore).toBeNull()
  })

  it('percent is always between 0 and 100', () => {
    const results = [
      estimateProbability('test', 1000, true, mockDraws),
      estimateProbability('test', 0, true, mockDraws),
      estimateProbability('test', 120, true, mockDraws),
    ]
    for (const r of results) {
      expect(r.percent).toBeGreaterThanOrEqual(0)
      expect(r.percent).toBeLessThanOrEqual(100)
    }
  })
})
