import { getAnthropicClient } from './client'
import type { AIAnalysis } from './types'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult } from '@/lib/types/results'

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 4096

function buildSystemPrompt(): string {
  return `You are a Canadian immigration consultant AI specializing in business and entrepreneur immigration pathways. Your role is to analyze applicant profiles and program eligibility results, then provide strategic guidance.

IMPORTANT: Respond with ONLY valid JSON. No markdown, no code fences, no explanation text outside the JSON. Your entire response must be a single JSON object.

The JSON must conform to this exact structure:

{
  "executiveSummary": "string — 2-4 sentence overview of the applicant's immigration prospects",
  "programAnalyses": [
    {
      "programId": "string — the program ID",
      "narrative": "string — detailed analysis of fit, referencing actual scores and thresholds",
      "strategicFit": "strong | moderate | weak",
      "risks": ["string — specific risk factors for this program"],
      "timeline": "string — estimated timeline to apply and receive decision"
    }
  ],
  "strategicRoadmap": [
    {
      "phase": "string — phase name (e.g. 'Immediate Actions', 'Short-term Preparation')",
      "actions": ["string — specific actionable steps"]
    }
  ],
  "improvementPriorities": [
    {
      "field": "string — the profile field to improve",
      "recommendation": "string — specific, actionable recommendation",
      "effort": "low | medium | high",
      "impact": "string — expected impact on eligibility or scores"
    }
  ],
  "riskFactors": ["string — overall risk factors the applicant should be aware of"]
}

Guidelines:
- Be specific and actionable. Reference actual scores, thresholds, and program requirements.
- For programAnalyses, only include the top eligible programs (up to 5).
- Provide realistic timelines based on current processing times.
- Identify concrete steps the applicant can take to improve their chances.
- NEVER provide legal advice. Always recommend consulting a licensed immigration consultant or lawyer for formal applications.`
}

function buildUserPrompt(profile: UserProfile, results: ProgramResult[]): string {
  const profileSummary = [
    `Age: ${profile.age}`,
    `CLB English: ${profile.clbEnglish ?? 'N/A'}`,
    `CLB French: ${profile.clbFrench ?? 'N/A'}`,
    `Highest Education: ${profile.highestEducation}`,
    `Education Country: ${profile.educationCountry}`,
    `Has Canadian Degree: ${profile.hasCanadianDegree}`,
    `Business Ownership: ${profile.businessOwnershipYears} years`,
    `Senior Management: ${profile.seniorManagementYears} years`,
    `Employees Managed: ${profile.employeesManaged}`,
    `Business Sector: ${profile.businessSector}`,
    `Personal Net Worth: $${profile.personalNetWorth.toLocaleString()}`,
    `Liquid Assets: $${profile.liquidAssets.toLocaleString()}`,
    `Investment Capacity: $${profile.investmentCapacity.toLocaleString()}`,
    `Intended Province(s): ${profile.intendedProvince.join(', ') || 'Flexible'}`,
    `Location Preference: ${profile.intendedLocation}`,
    `Has Exploratory Visit: ${profile.hasExploratoryVisit}`,
    `Has Community Referral: ${profile.hasCommunityReferral}`,
    `Has Canadian Work Experience: ${profile.hasCanadianWorkExperience}`,
    `Has Family in Canada: ${profile.hasFamilyInCanada}`,
  ].join('\n')

  const resultsSummary = results.map((r) => {
    const base = {
      programId: r.programId,
      status: r.meta.status,
      eligible: r.eligibility.eligible,
      probability: r.probability.percent,
      tier: r.probability.tier,
    }
    if (r.eligibility.eligible) {
      return {
        ...base,
        score: r.eligibility.score,
        maxScore: r.eligibility.maxScore,
      }
    }
    return {
      ...base,
      disqualifiers: r.eligibility.disqualifiers.map((d) => d.requirement),
    }
  })

  const topEligible = results
    .filter((r) => r.eligibility.eligible && r.meta.status === 'active')
    .sort((a, b) => b.probability.percent - a.probability.percent)
    .slice(0, 5)
    .map((r) => ({
      programId: r.programId,
      score: r.eligibility.eligible ? r.eligibility.score : null,
      maxScore: r.eligibility.eligible ? r.eligibility.maxScore : null,
      probability: r.probability.percent,
      tier: r.probability.tier,
      confidence: r.probability.confidence,
      lastDrawDate: r.probability.lastDrawDate,
      lastDrawMinScore: r.probability.lastDrawMinScore,
      sensitivity: r.sensitivity.slice(0, 3).map((s) => ({
        factor: s.factor,
        currentValue: s.currentValue,
        improvedValue: s.improvedValue,
        scoreChange: s.scoreChange,
        probabilityChange: s.probabilityChange,
        effort: s.effort,
      })),
    }))

  return `Analyze this immigration profile and provide strategic recommendations.

## Applicant Profile
${profileSummary}

## All Program Results (${results.length} programs evaluated)
${JSON.stringify(resultsSummary, null, 2)}

## Top Eligible Active Programs (detailed)
${JSON.stringify(topEligible, null, 2)}

Provide your analysis as a JSON object following the exact structure specified in your instructions.`
}

export async function analyzeProfile(
  profile: UserProfile,
  results: ProgramResult[]
): Promise<AIAnalysis | null> {
  try {
    const client = getAnthropicClient()
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(profile, results)

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return null
    }

    const analysis: AIAnalysis = {
      ...JSON.parse(textBlock.text),
      generatedAt: new Date().toISOString(),
      modelUsed: MODEL,
    }

    return analysis
  } catch (err) {
    console.error('[analyzeProfile] AI analysis failed:', err instanceof Error ? err.message : err)
    return null
  }
}
