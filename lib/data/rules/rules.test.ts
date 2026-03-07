import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Import all rule files
import bcBase from './bc-entrepreneur-base.json'
import bcRegional from './bc-entrepreneur-regional.json'
import bcStrategic from './bc-entrepreneur-strategic.json'
import abRural from './ab-rural-entrepreneur.json'
import abGraduate from './ab-graduate-entrepreneur.json'
import abForeignGrad from './ab-foreign-graduate.json'
import abFarm from './ab-farm.json'
import skEntrepreneur from './sk-entrepreneur.json'
import skGraduate from './sk-graduate-entrepreneur.json'
import mbEntrepreneur from './mb-entrepreneur.json'
import mbFarm from './mb-farm-investor.json'
import onEntrepreneur from './on-entrepreneur.json'
import nbEntrepreneurial from './nb-entrepreneurial.json'
import nbPostGrad from './nb-post-grad.json'
import nsEntrepreneur from './ns-entrepreneur.json'
import nsGraduate from './ns-graduate-entrepreneur.json'
import peiWorkPermit from './pei-work-permit.json'
import nlEntrepreneur from './nl-entrepreneur.json'
import nlGraduate from './nl-graduate-entrepreneur.json'
import nwtBusiness from './nwt-business.json'
import ykBusiness from './yk-business-nominee.json'

// Import fixtures for cross-testing
import strongCandidate from '@/lib/scoring/__fixtures__/strong-candidate.json'
import minimalCandidate from '@/lib/scoring/__fixtures__/minimal-candidate.json'
import graduateCandidate from '@/lib/scoring/__fixtures__/graduate-candidate.json'
import highNetWorthLowExp from '@/lib/scoring/__fixtures__/high-net-worth-low-exp.json'
import ineligibleAll from '@/lib/scoring/__fixtures__/ineligible-all.json'

// Import engine for cross-fixture testing
import { evaluateEligibility, computeScore } from '@/lib/scoring/engine'

// ---------------------------------------------------------------------------
// Zod schemas for validation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// All programs to validate
// ---------------------------------------------------------------------------

const ALL_PROGRAMS: Record<string, unknown> = {
  'bc-entrepreneur-base': bcBase,
  'bc-entrepreneur-regional': bcRegional,
  'bc-entrepreneur-strategic': bcStrategic,
  'ab-rural-entrepreneur': abRural,
  'ab-graduate-entrepreneur': abGraduate,
  'ab-foreign-graduate': abForeignGrad,
  'ab-farm': abFarm,
  'sk-entrepreneur': skEntrepreneur,
  'sk-graduate-entrepreneur': skGraduate,
  'mb-entrepreneur': mbEntrepreneur,
  'mb-farm-investor': mbFarm,
  'on-entrepreneur': onEntrepreneur,
  'nb-entrepreneurial': nbEntrepreneurial,
  'nb-post-grad': nbPostGrad,
  'ns-entrepreneur': nsEntrepreneur,
  'ns-graduate-entrepreneur': nsGraduate,
  'pei-work-permit': peiWorkPermit,
  'nl-entrepreneur': nlEntrepreneur,
  'nl-graduate-entrepreneur': nlGraduate,
  'nwt-business': nwtBusiness,
  'yk-business-nominee': ykBusiness,
}

// Programs that should have scoring grids (non-null scoring)
const PROGRAMS_WITH_SCORING = [
  'bc-entrepreneur-base',
  'bc-entrepreneur-regional',
  'ab-rural-entrepreneur',
  'mb-entrepreneur',
  'on-entrepreneur',
  'nb-entrepreneurial',
  'nb-post-grad',
  'ns-entrepreneur',
  'ns-graduate-entrepreneur',
  'pei-work-permit',
  'nl-entrepreneur',
  'nl-graduate-entrepreneur',
]

// Programs with null scoring
const PROGRAMS_WITHOUT_SCORING = [
  'bc-entrepreneur-strategic',
  'ab-graduate-entrepreneur',
  'ab-foreign-graduate',
  'ab-farm',
  'sk-entrepreneur',
  'sk-graduate-entrepreneur',
  'mb-farm-investor',
  'nwt-business',
  'yk-business-nominee',
]

// Graduate programs (require CLB 7, Canadian degree, operating business)
const GRADUATE_PROGRAMS = [
  'ab-graduate-entrepreneur',
  'ab-foreign-graduate',
  'sk-graduate-entrepreneur',
  'nb-post-grad',
  'ns-graduate-entrepreneur',
  'nl-graduate-entrepreneur',
]

// ---------------------------------------------------------------------------
// Schema & structure tests for ALL programs
// ---------------------------------------------------------------------------

describe('All program rule files', () => {
  it('has exactly 21 program rule files', () => {
    expect(Object.keys(ALL_PROGRAMS).length).toBe(21)
  })

  Object.entries(ALL_PROGRAMS).forEach(([id, rules]) => {
    describe(`${id}`, () => {
      it('conforms to ProgramRule schema', () => {
        expect(() => ProgramRuleSchema.parse(rules)).not.toThrow()
      })

      it('programId matches filename', () => {
        expect((rules as any).programId).toBe(id)
      })

      it('has at least 1 eligibility rule', () => {
        expect((rules as any).eligibility.length).toBeGreaterThanOrEqual(1)
      })

      it('eligibility rule IDs are unique within the program', () => {
        const ids = (rules as any).eligibility.map((r: { id: string }) => r.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('scoring rules are ordered highest-points-first per factor', () => {
        const scoring = (rules as any).scoring
        if (!scoring) return
        for (const cat of scoring.categories) {
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
  })
})

describe('Programs with scoring grids', () => {
  PROGRAMS_WITH_SCORING.forEach((id) => {
    it(`${id} has non-null scoring`, () => {
      expect((ALL_PROGRAMS[id] as any).scoring).not.toBeNull()
    })
  })

  PROGRAMS_WITH_SCORING.forEach((id) => {
    it(`${id} category maxPoints sum matches maxScore when declared`, () => {
      const scoring = (ALL_PROGRAMS[id] as any).scoring
      if (!scoring || scoring.maxScore === null) return
      const categorySum = scoring.categories.reduce(
        (acc: number, cat: any) => acc + cat.maxPoints,
        0
      )
      expect(categorySum).toBe(scoring.maxScore)
    })

    it(`${id} factor maxPoints sum matches category maxPoints`, () => {
      const scoring = (ALL_PROGRAMS[id] as any).scoring
      if (!scoring) return
      for (const cat of scoring.categories) {
        const factorSum = cat.factors.reduce(
          (acc: number, f: any) => acc + f.maxPoints,
          0
        )
        expect(factorSum).toBe(cat.maxPoints)
      }
    })
  })
})

describe('Programs without scoring grids', () => {
  PROGRAMS_WITHOUT_SCORING.forEach((id) => {
    it(`${id} has null scoring`, () => {
      expect((ALL_PROGRAMS[id] as any).scoring).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// BC Entrepreneur Base specific tests (preserved from original)
// ---------------------------------------------------------------------------

describe('BC Entrepreneur Base rules', () => {
  it('has all required eligibility checks', () => {
    const ids = (bcBase as any).eligibility.map((r: { id: string }) => r.id)
    expect(ids).toContain('min-net-worth')
    expect(ids).toContain('min-clb')
    expect(ids).toContain('min-business-exp')
    expect(ids).toContain('min-investment')
  })
})

// ---------------------------------------------------------------------------
// Cross-fixture tests
// ---------------------------------------------------------------------------

describe('Cross-fixture: strong candidate', () => {
  // Strong candidate: age 38, CLB 9, 10yr ownership, $1.2M net worth, $600K invest
  // Should be eligible for most standard entrepreneur programs

  const standardEntrepreneurPrograms = [
    'bc-entrepreneur-base',
    'bc-entrepreneur-regional',
    'bc-entrepreneur-strategic',
    'ab-rural-entrepreneur',
    'mb-entrepreneur',
    'nb-entrepreneurial',
    'ns-entrepreneur',
    'pei-work-permit',
    'nl-entrepreneur',
  ]

  standardEntrepreneurPrograms.forEach((id) => {
    it(`is eligible for ${id}`, () => {
      const rules = ALL_PROGRAMS[id] as any
      const result = evaluateEligibility(strongCandidate as any, rules.eligibility)
      expect(result.eligible).toBe(true)
    })
  })

  it('can compute scores for programs with scoring grids', () => {
    const rules = ALL_PROGRAMS['bc-entrepreneur-base'] as any
    const result = computeScore(strongCandidate as any, rules.scoring)
    expect(result).not.toBeNull()
    expect(result!.totalScore).toBeGreaterThan(0)
  })
})

describe('Cross-fixture: ineligible-all candidate', () => {
  // Ineligible: age 19, no language, 0yr ownership, $50K net worth, $10K invest
  // Should fail all programs

  Object.entries(ALL_PROGRAMS).forEach(([id, rules]) => {
    it(`is ineligible for ${id}`, () => {
      const result = evaluateEligibility(ineligibleAll as any, (rules as any).eligibility)
      expect(result.eligible).toBe(false)
    })
  })
})

describe('Cross-fixture: graduate candidate', () => {
  // Graduate: age 28, CLB 8, Canadian bachelors AB, PGWP, recent grad, operating business AB 14mo
  // Should match AB graduate stream

  it('is eligible for ab-graduate-entrepreneur', () => {
    const rules = ALL_PROGRAMS['ab-graduate-entrepreneur'] as any
    const result = evaluateEligibility(graduateCandidate as any, rules.eligibility)
    expect(result.eligible).toBe(true)
  })

  it('is eligible for ab-foreign-graduate', () => {
    const rules = ALL_PROGRAMS['ab-foreign-graduate'] as any
    const result = evaluateEligibility(graduateCandidate as any, rules.eligibility)
    expect(result.eligible).toBe(true)
  })

  // Graduate should NOT be eligible for most standard entrepreneur programs
  // due to low net worth ($80K), low investment ($50K), only 1yr ownership
  const standardPrograms = [
    'bc-entrepreneur-base',
    'bc-entrepreneur-strategic',
    'on-entrepreneur',
    'nb-entrepreneurial',
    'ns-entrepreneur',
    'nl-entrepreneur',
  ]

  standardPrograms.forEach((id) => {
    it(`is ineligible for ${id} (does not meet financial/experience thresholds)`, () => {
      const rules = ALL_PROGRAMS[id] as any
      const result = evaluateEligibility(graduateCandidate as any, rules.eligibility)
      expect(result.eligible).toBe(false)
    })
  })

  // Should not match graduate programs in other provinces (wrong province)
  const otherProvinceGradPrograms = [
    'sk-graduate-entrepreneur',
    'nb-post-grad',
    'ns-graduate-entrepreneur',
    'nl-graduate-entrepreneur',
  ]

  otherProvinceGradPrograms.forEach((id) => {
    it(`is ineligible for ${id} (wrong province)`, () => {
      const rules = ALL_PROGRAMS[id] as any
      const result = evaluateEligibility(graduateCandidate as any, rules.eligibility)
      expect(result.eligible).toBe(false)
    })
  })
})

describe('Cross-fixture: high-net-worth-low-exp candidate', () => {
  // High NW: age 50, CLB 5, 1yr ownership 25%, $2M net worth, $800K invest
  // Has high financials but low business experience — should fail programs requiring 3yr ownership

  it('is ineligible for bc-entrepreneur-base (needs 3yr ownership)', () => {
    const rules = ALL_PROGRAMS['bc-entrepreneur-base'] as any
    const result = evaluateEligibility(highNetWorthLowExp as any, rules.eligibility)
    expect(result.eligible).toBe(false)
  })

  it('is ineligible for on-entrepreneur (needs 3yr ownership)', () => {
    const rules = ALL_PROGRAMS['on-entrepreneur'] as any
    const result = evaluateEligibility(highNetWorthLowExp as any, rules.eligibility)
    expect(result.eligible).toBe(false)
  })
})

describe('Cross-fixture: minimal candidate', () => {
  // Minimal: age 45, CLB 4, high_school, 3yr ownership, $300K net worth, $100K invest
  // Should be eligible for the lower-threshold programs

  it('is eligible for bc-entrepreneur-regional', () => {
    const rules = ALL_PROGRAMS['bc-entrepreneur-regional'] as any
    const result = evaluateEligibility(minimalCandidate as any, rules.eligibility)
    expect(result.eligible).toBe(true)
  })

  it('is ineligible for bc-entrepreneur-base (needs $600K net worth)', () => {
    const rules = ALL_PROGRAMS['bc-entrepreneur-base'] as any
    const result = evaluateEligibility(minimalCandidate as any, rules.eligibility)
    expect(result.eligible).toBe(false)
  })

  it('is ineligible for on-entrepreneur (needs $800K net worth)', () => {
    const rules = ALL_PROGRAMS['on-entrepreneur'] as any
    const result = evaluateEligibility(minimalCandidate as any, rules.eligibility)
    expect(result.eligible).toBe(false)
  })
})
