/**
 * Transforms user-friendly questionnaire answers into the UserProfile shape
 * expected by the Zod schema and scoring engine.
 *
 * The form sections collect answers with human-readable keys/values
 * (e.g. hasVisitedCanada: 'yes', educationLevel: 'bachelors'),
 * but the API schema needs machine-typed fields
 * (e.g. hasExploratoryVisit: true, highestEducation: 'bachelors').
 */

import type { UserProfile } from '@/lib/types/assessment'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawAnswers = Record<string, any>

// ── helpers ──────────────────────────────────────────────────────────────

const yesNo = (v: unknown): boolean => v === 'yes' || v === true

/** Map form province codes (PEI, NWT, YK) → schema codes (PE, NT, YT) */
const PROVINCE_MAP: Record<string, string> = {
  PEI: 'PE',
  NWT: 'NT',
  YK: 'YT',
}
const normalizeProvince = (v: unknown): string | null => {
  if (!v || typeof v !== 'string') return null
  return PROVINCE_MAP[v] ?? v
}

/** Map form education values → schema enum values */
const EDUCATION_MAP: Record<string, string> = {
  'high-school': 'high_school',
  '2-year-diploma': '2yr_diploma',
  '3-year-degree': '3yr_degree',
  bachelors: 'bachelors',
  masters: 'masters',
  phd: 'phd',
}

/** Map form location values → schema enum values */
const LOCATION_MAP: Record<string, string> = {
  'major-city': 'metro',
  'smaller-city': 'regional',
  rural: 'rural',
  flexible: 'flexible',
}

/** Map form revenue strings → approximate numeric values (CAD) */
const REVENUE_MAP: Record<string, number | null> = {
  'under-100k': 50_000,
  '100k-500k': 300_000,
  '500k-1m': 750_000,
  '1m-5m': 3_000_000,
  '5m-plus': 7_500_000,
}

/** Convert a CLB self-assessment label into an approximate CLB level */
const SELF_ASSESSED_CLB: Record<string, number> = {
  basic: 3,
  intermediate: 5,
  advanced: 7,
  fluent: 9,
}

// ── main transformer ────────────────────────────────────────────────────

export function transformAnswersToProfile(raw: RawAnswers): UserProfile {
  const hasCanadianDegree = yesNo(raw.hasCanadianDegree)
  const hasVisited = yesNo(raw.hasVisitedCanada)
  const hasCommunity = yesNo(raw.hasCommunityReferral)
  const hasFamily = yesNo(raw.hasFamilyInCanada)
  const isOwner = yesNo(raw.hasOwnedBusiness)
  const operatesInCanada = yesNo(raw.operatesInCanada)

  // Determine CLB levels
  let clbEnglish: number | null = null
  if (raw.clbEnglish != null && raw.languageTest !== 'none') {
    clbEnglish = Number(raw.clbEnglish)
  } else if (raw.selfAssessedEnglish) {
    clbEnglish = SELF_ASSESSED_CLB[raw.selfAssessedEnglish] ?? null
  }

  const clbFrench: number | null =
    raw.clbFrench != null ? Number(raw.clbFrench) : null

  // Determine province for intended province (single → array)
  const intendedProvince: string[] = []
  if (raw.interestedProvince) {
    const normalized = normalizeProvince(raw.interestedProvince)
    if (normalized) intendedProvince.push(normalized)
  }

  return {
    age: Number(raw.age ?? 30),
    citizenshipCountry: (raw.citizenshipCountry ?? 'OTHER').slice(0, 2),
    currentResidence: (raw.residenceCountry ?? raw.currentResidence ?? 'OTHER').slice(0, 2),

    clbEnglish,
    clbFrench,

    highestEducation: EDUCATION_MAP[raw.educationLevel] ?? 'bachelors',
    educationCountry: (raw.educationCountry ?? 'OTHER').slice(0, 2),
    hasCanadianDegree,
    canadianDegreeProvince: hasCanadianDegree
      ? normalizeProvince(raw.canadianDegreeProvince)
      : null,
    canadianDegreeLength: hasCanadianDegree
      ? Number(raw.canadianDegreeYears ?? 2)
      : null,
    hasECA: yesNo(raw.hasECA),

    businessOwnershipYears: isOwner ? Number(raw.yearsOfOwnership ?? 0) : 0,
    ownershipPercentage: isOwner ? Number(raw.ownershipPercentage ?? 0) : 0,
    seniorManagementYears: !isOwner ? Number(raw.seniorManagementYears ?? 0) : 0,
    employeesManaged: Number(raw.numberOfEmployees ?? 0),
    businessSector: raw.businessSector ?? 'other',
    annualRevenue: typeof raw.annualRevenue === 'number'
      ? raw.annualRevenue
      : REVENUE_MAP[raw.annualRevenue] ?? null,

    personalNetWorth: Number(raw.netWorth ?? raw.personalNetWorth ?? 0),
    liquidAssets: Number(raw.liquidAssets ?? 0),
    investmentCapacity: Number(raw.investmentAmount ?? raw.investmentCapacity ?? 0),

    hasExploratoryVisit: hasVisited,
    exploratoryVisitProvince: hasVisited
      ? normalizeProvince(raw.visitedProvince ?? raw.exploratoryVisitProvince)
      : null,
    exploratoryVisitDays: hasVisited
      ? Number(raw.visitDurationDays ?? raw.exploratoryVisitDays ?? 0)
      : null,
    hasCommunityReferral: hasCommunity,
    communityReferralProvince: hasCommunity
      ? normalizeProvince(raw.referralProvince ?? raw.communityReferralProvince)
      : null,
    hasCanadianWorkExperience: yesNo(raw.hasCanadianWorkExperience),
    canadianWorkProvince: normalizeProvince(raw.canadianWorkProvince),
    hasFamilyInCanada: hasFamily,
    familyProvince: hasFamily
      ? normalizeProvince(raw.familyProvince)
      : null,

    intendedProvince: intendedProvince as UserProfile['intendedProvince'],
    intendedLocation: (LOCATION_MAP[raw.locationPreference] ?? 'flexible') as UserProfile['intendedLocation'],
    intendedJobCreation: Number(raw.plannedEmployees ?? raw.intendedJobCreation ?? 0),
    hasPGWP: yesNo(raw.hasPGWP),

    isRecentGraduate: yesNo(raw.isRecentGraduate),
    hasOperatingBusiness: operatesInCanada,
    operatingBusinessProvince: operatesInCanada
      ? normalizeProvince(raw.operatingBusinessProvince)
      : null,
    operatingBusinessMonths: operatesInCanada
      ? Number(raw.operatingBusinessMonths ?? 0)
      : null,
  } as UserProfile
}
