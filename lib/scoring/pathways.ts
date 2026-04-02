import type { ProgramResult, ProgramMeta } from '@/lib/types/results'

/**
 * A single improvement step within a pathway.
 */
export interface PathwayImprovement {
  requirement: string
  gap: string
  effort: 'low' | 'medium' | 'high'
  suggestion: string
  fixable: boolean
}

/**
 * A recommended pathway for an ineligible user — represents one program
 * they could become eligible for with specific improvements.
 */
export interface PathwayRecommendation {
  programId: string
  totalDisqualifiers: number
  fixableCount: number
  /** Percentage of disqualifiers that are fixable (0–100) */
  closenessPercent: number
  improvements: PathwayImprovement[]
  overallEffort: 'low' | 'medium' | 'high'
  meta: ProgramMeta
}

/**
 * Given a list of program results, identifies the 3 programs that are closest
 * to eligibility for an ineligible user. "Closest" is determined by:
 *   1. Fewest total disqualifiers
 *   2. Most fixable disqualifiers (higher fix ratio)
 *   3. Lowest average effort
 *
 * Only considers active programs (or paused, not closed).
 * Returns at most 3 recommendations.
 */
export function computePathways(results: ProgramResult[]): PathwayRecommendation[] {
  const ineligibleResults = results.filter(
    (r) => !r.eligibility.eligible &&
           r.meta.status !== 'closed' &&
           r.meta.status !== 'redesigning'
  )

  if (ineligibleResults.length === 0) return []

  const scored = ineligibleResults.map((r) => {
    // TypeScript narrowing: we know eligibility.eligible is false here
    const elig = r.eligibility as {
      eligible: false
      disqualifiers: Array<{
        requirement: string
        userValue: string
        requiredValue: string
        explanation: string
        fixable: boolean
        fixSuggestion: string | null
      }>
      nearMisses: Array<{
        requirement: string
        gap: string
        effort: 'low' | 'medium' | 'high'
        suggestion: string
      }>
    }

    const totalDisqualifiers = elig.disqualifiers.length
    const fixableCount = elig.disqualifiers.filter((d) => d.fixable).length
    const fixRatio = totalDisqualifiers > 0 ? fixableCount / totalDisqualifiers : 0

    // Build improvement list — combine near misses with non-fixable disqualifiers
    const nearMissMap = new Map(
      elig.nearMisses.map((nm) => [nm.requirement, nm])
    )

    const improvements: PathwayImprovement[] = elig.disqualifiers.map((d) => {
      const nearMiss = nearMissMap.get(d.requirement)
      return {
        requirement: d.requirement,
        gap: nearMiss?.gap ?? `Current: ${d.userValue}; Required: ${d.requiredValue}`,
        effort: nearMiss?.effort ?? 'high',
        suggestion: nearMiss?.suggestion ?? d.fixSuggestion ?? d.explanation,
        fixable: d.fixable,
      }
    })

    // Sort improvements: fixable first, then by effort (low → medium → high)
    const effortOrder = { low: 0, medium: 1, high: 2 }
    improvements.sort((a, b) => {
      if (a.fixable !== b.fixable) return a.fixable ? -1 : 1
      return effortOrder[a.effort] - effortOrder[b.effort]
    })

    // Overall effort = weighted average of fixable improvement efforts
    const fixableImprovements = improvements.filter((i) => i.fixable)
    let overallEffort: 'low' | 'medium' | 'high' = 'high'
    if (fixableImprovements.length > 0) {
      const avgEffort =
        fixableImprovements.reduce((sum, i) => sum + effortOrder[i.effort], 0) /
        fixableImprovements.length
      overallEffort = avgEffort < 0.7 ? 'low' : avgEffort < 1.5 ? 'medium' : 'high'
    }

    // Closeness percent: higher = closer to eligible
    // Uses diminishing penalty per disqualifier so many-fixable scores > few-nonfixable
    const closenessPercent = totalDisqualifiers > 0
      ? Math.round(fixRatio * 100 * Math.exp(-0.3 * totalDisqualifiers))
      : 0

    // Composite score for sorting (higher = closer to eligible)
    const compositeScore =
      (1 / Math.max(totalDisqualifiers, 1)) * 100 +
      fixRatio * 50 -
      (fixableImprovements.reduce((sum, i) => sum + effortOrder[i.effort], 0) /
        Math.max(fixableImprovements.length, 1)) * 10

    return {
      recommendation: {
        programId: r.programId,
        totalDisqualifiers,
        fixableCount,
        closenessPercent: Math.max(0, Math.min(100, closenessPercent)),
        improvements,
        overallEffort,
        meta: r.meta,
      } satisfies PathwayRecommendation,
      compositeScore,
    }
  })

  // Sort by composite score (highest = most reachable)
  scored.sort((a, b) => b.compositeScore - a.compositeScore)

  return scored.slice(0, 3).map((s) => s.recommendation)
}
