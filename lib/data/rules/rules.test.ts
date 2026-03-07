import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import bcBase from './bc-entrepreneur-base.json'

const EligibilityRuleSchema = z.object({
  id: z.string(),
  label: z.string(),
  condition: z.record(z.string(), z.unknown()),
  disqualifyMessage: z.string(),
})

const ScoringRuleSchema = z.object({
  condition: z.record(z.string(), z.unknown()),
  points: z.number(),
  label: z.string().optional(),
})

const FactorSchema = z.object({
  name: z.string(),
  maxPoints: z.number(),
  rules: z.array(ScoringRuleSchema).min(1),
})

const CategorySchema = z.object({
  name: z.string(),
  maxPoints: z.number(),
  factors: z.array(FactorSchema).min(1),
})

const ProgramRuleSchema = z.object({
  programId: z.string(),
  version: z.number().int().min(1),
  eligibility: z.array(EligibilityRuleSchema).min(1),
  scoring: z.object({
    maxScore: z.number().nullable(),
    minScoreRequired: z.number().nullable(),
    categories: z.array(CategorySchema),
  }).nullable(),
})

describe('BC Entrepreneur Base rules', () => {
  it('conforms to ProgramRule schema', () => {
    expect(() => ProgramRuleSchema.parse(bcBase)).not.toThrow()
  })

  it('has all required eligibility checks', () => {
    const ids = (bcBase as any).eligibility.map((r: { id: string }) => r.id)
    expect(ids).toContain('min-net-worth')
    expect(ids).toContain('min-clb')
    expect(ids).toContain('min-business-exp')
    expect(ids).toContain('min-investment')
  })

  it('scoring rules are ordered highest-points-first per factor', () => {
    if (!(bcBase as any).scoring) return
    for (const cat of (bcBase as any).scoring.categories) {
      for (const factor of cat.factors) {
        for (let i = 1; i < factor.rules.length; i++) {
          expect(factor.rules[i].points).toBeLessThanOrEqual(
            factor.rules[i - 1].points
          )
        }
      }
    }
  })
})
