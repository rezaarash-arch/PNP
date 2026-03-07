import { evaluateEligibility, computeScore } from './engine'
import { estimateProbability } from './probability'
import { computeSensitivity } from './sensitivity'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult, EligibilityResult } from '@/lib/types/results'

// Import all program rules
import bcBase from '@/lib/data/rules/bc-entrepreneur-base.json'
import bcRegional from '@/lib/data/rules/bc-entrepreneur-regional.json'
import bcStrategic from '@/lib/data/rules/bc-entrepreneur-strategic.json'
import abRural from '@/lib/data/rules/ab-rural-entrepreneur.json'
import abGraduate from '@/lib/data/rules/ab-graduate-entrepreneur.json'
import abForeignGrad from '@/lib/data/rules/ab-foreign-graduate.json'
import abFarm from '@/lib/data/rules/ab-farm.json'
import skEntrepreneur from '@/lib/data/rules/sk-entrepreneur.json'
import skGraduate from '@/lib/data/rules/sk-graduate-entrepreneur.json'
import mbEntrepreneur from '@/lib/data/rules/mb-entrepreneur.json'
import mbFarm from '@/lib/data/rules/mb-farm-investor.json'
import onEntrepreneur from '@/lib/data/rules/on-entrepreneur.json'
import nbEntrepreneurial from '@/lib/data/rules/nb-entrepreneurial.json'
import nbPostGrad from '@/lib/data/rules/nb-post-grad.json'
import nsEntrepreneur from '@/lib/data/rules/ns-entrepreneur.json'
import nsGraduate from '@/lib/data/rules/ns-graduate-entrepreneur.json'
import peiWorkPermit from '@/lib/data/rules/pei-work-permit.json'
import nlEntrepreneur from '@/lib/data/rules/nl-entrepreneur.json'
import nlGraduate from '@/lib/data/rules/nl-graduate-entrepreneur.json'
import nwtBusiness from '@/lib/data/rules/nwt-business.json'
import ykBusiness from '@/lib/data/rules/yk-business-nominee.json'

interface ProgramRuleSet {
  programId: string
  eligibility: any[]
  scoring: any
}

// Registry of all loaded program rules
const PROGRAM_RULES: ProgramRuleSet[] = [
  bcBase as ProgramRuleSet,
  bcRegional as ProgramRuleSet,
  bcStrategic as ProgramRuleSet,
  abRural as ProgramRuleSet,
  abGraduate as ProgramRuleSet,
  abForeignGrad as ProgramRuleSet,
  abFarm as ProgramRuleSet,
  skEntrepreneur as ProgramRuleSet,
  skGraduate as ProgramRuleSet,
  mbEntrepreneur as ProgramRuleSet,
  mbFarm as ProgramRuleSet,
  onEntrepreneur as ProgramRuleSet,
  nbEntrepreneurial as ProgramRuleSet,
  nbPostGrad as ProgramRuleSet,
  nsEntrepreneur as ProgramRuleSet,
  nsGraduate as ProgramRuleSet,
  peiWorkPermit as ProgramRuleSet,
  nlEntrepreneur as ProgramRuleSet,
  nlGraduate as ProgramRuleSet,
  nwtBusiness as ProgramRuleSet,
  ykBusiness as ProgramRuleSet,
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
