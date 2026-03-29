import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult } from '@/lib/types/results'

const mockCreate = vi.fn()

vi.mock('./client', () => ({
  getAnthropicClient: vi.fn(() => ({
    messages: { create: mockCreate },
  })),
}))

import { analyzeProfile } from './analyze'

const mockProfile: UserProfile = {
  age: 35,
  citizenshipCountry: 'India',
  currentResidence: 'India',
  clbEnglish: 8,
  clbFrench: null,
  highestEducation: 'bachelors',
  educationCountry: 'India',
  hasCanadianDegree: false,
  canadianDegreeProvince: null,
  canadianDegreeLength: null,
  hasECA: true,
  businessOwnershipYears: 5,
  ownershipPercentage: 100,
  seniorManagementYears: 5,
  employeesManaged: 10,
  businessSector: 'Technology',
  annualRevenue: 500000,
  personalNetWorth: 800000,
  liquidAssets: 400000,
  investmentCapacity: 300000,
  hasExploratoryVisit: false,
  exploratoryVisitProvince: null,
  exploratoryVisitDays: null,
  hasCommunityReferral: false,
  communityReferralProvince: null,
  hasCanadianWorkExperience: false,
  canadianWorkProvince: null,
  hasFamilyInCanada: false,
  familyProvince: null,
  intendedProvince: ['ON', 'BC'],
  intendedLocation: 'metro',
  intendedJobCreation: 2,
  hasPGWP: false,
  isRecentGraduate: false,
  hasOperatingBusiness: false,
  operatingBusinessProvince: null,
  operatingBusinessMonths: null,
}

const mockResults: ProgramResult[] = [
  {
    programId: 'bc-ei-base',
    meta: {
      status: 'active',
      statusNote: null,
      category: 'Provincial',
      officialUrl: 'https://example.com',
    },
    eligibility: {
      eligible: true,
      score: 140,
      maxScore: 200,
      breakdown: [],
      meetsMinScore: true,
    },
    probability: {
      percent: 72,
      confidence: 'moderate',
      range: [60, 84],
      tier: 'competitive',
      explanation: 'Strong profile',
      caveats: [],
      dataPoints: 5,
      lastDrawDate: '2025-12-01',
      lastDrawMinScore: 120,
    },
    sensitivity: [
      {
        factor: 'CLB Score',
        currentValue: '8',
        improvedValue: '9',
        scoreChange: 10,
        probabilityChange: 5,
        effort: 'medium',
        description: 'Improve English CLB',
      },
    ],
  },
]

const validAnalysisResponse = {
  executiveSummary: 'Strong candidate for BC EI program.',
  programAnalyses: [
    {
      programId: 'bc-ei-base',
      narrative: 'Good fit with score 140/200.',
      strategicFit: 'strong',
      risks: ['Processing delays'],
      timeline: '12-18 months',
    },
  ],
  strategicRoadmap: [
    {
      phase: 'Immediate Actions',
      actions: ['Gather documents', 'Book IELTS'],
    },
  ],
  improvementPriorities: [
    {
      field: 'clbEnglish',
      recommendation: 'Retake IELTS targeting CLB 9',
      effort: 'medium',
      impact: '+10 points on BC EI score',
    },
  ],
  riskFactors: ['Program requirements may change'],
}

describe('analyzeProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns valid AIAnalysis when Claude responds successfully', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(validAnalysisResponse) }],
    })

    const result = await analyzeProfile(mockProfile, mockResults)

    expect(result).not.toBeNull()
    expect(result!.executiveSummary).toBe('Strong candidate for BC EI program.')
    expect(result!.programAnalyses).toHaveLength(1)
    expect(result!.programAnalyses[0].programId).toBe('bc-ei-base')
    expect(result!.strategicRoadmap).toHaveLength(1)
    expect(result!.improvementPriorities).toHaveLength(1)
    expect(result!.riskFactors).toHaveLength(1)
    expect(result!.generatedAt).toBeDefined()
    expect(result!.modelUsed).toBe('claude-sonnet-4-6')
  })

  it('returns null when Claude call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'))

    const result = await analyzeProfile(mockProfile, mockResults)

    expect(result).toBeNull()
  })

  it('returns null when response has no text block', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [],
    })

    const result = await analyzeProfile(mockProfile, mockResults)

    expect(result).toBeNull()
  })
})
