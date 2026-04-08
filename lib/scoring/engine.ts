import { evaluateCondition, type JsonLogicRule } from './jsonlogic'
import type { UserProfile } from '@/lib/types/assessment'
import type { Disqualifier, NearMiss, ScoreBreakdown } from '@/lib/types/results'

/**
 * Shape of an eligibility rule from the program rules JSON.
 */
export interface EligibilityRule {
  id: string
  label: string
  condition: JsonLogicRule
  disqualifyMessage: string
}

/**
 * Result of evaluating eligibility rules against a user profile.
 * Discriminated union: either eligible or not.
 */
export type EligibilityCheckResult =
  | { eligible: true }
  | { eligible: false; disqualifiers: Disqualifier[]; nearMisses: NearMiss[] }

/**
 * Enrich a profile with alias fields so JSONLogic rules that use
 * alternative field names still resolve correctly.
 */
function enrichProfile(profile: Record<string, unknown>): Record<string, unknown> {
  return {
    ...profile,
    // Aliases for fields used in some program rules but named differently on UserProfile
    proposedInvestment: profile.investmentCapacity,
    yearsManagement: profile.seniorManagementYears,
    industrySector: profile.businessSector,
    // Assume language test results are valid (we don't collect test date)
    languageTestValid: true,
    // Assume not a business succession unless explicitly set
    isBusinessSuccession: profile.isBusinessSuccession ?? false,
    // NAICS/NOC not collected — set to null so rules that check them fail gracefully
    naicsCode: profile.naicsCode ?? null,
    nocTeer: profile.nocTeer ?? 0,
  }
}

/**
 * Evaluates all eligibility rules against a user profile.
 * Returns all failing rules as disqualifiers (does not short-circuit on first failure).
 */
export function evaluateEligibility(
  profile: UserProfile,
  rules: EligibilityRule[]
): EligibilityCheckResult {
  const profileData = enrichProfile(profile as unknown as Record<string, unknown>)
  const disqualifiers: Disqualifier[] = []
  const nearMisses: NearMiss[] = []

  for (const rule of rules) {
    const passes = evaluateCondition(rule.condition, profileData)

    if (!passes) {
      const userValue = resolveUserValue(rule.condition, profileData)
      const threshold = extractThreshold(rule.condition)
      const fixable = classifyFixability(rule.id)
      const explanation = interpolateMessage(rule.disqualifyMessage, profileData)

      disqualifiers.push({
        requirement: rule.label,
        userValue: formatValue(userValue),
        requiredValue: formatValue(threshold),
        explanation,
        fixable,
        fixSuggestion: fixable ? generateFixSuggestion(rule.id, profileData, threshold) : null,
      })

      if (fixable) {
        nearMisses.push({
          requirement: rule.label,
          gap: computeGap(userValue, threshold),
          effort: classifyEffort(rule.id, userValue, threshold),
          suggestion: generateFixSuggestion(rule.id, profileData, threshold),
        })
      }
    }
  }

  if (disqualifiers.length === 0) {
    return { eligible: true }
  }

  return { eligible: false, disqualifiers, nearMisses }
}

// ---------------------------------------------------------------------------
// Points calculation
// ---------------------------------------------------------------------------

/**
 * Shape of a single scoring rule within a factor.
 */
export interface ScoringRule {
  condition: JsonLogicRule
  points: number
  label?: string
}

/**
 * A scoring factor: one dimension of evaluation (e.g., "Years of business ownership").
 */
export interface ScoringFactor {
  name: string
  maxPoints: number
  rules: ScoringRule[]
}

/**
 * A scoring category grouping related factors (e.g., "Business Experience").
 */
export interface ScoringCategory {
  name: string
  maxPoints: number
  factors: ScoringFactor[]
}

/**
 * The top-level scoring grid from a program rules JSON.
 */
export interface ScoringGrid {
  maxScore: number | null
  minScoreRequired: number | null
  categories: ScoringCategory[]
}

/**
 * Result of computing a candidate's score against a program's scoring grid.
 */
export interface ScoreResult {
  totalScore: number
  maxPossible: number
  meetsMinimum: boolean
  breakdown: ScoreBreakdown[]
  includesBusinessPlanEstimate?: boolean
}

/**
 * Category names that represent business plan / concept scores
 * assessed by the province. For these, we estimate 80% of max points
 * assuming the candidate uses GenesisLink business development services.
 */
const BUSINESS_PLAN_CATEGORIES = new Set([
  'business concept (assessed by bc pnp)',
  'business concept',
  'business establishment plan',
])

function isBusinessPlanCategory(name: string): boolean {
  return BUSINESS_PLAN_CATEGORIES.has(name.toLowerCase())
}

/**
 * Computes a candidate's score against a program's scoring grid.
 * Iterates categories -> factors -> rules (ordered highest-to-lowest).
 * First matching rule wins for each factor.
 *
 * Business Plan / Business Concept categories are estimated at 80% of
 * maximum points (assumes GenesisLink business development services).
 *
 * Returns null if no scoring grid is provided.
 */
export function computeScore(
  profile: UserProfile,
  scoring: ScoringGrid | null
): ScoreResult | null {
  if (!scoring) return null

  const breakdown: ScoreBreakdown[] = []
  let totalScore = 0
  let maxPossible = 0
  let includesBusinessPlanEstimate = false

  for (const category of scoring.categories) {
    // Business plan/concept categories: award 80% of max as GenesisLink estimate
    if (isBusinessPlanCategory(category.name)) {
      const categoryMax = category.factors.reduce((sum, f) => sum + f.maxPoints, 0)
      const estimated = Math.round(categoryMax * 0.8)
      maxPossible += categoryMax
      totalScore += estimated
      includesBusinessPlanEstimate = true

      breakdown.push({
        category: category.name,
        factor: 'GenesisLink Business Plan Estimate',
        points: estimated,
        maxPoints: categoryMax,
        explanation: `Estimated ${estimated}/${categoryMax} points (80%) with GenesisLink business development services*`,
      })
      continue
    }

    for (const factor of category.factors) {
      maxPossible += factor.maxPoints
      let matched = false

      for (const rule of factor.rules) {
        if (!matched && evaluateCondition(rule.condition as JsonLogicRule, enrichProfile(profile as unknown as Record<string, unknown>))) {
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
          explanation: `${factor.name}: 0/${factor.maxPoints} points`,
        })
      }
    }
  }

  return {
    totalScore,
    maxPossible,
    meetsMinimum: scoring.minScoreRequired === null || totalScore >= scoring.minScoreRequired,
    breakdown,
    includesBusinessPlanEstimate,
  }
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Extracts the user's current value from the profile based on the var reference
 * in the JSONLogic condition. Handles simple >= comparisons and "or"/"and" wrappers.
 */
function resolveUserValue(
  condition: JsonLogicRule,
  profile: Record<string, unknown>
): unknown {
  const varName = extractVarName(condition)
  if (varName && varName in profile) {
    return profile[varName]
  }

  // For "or" conditions (e.g., CLB English OR CLB French), return the best value
  if ('or' in condition) {
    const alternatives = condition['or'] as JsonLogicRule[]
    const values: unknown[] = []
    for (const alt of alternatives) {
      const name = extractVarName(alt)
      if (name && name in profile) {
        values.push(profile[name])
      }
    }
    // Return the highest non-null numeric value
    const numericValues = values
      .filter((v): v is number => typeof v === 'number')
    return numericValues.length > 0 ? Math.max(...numericValues) : null
  }

  return null
}

/**
 * Extracts the variable name from a JSONLogic condition.
 * Handles: { ">=": [{ "var": "fieldName" }, value] }
 *          { "and": [...] } - extracts from first sub-condition
 */
function extractVarName(condition: JsonLogicRule): string | null {
  // Direct comparison: { ">=": [{ "var": "x" }, 100] }
  for (const op of ['>=', '<=', '>', '<', '==', '!=']) {
    if (op in condition) {
      const args = condition[op] as unknown[]
      if (Array.isArray(args) && args.length >= 1) {
        const first = args[0] as Record<string, unknown>
        if (first && typeof first === 'object' && 'var' in first) {
          return first['var'] as string
        }
      }
    }
  }

  // Wrapped in "and": extract from first sub-condition
  if ('and' in condition) {
    const subs = condition['and'] as JsonLogicRule[]
    if (Array.isArray(subs) && subs.length > 0) {
      return extractVarName(subs[0])
    }
  }

  // Wrapped in "or": extract from first sub-condition
  if ('or' in condition) {
    const subs = condition['or'] as JsonLogicRule[]
    if (Array.isArray(subs) && subs.length > 0) {
      return extractVarName(subs[0])
    }
  }

  return null
}

/**
 * Extracts the numeric threshold from a JSONLogic condition.
 * Handles simple comparisons and takes the threshold from the first sub-condition
 * for "or"/"and" wrappers.
 */
function extractThreshold(condition: JsonLogicRule): unknown {
  for (const op of ['>=', '<=', '>', '<', '==', '!=']) {
    if (op in condition) {
      const args = condition[op] as unknown[]
      if (Array.isArray(args) && args.length >= 2) {
        return args[1]
      }
    }
  }

  // Wrapped in "or": extract threshold from first sub-condition
  if ('or' in condition) {
    const subs = condition['or'] as JsonLogicRule[]
    if (Array.isArray(subs) && subs.length > 0) {
      return extractThreshold(subs[0])
    }
  }

  // Wrapped in "and": extract threshold from first sub-condition
  if ('and' in condition) {
    const subs = condition['and'] as JsonLogicRule[]
    if (Array.isArray(subs) && subs.length > 0) {
      return extractThreshold(subs[0])
    }
  }

  return null
}

/**
 * Replaces ${fieldName} and $${fieldName} tokens in a message template
 * with actual values from the user profile.
 */
function interpolateMessage(
  template: string,
  profile: Record<string, unknown>
): string {
  // Handle $${field} (dollar-prefixed values, e.g. for currency)
  let result = template.replace(/\$\$\{(\w+)\}/g, (_match, field: string) => {
    const value = profile[field]
    if (typeof value === 'number') {
      return `$${value.toLocaleString()}`
    }
    return value != null ? `$${String(value)}` : 'N/A'
  })

  // Handle ${field} (simple substitution)
  result = result.replace(/\$\{(\w+)\}/g, (_match, field: string) => {
    const value = profile[field]
    if (value == null) return 'N/A'
    if (typeof value === 'number') return value.toLocaleString()
    return String(value)
  })

  return result
}

/**
 * Determines whether a disqualifying requirement is fixable (i.e., the candidate
 * could potentially address the gap with effort/time).
 */
function classifyFixability(ruleId: string): boolean {
  const fixableRules = new Set([
    'min-net-worth',
    'min-clb',
    'min-business-exp',
    'min-investment',
    'min-education',
  ])
  return fixableRules.has(ruleId)
}

/**
 * Generates an actionable suggestion string for a fixable disqualifier.
 */
function generateFixSuggestion(
  ruleId: string,
  profile: Record<string, unknown>,
  threshold: unknown
): string {
  switch (ruleId) {
    case 'min-net-worth': {
      const required = typeof threshold === 'number' ? threshold : 600000
      const current = (profile['personalNetWorth'] as number) ?? 0
      const gap = required - current
      return `Increase personal net worth by $${gap.toLocaleString()} to meet the $${required.toLocaleString()} minimum. Consider building assets over time or including spousal assets.`
    }
    case 'min-clb': {
      const required = typeof threshold === 'number' ? threshold : 4
      return `Improve language proficiency to at least CLB ${required}. Consider taking IELTS or CELPIP preparation courses.`
    }
    case 'min-business-exp': {
      const required = typeof threshold === 'number' ? threshold : 3
      const current = (profile['businessOwnershipYears'] as number) ?? 0
      const gap = required - current
      return `Gain ${gap} more year${gap !== 1 ? 's' : ''} of business ownership experience to meet the ${required}-year minimum.`
    }
    case 'min-investment': {
      const required = typeof threshold === 'number' ? threshold : 200000
      const current = (profile['investmentCapacity'] as number) ?? 0
      const gap = required - current
      return `Increase investment capacity by $${gap.toLocaleString()} to meet the $${required.toLocaleString()} minimum.`
    }
    case 'min-education': {
      return 'Consider upgrading education credentials or obtaining an Educational Credential Assessment (ECA).'
    }
    default:
      return 'Review program requirements for options to address this gap.'
  }
}

/**
 * Computes a human-readable string describing the gap between the user's value
 * and the required threshold.
 */
function computeGap(userValue: unknown, threshold: unknown): string {
  if (typeof userValue === 'number' && typeof threshold === 'number') {
    const diff = threshold - userValue
    if (diff > 0) {
      return `Short by ${diff.toLocaleString()}`
    }
    return `Exceeds by ${Math.abs(diff).toLocaleString()}`
  }

  if (userValue == null) {
    return `No value provided; required: ${String(threshold)}`
  }

  return `Current: ${String(userValue)}; Required: ${String(threshold)}`
}

/**
 * Classifies the effort level required to fix a disqualifier.
 */
function classifyEffort(
  ruleId: string,
  userValue: unknown,
  threshold: unknown
): 'low' | 'medium' | 'high' {
  switch (ruleId) {
    case 'min-net-worth': {
      if (typeof userValue === 'number' && typeof threshold === 'number') {
        const gap = threshold - userValue
        if (gap <= 100000) return 'low'
        if (gap <= 300000) return 'medium'
        return 'high'
      }
      return 'high'
    }
    case 'min-clb': {
      if (userValue == null) return 'high'
      if (typeof userValue === 'number' && typeof threshold === 'number') {
        const gap = threshold - userValue
        if (gap <= 1) return 'low'
        if (gap <= 3) return 'medium'
        return 'high'
      }
      return 'medium'
    }
    case 'min-business-exp': {
      if (typeof userValue === 'number' && typeof threshold === 'number') {
        const gap = threshold - userValue
        if (gap <= 1) return 'medium'
        return 'high'
      }
      return 'high'
    }
    case 'min-investment': {
      if (typeof userValue === 'number' && typeof threshold === 'number') {
        const gap = threshold - userValue
        if (gap <= 50000) return 'low'
        if (gap <= 100000) return 'medium'
        return 'high'
      }
      return 'high'
    }
    default:
      return 'medium'
  }
}

/**
 * Formats a value for display in a disqualifier.
 */
function formatValue(value: unknown): string {
  if (value == null) return 'N/A'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}
