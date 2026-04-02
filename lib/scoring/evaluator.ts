import { evaluateEligibility, computeScore } from './engine'
import type { EligibilityRule, ScoringGrid } from './engine'
import { estimateProbability } from './probability'
import { computeSensitivity } from './sensitivity'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult, ProgramMeta, EligibilityResult } from '@/lib/types/results'

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
import fedStartUpVisa from '@/lib/data/rules/fed-start-up-visa.json'
import fedSelfEmployed from '@/lib/data/rules/fed-self-employed.json'

export interface ProgramRuleSet {
  programId: string
  eligibility: EligibilityRule[]
  scoring: ScoringGrid | null
}

// ---------------------------------------------------------------------------
// Program metadata registry — status, category, official URLs
// ---------------------------------------------------------------------------
const PROGRAM_META: Record<string, ProgramMeta> = {
  'bc-entrepreneur-base': {
    status: 'active',
    statusNote: null,
    category: 'main',
    officialUrl: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration',
  },
  'bc-entrepreneur-regional': {
    status: 'active',
    statusNote: null,
    category: 'regional',
    officialUrl: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration',
  },
  'bc-entrepreneur-strategic': {
    status: 'active',
    statusNote: 'For established international corporations; no points-based scoring',
    category: 'strategic',
    officialUrl: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration',
  },
  'ab-rural-entrepreneur': {
    status: 'active',
    statusNote: 'Target community must have population under 100,000, outside Calgary/Edmonton CMAs',
    category: 'regional',
    officialUrl: 'https://www.alberta.ca/aaip-rural-entrepreneur-stream',
  },
  'ab-graduate-entrepreneur': {
    status: 'active',
    statusNote: 'For graduates of Canadian (Alberta) post-secondary institutions',
    category: 'graduate',
    officialUrl: 'https://www.alberta.ca/aaip-graduate-entrepreneur-stream',
  },
  'ab-foreign-graduate': {
    status: 'active',
    statusNote: 'For graduates of foreign (non-Canadian) institutions; no PGWP or Canadian work experience required',
    category: 'graduate',
    officialUrl: 'https://www.alberta.ca/aaip-foreign-graduate-entrepreneur-stream',
  },
  'ab-farm': {
    status: 'active',
    statusNote: null,
    category: 'farm',
    officialUrl: 'https://www.alberta.ca/aaip-farm-stream',
  },
  'sk-entrepreneur': {
    status: 'closed',
    statusNote: 'Permanently closed as of March 27, 2025; all Saskatchewan entrepreneur and farm pathways discontinued',
    category: 'main',
    officialUrl: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/live-in-saskatchewan/by-immigrating/saskatchewan-immigrant-nominee-program/browse-sinp-programs/entrepreneur',
  },
  'sk-graduate-entrepreneur': {
    status: 'closed',
    statusNote: 'Permanently closed as of March 27, 2025; all Saskatchewan entrepreneur and farm pathways discontinued',
    category: 'graduate',
    officialUrl: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/live-in-saskatchewan/by-immigrating/saskatchewan-immigrant-nominee-program/browse-sinp-programs/entrepreneur',
  },
  'mb-entrepreneur': {
    status: 'active',
    statusNote: 'Interim paper-based process while MPNP Online upgraded; BPA with 6/20-month progress reports',
    category: 'main',
    officialUrl: 'https://immigratemanitoba.com/immigrate/bis/entrepreneur/apply/',
  },
  'mb-farm-investor': {
    status: 'active',
    statusNote: '$75K refundable deposit required; must demonstrate transferable agricultural knowledge to MB farming',
    category: 'farm',
    officialUrl: 'https://immigratemanitoba.com/immigrate/bis/fip/',
  },
  'on-entrepreneur': {
    status: 'paused',
    statusNote: 'Legacy Entrepreneur category being revoked May 30, 2026; redesigned stream expected Phase 2 (late 2026)',
    category: 'main',
    officialUrl: 'https://www.ontario.ca/page/ontario-immigrant-nominee-program-streams',
  },
  'nb-entrepreneurial': {
    status: 'active',
    statusNote: 'Overhauled Feb 3, 2026 as NB Business Immigration Stream; NAICS 72 (Accommodation & Food Services) excluded',
    category: 'main',
    officialUrl: 'https://www2.gnb.ca/content/gnb/en/corporate/promo/immigration/immigrating-to-nb/nb-immigration-program-streams/nb-business-immigration-stream.html',
  },
  'nb-post-grad': {
    status: 'closed',
    statusNote: 'Legacy stream replaced by NB Business Immigration Stream as of Feb 3, 2026',
    category: 'graduate',
    officialUrl: 'https://www2.gnb.ca/content/gnb/en/corporate/promo/immigration/immigrating-to-nb/nb-immigration-program-streams/nb-business-immigration-stream.html',
  },
  'ns-entrepreneur': {
    status: 'active',
    statusNote: 'Consolidated Feb 18, 2026: absorbs legacy experienced owner and grad entrepreneur under single stream; temporary-to-permanent model',
    category: 'main',
    officialUrl: 'https://liveinnovascotia.com/nova-scotia-nominee-program',
  },
  'ns-graduate-entrepreneur': {
    status: 'closed',
    statusNote: 'Absorbed into unified NS Entrepreneur Stream as of Feb 18, 2026 consolidation',
    category: 'graduate',
    officialUrl: 'https://liveinnovascotia.com/nova-scotia-nominee-program',
  },
  'pei-work-permit': {
    status: 'active',
    statusNote: 'As of Nov 1, 2025: application submission window reduced from 60 to 30 days post-ITA',
    category: 'main',
    officialUrl: 'https://www.princeedwardisland.ca/en/information/office-of-immigration/work-permit-stream',
  },
  'nl-entrepreneur': {
    status: 'active',
    statusNote: 'Temporary-to-permanent model; requires at least 1 year continuous active business management before nomination',
    category: 'main',
    officialUrl: 'https://www.gov.nl.ca/immigration/immigrating-to-newfoundland-and-labrador/provincial-nominee-program/overview/',
  },
  'nl-graduate-entrepreneur': {
    status: 'active',
    statusNote: 'Temporary-to-permanent model; requires at least 1 year continuous active business management before nomination',
    category: 'graduate',
    officialUrl: 'https://www.gov.nl.ca/immigration/immigrating-to-newfoundland-and-labrador/provincial-nominee-program/overview/',
  },
  'nwt-business': {
    status: 'active',
    statusNote: 'New EOI system in 2026; geographic tiering: Yellowknife ($500K NW/$200K invest) vs regional ($250K NW/$100K invest)',
    category: 'main',
    officialUrl: 'https://www.immigratenwt.ca/business-stream',
  },
  'yk-business-nominee': {
    status: 'active',
    statusNote: '282 nomination slots for 2026; Strategic Sector List restricts eligible industries; no retail/restaurants/real estate',
    category: 'main',
    officialUrl: 'https://yukon.ca/en/immigration/yukon-business-nominee-program/find-eligibility-requirements-apply-run-your-business-yukon-foreign-entrepreneurs',
  },
  'fed-start-up-visa': {
    status: 'active',
    statusNote: 'Federal program; requires letter of support from a designated organization (VC fund, angel investor group, or business incubator)',
    category: 'federal',
    officialUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/start-visa.html',
  },
  'fed-self-employed': {
    status: 'active',
    statusNote: 'Federal program for self-employed persons with relevant experience in cultural activities, athletics, or farm management',
    category: 'federal',
    officialUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/self-employed.html',
  },
}

const DEFAULT_META: ProgramMeta = {
  status: 'active',
  statusNote: null,
  category: 'main',
  officialUrl: '',
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
  fedStartUpVisa as ProgramRuleSet,
  fedSelfEmployed as ProgramRuleSet,
]

// ---------------------------------------------------------------------------
// Draw data shape expected by this module
// ---------------------------------------------------------------------------
export interface DrawDataMap {
  [programId: string]: { draw_date: string; min_score: number; invitations_issued: number }[]
}

// ---------------------------------------------------------------------------
// Main evaluation function
// ---------------------------------------------------------------------------
export function evaluateAllPrograms(
  profile: UserProfile,
  drawData: DrawDataMap
): ProgramResult[] {
  const results: ProgramResult[] = []

  for (const rules of PROGRAM_RULES) {
    const meta = PROGRAM_META[rules.programId] ?? DEFAULT_META
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
      meta,
      eligibility,
      probability,
      sensitivity,
    })
  }

  // Three-tier sort:
  //   Tier 0: eligible + active program → sort by probability descending
  //   Tier 1: eligible + paused/closed/redesigning → sort by probability descending
  //   Tier 2: ineligible → sort by probability descending
  results.sort((a, b) => {
    const tierA = getTier(a)
    const tierB = getTier(b)
    if (tierA !== tierB) return tierA - tierB
    return b.probability.percent - a.probability.percent
  })

  return results
}

function getTier(result: ProgramResult): number {
  if (!result.eligibility.eligible) return 2
  if (result.meta.status === 'active') return 0
  return 1
}
