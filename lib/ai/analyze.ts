import { getAnthropicClient } from './client'
import type { AIAnalysis } from './types'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult } from '@/lib/types/results'

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 8000

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
  "ineligibilityInsights": [
    {
      "programId": "string — the program ID",
      "barriers": ["string — specific requirement the applicant fails to meet, with actual numbers"],
      "feasibility": "achievable | difficult | impractical",
      "suggestion": "string — what the applicant would need to change to qualify"
    }
  ],
  "riskFactors": ["string — overall risk factors the applicant should be aware of"]
}

## COMPLETE PROGRAM REQUIREMENTS REFERENCE (use these exact requirements — do NOT guess or generalize)

bc-entrepreneur-base: Net worth ≥$600K; CLB ≥4; 3yr business ownership OR 4yr senior management; Investment ≥$200K
bc-entrepreneur-regional: Net worth ≥$300K; Investment ≥$100K in regional community; CLB ≥4; 3yr ownership OR 4yr management; Community referral required
bc-entrepreneur-strategic: Corporate equity ≥$500K; Create ≥3 jobs per key staff; Established international corporation with senior mgmt
ab-rural-entrepreneur: Net worth ≥$300K; CLB ≥4; 3yr owner-manager OR 4yr senior manager; Investment ≥$100K in rural AB; High school+ via ECA; 51% ownership (new) or 100% (succession); Create ≥1 FT job; Community Support Letter (exploratory visit)
ab-graduate-entrepreneur: CLB ≥7; Canadian degree from ALBERTA institution; Operating business in Alberta ≥6 months; Must be recent graduate
ab-foreign-graduate: CLB ≥5; Post-secondary credential from OUTSIDE Canada (within last 10yr); ≥6 months business ownership/mgmt experience; Investment ≥$100K urban / $50K regional
ab-farm: Net worth ≥$500K; Investment ≥$500K in AB farm; ≥3yr farm management
sk-entrepreneur: CLOSED March 2025
sk-graduate-entrepreneur: CLOSED March 2025
mb-entrepreneur: Net worth ≥$500K; CLB ≥5; 3yr ownership OR 5yr senior mgmt; Investment ≥$250K ($150K outside Winnipeg); Business Research Visit to Manitoba required
mb-farm-investor: Net worth ≥$500K; Investment ≥$300K in MB farm; ≥3yr farm ownership/mgmt
on-entrepreneur: PAUSED since 2019; Net worth ≥$800K ($400K outside GTA); Investment ≥$600K GTA / $200K outside; CLB ≥4; 2yr business exp in last 5yr
nb-entrepreneurial: Age 19-59; Net worth ≥$500K ($300K agriculture); CLB ≥4; High school+; Investment ≥$150K; ≥51% ownership as primary decision-maker; Create ≥1 FT job; NOT NAICS 72
nb-post-grad: CLOSED Feb 2026
ns-entrepreneur: Net worth ≥$600K; CLB ≥5; 3yr ownership OR 5yr senior mgmt; Investment ≥$150K
ns-graduate-entrepreneur: CLOSED (absorbed into NS Entrepreneur Feb 2026)
pei-work-permit: Net worth ≥$600K; CLB ≥4; 3yr ownership OR 5yr senior mgmt; Investment ≥$150K; Community endorsement required
nl-entrepreneur: Age 21-59; Net worth ≥$600K; CLB ≥5; 2yr ownership (25%+ stake) in last 5yr OR 5yr senior mgmt in last 10yr; Investment ≥$200K (33.3% ownership) or $1M pure equity; Exploratory visit required; Create ≥1 FT job
nl-graduate-entrepreneur: CLB ≥7; Degree from NL institution; Operating business in NL
nwt-business: Net worth ≥$500K (Yellowknife) / $250K (regional); Investment ≥$200K (Yellowknife) / $100K (regional); ≥33.3% equity ownership; ≥3yr ownership/mgmt; CLB ≥4; Language test <2yr old
yk-business-nominee: Net worth ≥$500K; Liquid assets ≥$300K; Investment ≥$300K; ≥3yr entrepreneurial + 5yr industry exp; CLB ≥4; NOC TEER 0/1 position; Strategic sector only (IT, manufacturing, forestry, tourism, energy, mining, agriculture, cultural, film); Exploratory visit required

CRITICAL DISTINCTIONS:
- ab-graduate-entrepreneur requires an ALBERTA Canadian degree + operating business in AB + recent graduate status. This is for CANADIAN graduates from Alberta institutions.
- ab-foreign-graduate requires a degree from OUTSIDE Canada + 6mo business/mgmt experience + $50-100K investment. This is for FOREIGN graduates — no Canadian degree needed.
- These are completely different programs with different target applicants. Never confuse them.

Guidelines:
- Be specific and actionable. Reference the EXACT requirements from the reference above — cite actual dollar amounts, CLB levels, and years of experience.
- For programAnalyses, only include the top eligible programs (up to 5).
- For ineligibilityInsights, include up to 8 ineligible programs that are ACTIVE (not closed/redesigning). Focus on near-miss programs. For each barrier, state the requirement AND the applicant's actual value (e.g. "Requires net worth ≥$600,000; you have $300,000"). Rate feasibility: "achievable" if 1-2 small gaps, "difficult" if major gaps but possible, "impractical" if fundamentally mismatched.
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
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[analyzeProfile] AI analysis failed:', msg)
    throw new Error(msg)
  }
}
