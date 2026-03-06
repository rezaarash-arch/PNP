# PNP Entrepreneur Programs Assessment — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready assessment tool that scores clients across all Canadian PNP entrepreneur streams, embedded in the existing GenesisLink Next.js site.

**Architecture:** Next.js App Router pages at `/assessment/*` backed by Supabase PostgreSQL. Pure-function scoring engine evaluates JSONLogic rules against user profiles. Vercel cron jobs scrape provincial sites daily and feed an admin review queue. Anonymous encrypted sessions with optional email save.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Supabase (PostgreSQL + Auth), Zod, json-logic-js, @react-pdf/renderer, Vitest, Playwright, Tailwind CSS (matching GenesisLink brand tokens)

**Design Doc:** `docs/plans/2026-03-05-pnp-assessment-tool-design.md`

---

## Phase 1: Foundation (Types, DB, Scoring Engine)

This phase builds the core data layer and scoring engine with full test coverage. No UI yet — everything is testable via unit tests.

---

### Task 1: Project Scaffolding + Dependencies

**Files:**
- Modify: `package.json`
- Create: `lib/types/program.ts`
- Create: `lib/types/assessment.ts`
- Create: `lib/types/results.ts`
- Create: `vitest.config.ts`
- Create: `.env.local.example`

**Step 1: Install dependencies**

```bash
npm install @supabase/supabase-js json-logic-js zod @react-pdf/renderer pino
npm install -D vitest @testing-library/react @testing-library/jest-dom @playwright/test happy-dom
```

**Step 2: Create Vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['lib/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

**Step 3: Create type files**

Create `lib/types/program.ts` with all types from design doc §1.1:
- `ProgramStatus`, `EOIType`, `ProgramDefinition`, `PointsGrid`, `PointsCategory`, `PointsFactor`, `ScoringRule`
- Export all types

Create `lib/types/assessment.ts` with types from design doc §3.1:
- `EducationLevel` enum: `"high_school" | "2yr_diploma" | "3yr_degree" | "bachelors" | "masters" | "phd"`
- `UserProfile` interface (all fields from design doc)
- `QuestionnaireAnswers` — raw form answers before transformation to `UserProfile`

Create `lib/types/results.ts` with types from design doc §3.1 + §4.1:
- `EligibilityResult` (discriminated union)
- `ScoreBreakdown`, `Disqualifier`, `NearMiss`
- `ProgramResult`, `SensitivityAnalysis`
- `ProbabilityEstimate`

**Step 4: Create env example**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_ENCRYPTION_KEY=        # 32-byte hex for AES-256-GCM
CRON_SECRET=                   # shared secret for Vercel cron
ADMIN_PASSWORD=                # basic auth for /admin routes
ALERT_EMAIL=                   # admin notification email
ASSESSMENT_ENABLED=false       # feature flag
```

**Step 5: Run Vitest to verify config**

Run: `npx vitest run`
Expected: 0 tests found, no errors

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold assessment tool with types and test config"
```

---

### Task 2: Zod Validation Schemas

**Files:**
- Create: `lib/validation/schemas.ts`
- Create: `lib/validation/schemas.test.ts`

**Step 1: Write failing tests for UserProfile validation**

```typescript
// lib/validation/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { UserProfileSchema } from './schemas'

describe('UserProfileSchema', () => {
  it('accepts a valid full profile', () => {
    const valid = {
      age: 35,
      citizenshipCountry: 'IR',
      currentResidence: 'AE',
      clbEnglish: 7,
      clbFrench: null,
      highestEducation: 'bachelors',
      educationCountry: 'IR',
      hasCanadianDegree: false,
      canadianDegreeProvince: null,
      canadianDegreeLength: null,
      hasECA: true,
      businessOwnershipYears: 5,
      ownershipPercentage: 100,
      seniorManagementYears: 0,
      employeesManaged: 12,
      businessSector: '54',
      annualRevenue: 500000,
      personalNetWorth: 800000,
      liquidAssets: 400000,
      investmentCapacity: 300000,
      hasExploratoryVisit: true,
      exploratoryVisitProvince: 'BC',
      exploratoryVisitDays: 5,
      hasCommunityReferral: false,
      communityReferralProvince: null,
      hasCanadianWorkExperience: false,
      canadianWorkProvince: null,
      hasFamilyInCanada: false,
      familyProvince: null,
      intendedProvince: ['BC', 'AB'],
      intendedLocation: 'regional',
      intendedJobCreation: 2,
      hasPGWP: false,
      isRecentGraduate: false,
      hasOperatingBusiness: false,
      operatingBusinessProvince: null,
      operatingBusinessMonths: null,
    }
    expect(UserProfileSchema.parse(valid)).toEqual(valid)
  })

  it('rejects age below 18', () => {
    expect(() => UserProfileSchema.parse({ age: 15 })).toThrow()
  })

  it('rejects age above 75', () => {
    expect(() => UserProfileSchema.parse({ age: 80 })).toThrow()
  })

  it('rejects invalid education level', () => {
    expect(() =>
      UserProfileSchema.parse({ highestEducation: 'kindergarten' })
    ).toThrow()
  })

  it('rejects negative net worth', () => {
    expect(() => UserProfileSchema.parse({ personalNetWorth: -1 })).toThrow()
  })

  it('rejects CLB outside 1-12 range', () => {
    expect(() => UserProfileSchema.parse({ clbEnglish: 15 })).toThrow()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/validation/schemas.test.ts`
Expected: FAIL — module not found

**Step 3: Write the Zod schemas**

```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const EducationLevelSchema = z.enum([
  'high_school',
  '2yr_diploma',
  '3yr_degree',
  'bachelors',
  'masters',
  'phd',
])

export const ProvinceCodeSchema = z.enum([
  'BC', 'AB', 'SK', 'MB', 'ON', 'NB', 'NS', 'PE', 'NL', 'NT', 'YT',
])

export const LocationPreferenceSchema = z.enum([
  'metro', 'regional', 'rural', 'flexible',
])

export const UserProfileSchema = z.object({
  age: z.number().int().min(18).max(75),
  citizenshipCountry: z.string().length(2),
  currentResidence: z.string().length(2),

  clbEnglish: z.number().int().min(1).max(12).nullable(),
  clbFrench: z.number().int().min(1).max(12).nullable(),

  highestEducation: EducationLevelSchema,
  educationCountry: z.string().length(2),
  hasCanadianDegree: z.boolean(),
  canadianDegreeProvince: ProvinceCodeSchema.nullable(),
  canadianDegreeLength: z.number().int().min(1).max(10).nullable(),
  hasECA: z.boolean(),

  businessOwnershipYears: z.number().int().min(0).max(50),
  ownershipPercentage: z.number().int().min(0).max(100),
  seniorManagementYears: z.number().int().min(0).max(50),
  employeesManaged: z.number().int().min(0),
  businessSector: z.string().min(1),
  annualRevenue: z.number().min(0).nullable(),

  personalNetWorth: z.number().min(0),
  liquidAssets: z.number().min(0),
  investmentCapacity: z.number().min(0),

  hasExploratoryVisit: z.boolean(),
  exploratoryVisitProvince: ProvinceCodeSchema.nullable(),
  exploratoryVisitDays: z.number().int().min(0).nullable(),
  hasCommunityReferral: z.boolean(),
  communityReferralProvince: ProvinceCodeSchema.nullable(),
  hasCanadianWorkExperience: z.boolean(),
  canadianWorkProvince: ProvinceCodeSchema.nullable(),
  hasFamilyInCanada: z.boolean(),
  familyProvince: ProvinceCodeSchema.nullable(),

  intendedProvince: z.array(ProvinceCodeSchema).min(0),
  intendedLocation: LocationPreferenceSchema,
  intendedJobCreation: z.number().int().min(0),
  hasPGWP: z.boolean(),

  isRecentGraduate: z.boolean(),
  hasOperatingBusiness: z.boolean(),
  operatingBusinessProvince: ProvinceCodeSchema.nullable(),
  operatingBusinessMonths: z.number().int().min(0).nullable(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/validation/schemas.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add lib/validation/ && git commit -m "feat: add Zod validation schemas for user profile"
```

---

### Task 3: Test Fixture Profiles

**Files:**
- Create: `lib/scoring/__fixtures__/strong-candidate.json`
- Create: `lib/scoring/__fixtures__/minimal-candidate.json`
- Create: `lib/scoring/__fixtures__/graduate-candidate.json`
- Create: `lib/scoring/__fixtures__/high-net-worth-low-exp.json`
- Create: `lib/scoring/__fixtures__/ineligible-all.json`
- Create: `lib/scoring/__fixtures__/fixtures.test.ts`

**Step 1: Write fixture validation test**

```typescript
// lib/scoring/__fixtures__/fixtures.test.ts
import { describe, it, expect } from 'vitest'
import { UserProfileSchema } from '@/lib/validation/schemas'
import strongCandidate from './strong-candidate.json'
import minimalCandidate from './minimal-candidate.json'
import graduateCandidate from './graduate-candidate.json'
import highNetWorthLowExp from './high-net-worth-low-exp.json'
import ineligibleAll from './ineligible-all.json'

const fixtures = {
  strongCandidate,
  minimalCandidate,
  graduateCandidate,
  highNetWorthLowExp,
  ineligibleAll,
}

describe('Test fixtures', () => {
  Object.entries(fixtures).forEach(([name, fixture]) => {
    it(`${name} passes UserProfile validation`, () => {
      expect(() => UserProfileSchema.parse(fixture)).not.toThrow()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/scoring/__fixtures__/fixtures.test.ts`
Expected: FAIL — JSON files not found

**Step 3: Create all 5 fixture JSON files**

Create each fixture as a complete `UserProfile` object. Key characteristics:

- **strong-candidate.json**: age 38, CLB 9, bachelors, 10yr ownership 100%, $1.2M net worth, $600K investment, exploratory visit BC, community referral
- **minimal-candidate.json**: age 45, CLB 4, high_school, 3yr ownership 51%, $300K net worth, $100K investment, no visit, no referral
- **graduate-candidate.json**: age 28, CLB 8, bachelors (Canadian, AB), 1yr ownership 34%, $80K net worth, $50K investment, PGWP=true, isRecentGraduate=true, operating business in AB for 14 months
- **high-net-worth-low-exp.json**: age 50, CLB 5, masters, 1yr ownership 25%, $2M net worth, $800K investment, no visit
- **ineligible-all.json**: age 17, CLB null (no test), high_school, 0yr ownership, $50K net worth, $10K investment

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/scoring/__fixtures__/fixtures.test.ts`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add lib/scoring/__fixtures__/ && git commit -m "feat: add test fixture profiles for scoring engine"
```

---

### Task 4: JSONLogic Wrapper

**Files:**
- Create: `lib/scoring/jsonlogic.ts`
- Create: `lib/scoring/jsonlogic.test.ts`

**Step 1: Write failing tests**

```typescript
// lib/scoring/jsonlogic.test.ts
import { describe, it, expect } from 'vitest'
import { evaluateCondition } from './jsonlogic'

describe('evaluateCondition', () => {
  it('evaluates >= comparison', () => {
    const condition = { '>=': [{ var: 'age' }, 21] }
    expect(evaluateCondition(condition, { age: 25 })).toBe(true)
    expect(evaluateCondition(condition, { age: 20 })).toBe(false)
  })

  it('evaluates OR conditions', () => {
    const condition = {
      or: [
        { '>=': [{ var: 'clbEnglish' }, 4] },
        { '>=': [{ var: 'clbFrench' }, 4] },
      ],
    }
    expect(evaluateCondition(condition, { clbEnglish: 5, clbFrench: null })).toBe(true)
    expect(evaluateCondition(condition, { clbEnglish: null, clbFrench: 6 })).toBe(true)
    expect(evaluateCondition(condition, { clbEnglish: 2, clbFrench: 2 })).toBe(false)
  })

  it('evaluates == comparison', () => {
    const condition = { '==': [{ var: 'intendedLocation' }, 'rural'] }
    expect(evaluateCondition(condition, { intendedLocation: 'rural' })).toBe(true)
    expect(evaluateCondition(condition, { intendedLocation: 'metro' })).toBe(false)
  })

  it('handles null variables safely', () => {
    const condition = { '>=': [{ var: 'clbEnglish' }, 4] }
    expect(evaluateCondition(condition, { clbEnglish: null })).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/scoring/jsonlogic.test.ts`
Expected: FAIL — module not found

**Step 3: Implement JSONLogic wrapper**

```typescript
// lib/scoring/jsonlogic.ts
import jsonLogic from 'json-logic-js'

export type JsonLogicRule = Record<string, unknown>

export function evaluateCondition(
  condition: JsonLogicRule,
  data: Record<string, unknown>
): boolean {
  // json-logic-js treats null as 0 in comparisons, which can give wrong results.
  // Pre-process: replace null values with a sentinel that fails comparisons.
  const safeData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
  )
  const result = jsonLogic.apply(condition, safeData)
  return Boolean(result)
}
```

Note: `json-logic-js` has a known issue where `null >= 4` returns `false` but `null >= 0` returns `true`. The undefined substitution ensures null fields always fail `>=` checks.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/scoring/jsonlogic.test.ts`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add lib/scoring/jsonlogic.ts lib/scoring/jsonlogic.test.ts && git commit -m "feat: add JSONLogic wrapper with null-safety"
```

---

### Task 5: Program Rules Data (BC Entrepreneur Base — first program)

**Files:**
- Create: `lib/data/rules/bc-entrepreneur-base.json`
- Create: `lib/data/rules/rules.test.ts`

**Step 1: Write failing test that validates rule JSON structure**

```typescript
// lib/data/rules/rules.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import bcBase from './bc-entrepreneur-base.json'

const EligibilityRuleSchema = z.object({
  id: z.string(),
  label: z.string(),
  condition: z.record(z.unknown()),
  disqualifyMessage: z.string(),
})

const ScoringRuleSchema = z.object({
  condition: z.record(z.unknown()),
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
    const ids = bcBase.eligibility.map((r: { id: string }) => r.id)
    expect(ids).toContain('min-net-worth')
    expect(ids).toContain('min-clb')
    expect(ids).toContain('min-business-exp')
    expect(ids).toContain('min-investment')
  })

  it('scoring rules are ordered highest-points-first per factor', () => {
    if (!bcBase.scoring) return
    for (const cat of bcBase.scoring.categories) {
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/data/rules/rules.test.ts`
Expected: FAIL — JSON file not found

**Step 3: Create BC Entrepreneur Base rule JSON**

Create `lib/data/rules/bc-entrepreneur-base.json` with complete eligibility rules and scoring categories matching BC PNP Entrepreneur Base program. Include:
- Eligibility: min net worth ($600K), min CLB (4), min business experience (3yr), min investment ($200K)
- Scoring categories: Business Experience (ownership years, revenue, employees), Personal Net Worth, Language, Age, Location, Adaptability (exploratory visit, Canadian connection)
- Each factor with rules ordered highest-to-lowest points

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/data/rules/rules.test.ts`
Expected: All 3 tests PASS

**Step 5: Commit**

```bash
git add lib/data/rules/ && git commit -m "feat: add BC Entrepreneur Base program rules JSON"
```

---

### Task 6: Scoring Engine — Eligibility Evaluation

**Files:**
- Create: `lib/scoring/engine.ts`
- Create: `lib/scoring/engine.test.ts`

**Step 1: Write failing tests for eligibility checking**

```typescript
// lib/scoring/engine.test.ts
import { describe, it, expect } from 'vitest'
import { evaluateEligibility } from './engine'
import bcBase from '@/lib/data/rules/bc-entrepreneur-base.json'
import strongCandidate from './__fixtures__/strong-candidate.json'
import ineligibleAll from './__fixtures__/ineligible-all.json'

describe('evaluateEligibility', () => {
  it('strong candidate is eligible for BC Base', () => {
    const result = evaluateEligibility(strongCandidate, bcBase.eligibility)
    expect(result.eligible).toBe(true)
  })

  it('ineligible candidate fails with disqualifiers', () => {
    const result = evaluateEligibility(ineligibleAll, bcBase.eligibility)
    expect(result.eligible).toBe(false)
    if (!result.eligible) {
      expect(result.disqualifiers.length).toBeGreaterThan(0)
      expect(result.disqualifiers[0].requirement).toBeTruthy()
      expect(result.disqualifiers[0].explanation).toBeTruthy()
    }
  })

  it('reports specific disqualifier for net worth below minimum', () => {
    const lowNetWorth = { ...strongCandidate, personalNetWorth: 400000 }
    const result = evaluateEligibility(lowNetWorth, bcBase.eligibility)
    expect(result.eligible).toBe(false)
    if (!result.eligible) {
      const nwDQ = result.disqualifiers.find(d => d.requirement.includes('net worth'))
      expect(nwDQ).toBeTruthy()
    }
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/scoring/engine.test.ts`
Expected: FAIL — module not found

**Step 3: Implement eligibility evaluation**

```typescript
// lib/scoring/engine.ts
import { evaluateCondition, type JsonLogicRule } from './jsonlogic'
import type { UserProfile } from '@/lib/types/assessment'
import type { Disqualifier, NearMiss } from '@/lib/types/results'

interface EligibilityRule {
  id: string
  label: string
  condition: JsonLogicRule
  disqualifyMessage: string
}

interface EligibilityPass {
  eligible: true
}

interface EligibilityFail {
  eligible: false
  disqualifiers: Disqualifier[]
  nearMisses: NearMiss[]
}

export type EligibilityCheckResult = EligibilityPass | EligibilityFail

export function evaluateEligibility(
  profile: UserProfile,
  rules: EligibilityRule[]
): EligibilityCheckResult {
  const disqualifiers: Disqualifier[] = []

  for (const rule of rules) {
    if (!evaluateCondition(rule.condition, profile as Record<string, unknown>)) {
      disqualifiers.push({
        requirement: rule.label,
        userValue: resolveUserValue(rule.condition, profile),
        requiredValue: extractThreshold(rule.condition),
        explanation: interpolateMessage(rule.disqualifyMessage, profile),
        fixable: classifyFixability(rule.id),
        fixSuggestion: generateFixSuggestion(rule.id, profile),
      })
    }
  }

  if (disqualifiers.length > 0) {
    return {
      eligible: false,
      disqualifiers,
      nearMisses: findNearMisses(disqualifiers),
    }
  }

  return { eligible: true }
}

function resolveUserValue(condition: JsonLogicRule, profile: UserProfile): string {
  // Extract the variable name from the condition and look up in profile
  const varRef = findVarInCondition(condition)
  if (varRef && varRef in profile) {
    const val = (profile as Record<string, unknown>)[varRef]
    if (typeof val === 'number') return val.toLocaleString('en-CA')
    return String(val ?? 'N/A')
  }
  return 'N/A'
}

function findVarInCondition(obj: unknown): string | null {
  if (typeof obj !== 'object' || obj === null) return null
  if ('var' in (obj as Record<string, unknown>)) return (obj as Record<string, string>).var
  for (const val of Object.values(obj as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      for (const item of val) {
        const found = findVarInCondition(item)
        if (found) return found
      }
    }
    const found = findVarInCondition(val)
    if (found) return found
  }
  return null
}

function extractThreshold(condition: JsonLogicRule): string {
  // For simple {>=: [{var: X}, N]} conditions, extract N
  const op = Object.keys(condition)[0]
  const args = (condition as Record<string, unknown[]>)[op]
  if (Array.isArray(args) && args.length === 2) {
    const threshold = args[1]
    if (typeof threshold === 'number') return threshold.toLocaleString('en-CA')
    return String(threshold)
  }
  return 'see program requirements'
}

function interpolateMessage(template: string, profile: UserProfile): string {
  return template.replace(/\$\{(\w+)\}/g, (_match, key) => {
    const val = (profile as Record<string, unknown>)[key]
    if (typeof val === 'number') return val.toLocaleString('en-CA')
    return String(val ?? 'N/A')
  })
}

function classifyFixability(ruleId: string): boolean {
  // Some things are fixable (language, net worth over time), others less so (age)
  const fixableRules = ['min-net-worth', 'min-clb', 'min-investment', 'min-business-exp', 'min-education']
  return fixableRules.includes(ruleId)
}

function generateFixSuggestion(ruleId: string, _profile: UserProfile): string | null {
  const suggestions: Record<string, string> = {
    'min-net-worth': 'Consider building net worth through business growth or asset accumulation',
    'min-clb': 'Take a language test (IELTS/CELPIP for English, TEF/TCF for French) to obtain a CLB score',
    'min-investment': 'Explore programs with lower investment thresholds',
    'min-business-exp': 'Gain additional business ownership or senior management experience',
    'min-education': 'Consider obtaining an Educational Credential Assessment (ECA)',
  }
  return suggestions[ruleId] ?? null
}

function findNearMisses(disqualifiers: Disqualifier[]): NearMiss[] {
  return disqualifiers
    .filter(d => d.fixable)
    .map(d => ({
      requirement: d.requirement,
      gap: `Current: ${d.userValue}, Required: ${d.requiredValue}`,
      effort: 'medium' as const,
      suggestion: d.fixSuggestion ?? 'Improve this area to qualify',
    }))
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/scoring/engine.test.ts`
Expected: All 3 tests PASS

**Step 5: Commit**

```bash
git add lib/scoring/engine.ts lib/scoring/engine.test.ts && git commit -m "feat: implement eligibility evaluation engine"
```

---

### Task 7: Scoring Engine — Points Calculation

**Files:**
- Modify: `lib/scoring/engine.ts` — add `computeScore` function
- Modify: `lib/scoring/engine.test.ts` — add scoring tests

**Step 1: Write failing tests for point scoring**

```typescript
// Add to lib/scoring/engine.test.ts
import { computeScore } from './engine'

describe('computeScore', () => {
  it('computes score for strong candidate on BC Base', () => {
    const result = computeScore(strongCandidate, bcBase.scoring!)
    expect(result.totalScore).toBeGreaterThan(0)
    expect(result.breakdown.length).toBeGreaterThan(0)
  })

  it('each breakdown item has category, factor, points, maxPoints', () => {
    const result = computeScore(strongCandidate, bcBase.scoring!)
    for (const item of result.breakdown) {
      expect(item.category).toBeTruthy()
      expect(item.factor).toBeTruthy()
      expect(item.points).toBeGreaterThanOrEqual(0)
      expect(item.maxPoints).toBeGreaterThan(0)
      expect(item.points).toBeLessThanOrEqual(item.maxPoints)
    }
  })

  it('total score equals sum of breakdown points', () => {
    const result = computeScore(strongCandidate, bcBase.scoring!)
    const sum = result.breakdown.reduce((acc, b) => acc + b.points, 0)
    expect(result.totalScore).toBe(sum)
  })

  it('returns null score for programs without points grid', () => {
    const result = computeScore(strongCandidate, null)
    expect(result).toBeNull()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/scoring/engine.test.ts`
Expected: FAIL — computeScore not exported

**Step 3: Implement score computation**

Add to `lib/scoring/engine.ts`:

```typescript
import type { ScoreBreakdown } from '@/lib/types/results'

interface ScoringGrid {
  maxScore: number | null
  minScoreRequired: number | null
  categories: {
    name: string
    maxPoints: number
    factors: {
      name: string
      maxPoints: number
      rules: { condition: JsonLogicRule; points: number; label?: string }[]
    }[]
  }[]
}

interface ScoreResult {
  totalScore: number
  maxPossible: number
  meetsMinimum: boolean
  breakdown: ScoreBreakdown[]
}

export function computeScore(
  profile: UserProfile,
  scoring: ScoringGrid | null
): ScoreResult | null {
  if (!scoring) return null

  const breakdown: ScoreBreakdown[] = []
  let totalScore = 0
  let maxPossible = 0

  for (const category of scoring.categories) {
    for (const factor of category.factors) {
      maxPossible += factor.maxPoints
      let matched = false

      // Rules are ordered highest-to-lowest; first match wins
      for (const rule of factor.rules) {
        if (!matched && evaluateCondition(rule.condition, profile as Record<string, unknown>)) {
          breakdown.push({
            category: category.name,
            factor: factor.name,
            points: rule.points,
            maxPoints: factor.maxPoints,
            explanation: rule.label ?? `${factor.name}: ${rule.points}/${factor.maxPoints} points`,
          })
          totalScore += rule.points
          matched = true
        }
      }

      if (!matched) {
        breakdown.push({
          category: category.name,
          factor: factor.name,
          points: 0,
          maxPoints: factor.maxPoints,
          explanation: `${factor.name}: 0/${factor.maxPoints} points — does not meet any scoring threshold`,
        })
      }
    }
  }

  return {
    totalScore,
    maxPossible,
    meetsMinimum: scoring.minScoreRequired === null || totalScore >= scoring.minScoreRequired,
    breakdown,
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/scoring/engine.test.ts`
Expected: All tests PASS (both eligibility and scoring)

**Step 5: Commit**

```bash
git add lib/scoring/engine.ts lib/scoring/engine.test.ts && git commit -m "feat: implement points calculation with breakdown"
```

---

### Task 8: Probability Estimation

**Files:**
- Create: `lib/scoring/probability.ts`
- Create: `lib/scoring/probability.test.ts`

**Step 1: Write failing tests**

```typescript
// lib/scoring/probability.test.ts
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
  it('returns "ineligible" for ineligible candidates', () => {
    const result = estimateProbability('test', null, false, [])
    expect(result.tier).toBe('ineligible')
    expect(result.percent).toBe(0)
  })

  it('returns higher probability for scores well above cutoff', () => {
    const high = estimateProbability('test', 150, true, mockDraws)
    const low = estimateProbability('test', 100, true, mockDraws)
    expect(high.percent).toBeGreaterThan(low.percent)
  })

  it('rounds to nearest 5%', () => {
    const result = estimateProbability('test', 130, true, mockDraws)
    expect(result.percent % 5).toBe(0)
  })

  it('always returns a range, not just a point estimate', () => {
    const result = estimateProbability('test', 120, true, mockDraws)
    expect(result.range[0]).toBeLessThanOrEqual(result.percent)
    expect(result.range[1]).toBeGreaterThanOrEqual(result.percent)
  })

  it('caps at 60% with low confidence for insufficient draw data', () => {
    const fewDraws = mockDraws.slice(0, 1)
    const result = estimateProbability('test', 200, true, fewDraws)
    expect(result.percent).toBeLessThanOrEqual(60)
    expect(result.confidence).toBe('low')
  })

  it('uses composite strength fallback when score is null', () => {
    const result = estimateProbability('test', null, true, [])
    expect(result.confidence).toBe('low')
    expect(result.percent).toBeLessThanOrEqual(60)
    expect(result.caveats.length).toBeGreaterThan(0)
  })

  it('classifies tiers correctly', () => {
    // Score far above cutoff → strong/competitive
    const strong = estimateProbability('test', 180, true, mockDraws)
    expect(['strong', 'competitive']).toContain(strong.tier)

    // Score far below cutoff → low/unlikely
    const weak = estimateProbability('test', 80, true, mockDraws)
    expect(['low', 'unlikely']).toContain(weak.tier)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/scoring/probability.test.ts`
Expected: FAIL — module not found

**Step 3: Implement probability estimation**

Implement `lib/scoring/probability.ts` following the algorithm from design doc §4.2:
- `estimateProbability(programId, userScore, eligible, draws)` → `ProbabilityEstimate`
- `logistic(z, midpoint, steepness)` helper
- `classifyTier(percent)` helper
- `mean(arr)` and `stddev(arr)` stat helpers
- Shrinkage, activity penalty, confidence interval, rounding logic

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/scoring/probability.test.ts`
Expected: All 7 tests PASS

**Step 5: Commit**

```bash
git add lib/scoring/probability.ts lib/scoring/probability.test.ts && git commit -m "feat: implement probability estimation with calibrated heuristics"
```

---

### Task 9: Sensitivity Analysis

**Files:**
- Create: `lib/scoring/sensitivity.ts`
- Create: `lib/scoring/sensitivity.test.ts`

**Step 1: Write failing tests**

```typescript
// lib/scoring/sensitivity.test.ts
import { describe, it, expect } from 'vitest'
import { computeSensitivity } from './sensitivity'
import bcBase from '@/lib/data/rules/bc-entrepreneur-base.json'
import minimalCandidate from './__fixtures__/minimal-candidate.json'

describe('computeSensitivity', () => {
  it('returns improvement suggestions for minimal candidate', () => {
    const results = computeSensitivity(minimalCandidate, bcBase)
    expect(results.length).toBeGreaterThan(0)
  })

  it('each suggestion has factor, current, improved, and score change', () => {
    const results = computeSensitivity(minimalCandidate, bcBase)
    for (const r of results) {
      expect(r.factor).toBeTruthy()
      expect(r.currentValue).toBeTruthy()
      expect(r.improvedValue).toBeTruthy()
      expect(r.scoreChange).toBeGreaterThan(0)
      expect(['low', 'medium', 'high']).toContain(r.effort)
    }
  })

  it('results are sorted by scoreChange descending', () => {
    const results = computeSensitivity(minimalCandidate, bcBase)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].scoreChange).toBeLessThanOrEqual(results[i - 1].scoreChange)
    }
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/scoring/sensitivity.test.ts`
Expected: FAIL — module not found

**Step 3: Implement sensitivity analysis**

Implement `lib/scoring/sensitivity.ts` following design doc §3.3 `computeSensitivity` pseudocode. For each improvable field (CLB, business years, net worth, investment, location), compute how score changes at each step value. Return sorted by impact.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/scoring/sensitivity.test.ts`
Expected: All 3 tests PASS

**Step 5: Commit**

```bash
git add lib/scoring/sensitivity.ts lib/scoring/sensitivity.test.ts && git commit -m "feat: implement sensitivity analysis for score improvement suggestions"
```

---

### Task 10: Full Program Evaluator (orchestrates eligibility + scoring + probability + sensitivity)

**Files:**
- Create: `lib/scoring/evaluator.ts`
- Create: `lib/scoring/evaluator.test.ts`

**Step 1: Write failing tests**

```typescript
// lib/scoring/evaluator.test.ts
import { describe, it, expect } from 'vitest'
import { evaluateAllPrograms } from './evaluator'
import strongCandidate from './__fixtures__/strong-candidate.json'
import ineligibleAll from './__fixtures__/ineligible-all.json'

describe('evaluateAllPrograms', () => {
  it('returns results for every active program', () => {
    const results = evaluateAllPrograms(strongCandidate, [], {})
    expect(results.length).toBeGreaterThan(0)
    // Should include at least BC Base
    expect(results.some(r => r.programId === 'bc-entrepreneur-base')).toBe(true)
  })

  it('results are sorted by probability descending', () => {
    const results = evaluateAllPrograms(strongCandidate, [], {})
    for (let i = 1; i < results.length; i++) {
      expect(results[i].probability.percent).toBeLessThanOrEqual(
        results[i - 1].probability.percent
      )
    }
  })

  it('ineligible candidate gets ineligible for all programs', () => {
    const results = evaluateAllPrograms(ineligibleAll, [], {})
    for (const r of results) {
      if (r.eligibility.eligible === false) {
        expect(r.probability.tier).toBe('ineligible')
      }
    }
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/scoring/evaluator.test.ts`
Expected: FAIL — module not found

**Step 3: Implement full evaluator**

The evaluator orchestrates all components: loads all program rule JSONs, runs eligibility + scoring + probability + sensitivity for each, returns sorted results.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/scoring/evaluator.test.ts`
Expected: All 3 tests PASS

**Step 5: Commit**

```bash
git add lib/scoring/evaluator.ts lib/scoring/evaluator.test.ts && git commit -m "feat: implement full program evaluator orchestrating all scoring components"
```

---

### Task 11: Remaining Program Rules (all 18 programs)

**Files:**
- Create: `lib/data/rules/<program-id>.json` for each of the remaining 17 programs
- Modify: `lib/data/rules/rules.test.ts` — test all rule files

**Step 1: Write test that validates ALL rule files exist and conform to schema**

Extend `rules.test.ts` to glob all JSON files in the rules directory and validate each one against the `ProgramRuleSchema`.

**Step 2: Run test to verify it fails**

Expected: FAIL — only bc-entrepreneur-base.json exists

**Step 3: Create rule JSON files for all remaining programs**

Create one JSON file per program from the design doc §1.2 list. For programs without public points grids (NWT, Yukon, AB Graduate), set `scoring: null`. For closed programs (SK), include eligibility rules but mark in metadata.

Programs to create:
- `bc-entrepreneur-regional.json`
- `bc-entrepreneur-strategic.json`
- `ab-rural-entrepreneur.json`
- `ab-graduate-entrepreneur.json`
- `ab-foreign-graduate.json`
- `ab-farm.json`
- `sk-entrepreneur.json` (closed)
- `sk-graduate-entrepreneur.json` (closed)
- `mb-entrepreneur.json`
- `mb-farm-investor.json`
- `on-entrepreneur.json` (redesigning)
- `nb-entrepreneurial.json`
- `nb-post-grad.json`
- `ns-entrepreneur.json`
- `ns-graduate-entrepreneur.json`
- `pei-work-permit.json`
- `nl-entrepreneur.json`
- `nl-graduate-entrepreneur.json`
- `nwt-business.json`
- `yk-business-nominee.json`

**Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/data/rules/rules.test.ts`
Expected: All rule files validate

**Step 5: Add cross-fixture tests**

Test each fixture profile against all programs — verify strong candidate is eligible for most, ineligible-all fails all, graduate candidate matches graduate streams.

**Step 6: Commit**

```bash
git add lib/data/rules/ && git commit -m "feat: add rule definitions for all 18 PNP entrepreneur programs"
```

---

## Phase 2: Database + API Layer

---

### Task 12: Supabase Setup + Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `lib/db/client.ts`
- Create: `lib/db/programs.ts`
- Create: `lib/db/draws.ts`
- Create: `lib/db/assessments.ts`

**Step 1: Create migration SQL**

Copy the full schema from design doc §2.3 into `supabase/migrations/001_initial_schema.sql`. Add Row Level Security policies:
- `programs`, `draws`, `program_rules`: public read, admin write
- `assessments`: read/write only by matching session token
- `review_queue`, `pipeline_runs`: admin only

**Step 2: Create Supabase client singleton**

```typescript
// lib/db/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Step 3: Create DB operation modules**

Implement CRUD functions in `lib/db/programs.ts`, `lib/db/draws.ts`, `lib/db/assessments.ts` with typed returns.

**Step 4: Commit**

```bash
git add supabase/ lib/db/ && git commit -m "feat: add Supabase schema migration and DB operation modules"
```

---

### Task 13: Seed Script for Program Data

**Files:**
- Create: `scripts/seed-programs.ts`
- Create: `scripts/seed-draws.ts`

**Step 1: Create seed script that inserts all programs + rules from JSON files**

Reads all `lib/data/rules/*.json`, inserts into `programs` table and `program_rules` table (version 1).

**Step 2: Create seed script for historical draw data**

Inserts manually curated historical draw data for BC, MB, NS, NL (programs with published draw results).

**Step 3: Test seed scripts locally**

Run: `npx tsx scripts/seed-programs.ts`
Expected: All 21 programs inserted, 21 rule versions created

**Step 4: Commit**

```bash
git add scripts/ && git commit -m "feat: add database seed scripts for programs and draw history"
```

---

### Task 14: API — Compute Endpoint

**Files:**
- Create: `app/api/assessment/compute/route.ts`
- Create: `app/api/assessment/compute/route.test.ts`

**Step 1: Write failing test**

Test that POST with a valid UserProfile body returns a JSON response with `results` array sorted by probability, each containing `programId`, `eligibility`, `probability`, and `sensitivity`.

**Step 2: Implement compute route**

- Parse + validate request body with Zod
- Load current program rules from DB (or cached in-memory)
- Load draw history for all programs
- Call `evaluateAllPrograms(profile, draws, rulesMap)`
- Return JSON response with results + meta

**Step 3: Run test to verify it passes**

**Step 4: Commit**

```bash
git add app/api/assessment/ && git commit -m "feat: implement /api/assessment/compute endpoint"
```

---

### Task 15: API — Save/Resume + Session Management

**Files:**
- Create: `lib/session/crypto.ts` — AES-256-GCM encrypt/decrypt
- Create: `lib/session/crypto.test.ts`
- Create: `app/api/assessment/save/route.ts`
- Create: `app/api/assessment/resume/route.ts`

**Step 1: Write failing tests for session crypto**

Test encrypt/decrypt round-trip, test that ciphertext differs from plaintext, test that wrong key fails.

**Step 2: Implement session crypto**

**Step 3: Implement save endpoint**

POST: receives answers + optional email, creates/updates `assessments` row, returns session token in encrypted httpOnly cookie.

**Step 4: Implement resume endpoint**

GET: reads session token from cookie, loads assessment from DB, returns answers + results.

**Step 5: Commit**

```bash
git add lib/session/ app/api/assessment/ && git commit -m "feat: implement save/resume with encrypted session management"
```

---

### Task 16: API — PDF Generation

**Files:**
- Create: `lib/pdf/generator.tsx`
- Create: `app/api/assessment/pdf/route.ts`

**Step 1: Implement PDF template**

Using `@react-pdf/renderer`, create a branded PDF with:
- GenesisLink header (navy + cyan)
- Summary table of all programs with tiers
- Per-program breakdown
- Disclaimer page

**Step 2: Implement PDF API route**

POST: loads assessment from session, generates PDF, returns as `application/pdf` response.

**Step 3: Manual test**

Generate a PDF with the strong-candidate fixture, verify it renders correctly.

**Step 4: Commit**

```bash
git add lib/pdf/ app/api/assessment/pdf/ && git commit -m "feat: implement branded PDF report generation"
```

---

### Task 17: API — Programs Public Endpoint

**Files:**
- Create: `app/api/programs/route.ts`

**Step 1: Implement programs list endpoint**

GET: returns all programs with status, stream name, province. Cached for 1 hour with `stale-while-revalidate`. No auth required.

**Step 2: Commit**

```bash
git add app/api/programs/ && git commit -m "feat: implement public /api/programs endpoint"
```

---

## Phase 3: Frontend (Questionnaire + Results)

---

### Task 18: Shared UI Components (Design System)

**Files:**
- Create: `components/assessment/shared/DisclaimerBanner.tsx`
- Create: `components/assessment/shared/ProgressBar.tsx`
- Create: `components/assessment/shared/SavePrompt.tsx`
- Create: `styles/assessment.css` — CSS variables from design doc §5.1

**Step 1: Create CSS variables file**

Add all design tokens from design doc §5.1 (fonts, colors, spacing, shadows, tier colors).

**Step 2: Build DisclaimerBanner**

Renders the disclaimer text from design doc §7.1. Accepts `variant: 'banner' | 'inline'`.

**Step 3: Build ProgressBar**

7-step horizontal progress indicator. Props: `currentStep`, `completedSteps`, `labels`. Responsive — collapses to dots on mobile.

**Step 4: Build SavePrompt**

Floating prompt that appears after section 3. Email input + "Save" button. Dismissible.

**Step 5: Commit**

```bash
git add components/assessment/shared/ styles/ && git commit -m "feat: add shared assessment UI components with GenesisLink design tokens"
```

---

### Task 19: Form Input Components

**Files:**
- Create: `components/assessment/inputs/RadioCardGroup.tsx`
- Create: `components/assessment/inputs/RangeSlider.tsx`
- Create: `components/assessment/inputs/CurrencyInput.tsx`
- Create: `components/assessment/inputs/SearchableDropdown.tsx`
- Create: `components/assessment/inputs/Tooltip.tsx`
- Create: `components/assessment/inputs/inputs.test.tsx`

**Step 1: Write failing component tests**

Test RadioCardGroup renders options, handles selection, supports keyboard navigation.
Test CurrencyInput formats values with $ and thousand separators.
Test Tooltip opens on click/hover, closes on escape.

**Step 2: Implement all 5 input components**

Each component: accessible (ARIA labels, keyboard nav), mobile-first (44px touch targets), styled with design tokens.

**Step 3: Run tests to verify they pass**

**Step 4: Commit**

```bash
git add components/assessment/inputs/ && git commit -m "feat: add accessible form input components"
```

---

### Task 20: Questionnaire Sections (7 sections)

**Files:**
- Create: `components/assessment/sections/PersonalInfo.tsx`
- Create: `components/assessment/sections/Language.tsx`
- Create: `components/assessment/sections/Education.tsx`
- Create: `components/assessment/sections/BusinessExperience.tsx`
- Create: `components/assessment/sections/FinancialProfile.tsx`
- Create: `components/assessment/sections/CanadaConnection.tsx`
- Create: `components/assessment/sections/BusinessIntent.tsx`

**Step 1: Implement each section component**

Each section: receives `answers` state + `onUpdate` callback. Contains the questions from design doc §5.3 with conditional rendering. Uses the input components from Task 19. Includes tooltips for technical terms.

**Step 2: Write component tests**

Test conditional question rendering (e.g., spouse question only shows if married). Test that all required fields are validated.

**Step 3: Commit**

```bash
git add components/assessment/sections/ && git commit -m "feat: add all 7 questionnaire section components"
```

---

### Task 21: QuestionnaireShell (orchestrator)

**Files:**
- Create: `components/assessment/QuestionnaireShell.tsx`
- Create: `components/assessment/QuestionnaireShell.test.tsx`

**Step 1: Write failing tests**

Test navigation between sections (next/back). Test auto-save fires on answer change. Test progress bar updates.

**Step 2: Implement QuestionnaireShell**

Client component that:
- Manages current section state
- Renders ProgressBar + current section + navigation buttons
- Auto-saves answers to session (debounced, via `/api/assessment/save`)
- Transforms raw answers to `UserProfile` on completion
- Navigates to `/assessment/review` on finish

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add components/assessment/QuestionnaireShell.* && git commit -m "feat: add questionnaire shell with navigation and auto-save"
```

---

### Task 22: Results Dashboard Components

**Files:**
- Create: `components/assessment/results/ProbabilityBar.tsx`
- Create: `components/assessment/results/ProgramCard.tsx`
- Create: `components/assessment/results/ScoreBreakdown.tsx`
- Create: `components/assessment/results/GapAnalysis.tsx`
- Create: `components/assessment/results/SensitivityTable.tsx`
- Create: `components/assessment/results/ProgramDetailModal.tsx`
- Create: `components/assessment/results/ResultsDashboard.tsx`

**Step 1: Build ProbabilityBar**

Horizontal bar with tier coloring. Props: `percent`, `range`, `tier`, `confidence`. Includes tier label + range text. Color-coded per design doc §5.3.

**Step 2: Build ProgramCard**

Card layout from design doc wireframe. Province flag, stream name, status badge, score bar, probability bar, eligibility badge, "View Details" button.

**Step 3: Build ScoreBreakdown**

Accordion component showing category → factor → points/max. Uses description lists for accessibility.

**Step 4: Build GapAnalysis**

Red/amber/green requirement list. Each item shows requirement name, user value, required value, status icon.

**Step 5: Build SensitivityTable**

Table of improvement suggestions sorted by impact. Columns: factor, current, improved, score delta, probability delta, effort badge.

**Step 6: Build ProgramDetailModal**

Modal containing ScoreBreakdown + GapAnalysis + SensitivityTable + program info + disclaimer. Focus trap, keyboard dismissible.

**Step 7: Build ResultsDashboard**

Orchestrates: summary header, disclaimer banner, sorted ProgramCard list, bottom CTAs (book consultation, email PDF, start over).

**Step 8: Commit**

```bash
git add components/assessment/results/ && git commit -m "feat: add results dashboard components with score breakdown and probability display"
```

---

### Task 23: Next.js Pages

**Files:**
- Create: `app/assessment/page.tsx` — Landing page
- Create: `app/assessment/questionnaire/page.tsx` — Questionnaire
- Create: `app/assessment/review/page.tsx` — Review answers
- Create: `app/assessment/results/page.tsx` — Results dashboard

**Step 1: Implement landing page**

Server component. Hero section, 3 feature cards, disclaimer banner, "Start Assessment" CTA. Feature flag check (`ASSESSMENT_ENABLED`).

**Step 2: Implement questionnaire page**

Client component wrapping `QuestionnaireShell`. Creates session on mount.

**Step 3: Implement review page**

Displays all answers grouped by section. Edit buttons per section. Consent checkbox + "Submit" CTA. Calls `/api/assessment/compute` on submit.

**Step 4: Implement results page**

Server component that loads results from session, renders `ResultsDashboard`. Includes email PDF form and "Book Consultation" CTA linking to `/contact`.

**Step 5: Commit**

```bash
git add app/assessment/ && git commit -m "feat: add assessment page routes (landing, questionnaire, review, results)"
```

---

## Phase 4: Pipeline + Admin

---

### Task 24: Scraper Infrastructure

**Files:**
- Create: `lib/pipeline/scrapers/base.ts` — abstract scraper class
- Create: `lib/pipeline/scrapers/bc.ts` — BC scraper
- Create: `lib/pipeline/normalizer.ts`
- Create: `lib/pipeline/changeDetector.ts`
- Create: `lib/pipeline/changeDetector.test.ts`

**Step 1: Build base scraper interface**

```typescript
// lib/pipeline/scrapers/base.ts
export interface ScraperResult {
  province: string
  scrapedAt: string
  rules: unknown[]
  draws: unknown[]
  errors: { message: string; url: string }[]
}

export abstract class BaseScraper {
  abstract province: string
  abstract scrapeRules(): Promise<unknown[]>
  abstract scrapeDraws(): Promise<unknown[]>

  async run(): Promise<ScraperResult> {
    const errors: { message: string; url: string }[] = []
    let rules: unknown[] = []
    let draws: unknown[] = []

    try { rules = await this.scrapeRules() } catch (e) {
      errors.push({ message: String(e), url: '' })
    }
    try { draws = await this.scrapeDraws() } catch (e) {
      errors.push({ message: String(e), url: '' })
    }

    return { province: this.province, scrapedAt: new Date().toISOString(), rules, draws, errors }
  }
}
```

**Step 2: Build BC scraper as reference implementation**

Fetches welcomebc.ca entrepreneur pages, extracts requirements and draw results.

**Step 3: Build change detector with tests**

SHA-256 hash comparison. Test: same input → same hash, different input → different hash.

**Step 4: Commit**

```bash
git add lib/pipeline/ && git commit -m "feat: add scraper infrastructure with BC reference implementation"
```

---

### Task 25: Pipeline API Route + Vercel Cron Config

**Files:**
- Create: `app/api/pipeline/scrape/[province]/route.ts`
- Create: `vercel.json` — cron config

**Step 1: Implement scrape API route**

POST: validates cron secret, runs scraper for province, compares hashes, auto-applies draws, queues rule changes, logs run.

**Step 2: Configure Vercel cron**

```json
{
  "crons": [
    {
      "path": "/api/pipeline/scrape/bc",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Add one cron entry per active province.

**Step 3: Commit**

```bash
git add app/api/pipeline/ vercel.json && git commit -m "feat: add pipeline scrape endpoint with Vercel cron scheduling"
```

---

### Task 26: Admin Dashboard

**Files:**
- Create: `app/admin/layout.tsx` — basic auth wrapper
- Create: `app/admin/pipeline/page.tsx` — review queue + logs
- Create: `app/admin/programs/page.tsx` — program rule editor
- Create: `middleware.ts` — admin auth middleware

**Step 1: Implement admin auth middleware**

Basic auth check on `/admin/*` routes using `ADMIN_PASSWORD` env var.

**Step 2: Build pipeline review page**

Displays `review_queue` items with `pending` status. JSON diff view (old vs new). Approve/reject buttons. Pipeline run log table.

**Step 3: Build programs management page**

List all programs. Click to view/edit rule JSON. Version history. Status toggle.

**Step 4: Commit**

```bash
git add app/admin/ middleware.ts && git commit -m "feat: add admin dashboard for pipeline review and program management"
```

---

## Phase 5: Testing + Polish + Rollout

---

### Task 27: E2E Tests

**Files:**
- Create: `e2e/assessment-flow.spec.ts`
- Create: `e2e/accessibility.spec.ts`
- Create: `playwright.config.ts`

**Step 1: Configure Playwright**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'npm run dev', port: 3000 },
})
```

**Step 2: Write happy-path E2E test**

Navigate to /assessment → click "Start Assessment" → fill all sections with strong candidate data → submit → verify results page shows programs with scores and probability tiers.

**Step 3: Write accessibility E2E test**

Run axe-core on every assessment page. Assert zero violations.

**Step 4: Run E2E tests**

Run: `npx playwright test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add e2e/ playwright.config.ts && git commit -m "test: add E2E tests for full assessment flow and accessibility"
```

---

### Task 28: Rate Limiting Middleware

**Files:**
- Modify: `middleware.ts` — add rate limiting for API routes

**Step 1: Implement rate limiting**

Use Vercel Edge middleware with in-memory token bucket per IP. Limits per design doc §6.2 (compute: 10/min, save: 5/min, pdf: 3/min).

**Step 2: Commit**

```bash
git add middleware.ts && git commit -m "feat: add rate limiting middleware for assessment API routes"
```

---

### Task 29: Feature Flag + Coming Soon Page

**Files:**
- Modify: `app/assessment/page.tsx` — check `ASSESSMENT_ENABLED`
- Create: `components/assessment/ComingSoon.tsx`

**Step 1: Build ComingSoon component**

"Assessment Coming Soon" page with email signup form for launch notification. Styled with GenesisLink brand.

**Step 2: Add feature flag check**

If `ASSESSMENT_ENABLED !== 'true'`, render ComingSoon instead of assessment landing.

**Step 3: Commit**

```bash
git add app/assessment/ components/assessment/ComingSoon.tsx && git commit -m "feat: add feature flag with coming-soon page for staged rollout"
```

---

### Task 30: Data Retention Cleanup Function

**Files:**
- Create: `app/api/cleanup/route.ts`
- Add cron entry in `vercel.json`

**Step 1: Implement cleanup endpoint**

Deletes `assessments` rows where `expires_at < NOW()`. Runs daily via cron. Logs deletion count.

**Step 2: Commit**

```bash
git add app/api/cleanup/ vercel.json && git commit -m "feat: add automated data retention cleanup for PIPEDA compliance"
```

---

### Task 31: Final Integration Test + Smoke Test

**Files:**
- Create: `scripts/smoke-test.ts`

**Step 1: Run full test suite**

```bash
npx vitest run          # unit + integration
npx playwright test     # E2E
```

Expected: All tests PASS

**Step 2: Create smoke test script**

Calls `/api/assessment/compute` with each fixture profile, verifies response shape and status 200. Calls `/api/programs`, verifies 21 programs returned.

**Step 3: Run smoke test**

```bash
npx tsx scripts/smoke-test.ts
```

Expected: All smoke checks PASS

**Step 4: Final commit**

```bash
git add scripts/smoke-test.ts && git commit -m "test: add smoke test and verify full integration"
```

---

## Task Dependency Graph

```
Phase 1: Foundation
  T1 (scaffold) → T2 (schemas) → T3 (fixtures) → T4 (jsonlogic)
  T4 → T5 (BC rules) → T6 (eligibility) → T7 (scoring) → T8 (probability) → T9 (sensitivity) → T10 (evaluator) → T11 (all rules)

Phase 2: Database + API
  T11 → T12 (supabase) → T13 (seed) → T14 (compute API) → T15 (save/resume) → T16 (PDF) → T17 (programs API)

Phase 3: Frontend
  T17 → T18 (shared UI) → T19 (inputs) → T20 (sections) → T21 (shell) → T22 (results) → T23 (pages)

Phase 4: Pipeline + Admin
  T17 → T24 (scrapers) → T25 (pipeline API) → T26 (admin)

Phase 5: Polish + Rollout
  T23 + T26 → T27 (E2E) → T28 (rate limiting) → T29 (feature flag) → T30 (cleanup) → T31 (smoke test)
```

Phases 3 and 4 can run **in parallel** after Phase 2 completes.

---

## Estimated Task Count: 31 tasks, ~155 steps

Each task: 2-7 steps (write test → run fail → implement → run pass → commit)
