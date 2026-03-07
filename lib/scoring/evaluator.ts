import { evaluateEligibility, computeScore } from './engine'
import { estimateProbability } from './probability'
import { computeSensitivity } from './sensitivity'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult, EligibilityResult } from '@/lib/types/results'

// Import available program rules
import bcBase from '@/lib/data/rules/bc-entrepreneur-base.json'

interface ProgramRuleSet {
  programId: string
  eligibility: any[]
  scoring: any
}

// Registry of all loaded program rules
const PROGRAM_RULES: ProgramRuleSet[] = [
  bcBase as ProgramRuleSet,
  // More programs will be added in future tasks
]

interface DrawDataMap {
  [programId: string]: { draw_date: string; min_score: number; invitations_issued: number }[]
}

export function evaluateAllPrograms(
  profile: UserProfile,
  drawData: DrawDataMap
): ProgramResult[] {
  const results: ProgramResult[] = []

  for (const rules of PROGRAM_RULES) {
    const eligibilityResult = evaluateEligibility(profile, rules.eligibility)
    const scoreResult = computeScore(profile, rules.scoring)
    const draws = drawData[rules.programId] ?? []

    const isEligible = eligibilityResult.eligible
    const userScore = isEligible && scoreResult ? scoreResult.totalScore : null

    const probability = estimateProbability(
      rules.programId,
      userScore,
      isEligible,
      draws
    )

    const sensitivity = isEligible ? computeSensitivity(profile, rules) : []

    let eligibility: EligibilityResult

    if (isEligible) {
      eligibility = {
        eligible: true,
        score: scoreResult?.totalScore ?? null,
        maxScore: scoreResult?.maxPossible ?? null,
        breakdown: scoreResult?.breakdown ?? [],
        meetsMinScore: scoreResult?.meetsMinimum ?? true,
      }
    } else {
      // eligibilityResult is the ineligible variant here
      eligibility = eligibilityResult as EligibilityResult
    }

    results.push({
      programId: rules.programId,
      eligibility,
      probability,
      sensitivity,
    })
  }

  // Sort by probability descending
  results.sort((a, b) => b.probability.percent - a.probability.percent)

  return results
}
