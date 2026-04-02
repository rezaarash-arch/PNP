# AI Intelligence Agent — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Claude API-powered research agent, AI profile analysis, and professional report generation to the GenesisLink PNP Assessment Tool.

**Architecture:** Vercel Cron triggers a Claude Sonnet research agent every 2 weeks that auto-updates draw data and queues rule changes. Post-compute, a second Claude call generates strategic narrative analysis cached in Supabase. Results page enriches with AI sections; a dedicated report page renders the full intelligence report as HTML with PDF export.

**Tech Stack:** Anthropic SDK (`@anthropic-ai/sdk`), Next.js API routes, Supabase (existing), `@react-pdf/renderer` (existing), Zod (existing)

---

## Task 1: Install Anthropic SDK + Add Types

**Files:**
- Modify: `package.json`
- Create: `lib/ai/types.ts`

**Step 1: Install the Anthropic SDK**

Run:
```bash
npm install @anthropic-ai/sdk
```

Expected: Package added to dependencies in `package.json`.

**Step 2: Create the AIAnalysis type definition**

Create `lib/ai/types.ts`:

```typescript
export interface ProgramAnalysis {
  programId: string
  narrative: string
  strategicFit: 'strong' | 'moderate' | 'weak'
  risks: string[]
  timeline: string
}

export interface RoadmapPhase {
  phase: string
  actions: string[]
}

export interface ImprovementPriority {
  field: string
  recommendation: string
  effort: 'low' | 'medium' | 'high'
  impact: string
}

export interface AIAnalysis {
  executiveSummary: string
  programAnalyses: ProgramAnalysis[]
  strategicRoadmap: RoadmapPhase[]
  improvementPriorities: ImprovementPriority[]
  riskFactors: string[]
  generatedAt: string
  modelUsed: string
}
```

**Step 3: Commit**

```bash
git add package.json package-lock.json lib/ai/types.ts
git commit -m "feat: install Anthropic SDK and add AIAnalysis types"
```

---

## Task 2: Create the Claude API Client

**Files:**
- Create: `lib/ai/client.ts`
- Create: `lib/ai/client.test.ts`

**Step 1: Write the failing test**

Create `lib/ai/client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  }
})

describe('getAnthropicClient', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('creates a client when ANTHROPIC_API_KEY is set', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key')
    const { getAnthropicClient } = await import('./client')
    const client = getAnthropicClient()
    expect(client).toBeDefined()
    expect(client.messages).toBeDefined()
  })

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    // Force re-import to pick up new env
    vi.resetModules()
    const { getAnthropicClient } = await import('./client')
    expect(() => getAnthropicClient()).toThrow('ANTHROPIC_API_KEY')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ai/client.test.ts`
Expected: FAIL — module `./client` not found.

**Step 3: Write minimal implementation**

Create `lib/ai/client.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

/**
 * Returns a singleton Anthropic client.
 * Server-side only — never import in client components.
 */
export function getAnthropicClient(): Anthropic {
  if (_client) return _client

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is required for AI features'
    )
  }

  _client = new Anthropic({ apiKey })
  return _client
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ai/client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/ai/client.ts lib/ai/client.test.ts
git commit -m "feat: add Anthropic API client singleton"
```

---

## Task 3: Build the AI Profile Analyzer

**Files:**
- Create: `lib/ai/analyze.ts`
- Create: `lib/ai/analyze.test.ts`
- Reference: `lib/ai/types.ts`, `lib/types/results.ts`, `lib/types/assessment.ts`

**Step 1: Write the failing test**

Create `lib/ai/analyze.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ProgramResult } from '@/lib/types/results'
import type { AIAnalysis } from './types'

// Mock the client
vi.mock('./client', () => ({
  getAnthropicClient: vi.fn().mockReturnValue({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              executiveSummary: 'Test summary',
              programAnalyses: [],
              strategicRoadmap: [],
              improvementPriorities: [],
              riskFactors: [],
            }),
          },
        ],
      }),
    },
  }),
}))

describe('analyzeProfile', () => {
  it('returns a valid AIAnalysis from Claude response', async () => {
    const { analyzeProfile } = await import('./analyze')

    const mockProfile = { age: 35, clbEnglish: 8 } as any
    const mockResults: ProgramResult[] = []

    const analysis = await analyzeProfile(mockProfile, mockResults)

    expect(analysis).toBeDefined()
    expect(analysis.executiveSummary).toBe('Test summary')
    expect(analysis.generatedAt).toBeDefined()
    expect(analysis.modelUsed).toContain('claude')
  })

  it('returns null when Claude call fails', async () => {
    const { getAnthropicClient } = await import('./client')
    const mockClient = getAnthropicClient() as any
    mockClient.messages.create.mockRejectedValueOnce(new Error('API down'))

    vi.resetModules()
    vi.mock('./client', () => ({
      getAnthropicClient: vi.fn().mockReturnValue(mockClient),
    }))

    const { analyzeProfile } = await import('./analyze')
    const result = await analyzeProfile({} as any, [])
    expect(result).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ai/analyze.test.ts`
Expected: FAIL — module `./analyze` not found.

**Step 3: Write the implementation**

Create `lib/ai/analyze.ts`:

```typescript
import { getAnthropicClient } from './client'
import type { AIAnalysis } from './types'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult } from '@/lib/types/results'

const MODEL = 'claude-sonnet-4-6'

function buildSystemPrompt(): string {
  return `You are an expert Canadian immigration consultant AI. You analyze candidate profiles against Provincial Nominee Program (PNP) entrepreneur streams.

Your task: Given a candidate profile and their program evaluation results, produce a strategic intelligence report.

Rules:
- Be specific and actionable. Reference actual scores, thresholds, and program names.
- Prioritize eligible+active programs. Mention paused/closed ones only if relevant context.
- Identify the BEST path forward, not just list all options.
- Flag genuine risks (program changes, processing times, competitive scores).
- Suggest realistic timelines based on draw frequency and intake windows.
- Never provide legal advice. Frame everything as analysis and recommendations.

Respond with ONLY valid JSON matching this exact structure (no markdown, no code fences):
{
  "executiveSummary": "2-3 sentence overview of candidate's position",
  "programAnalyses": [
    {
      "programId": "bc-entrepreneur-base",
      "narrative": "Strategic analysis of fit, risks, and opportunity",
      "strategicFit": "strong|moderate|weak",
      "risks": ["specific risk 1", "specific risk 2"],
      "timeline": "Recommended timing and next steps"
    }
  ],
  "strategicRoadmap": [
    {
      "phase": "Month 1-2",
      "actions": ["Specific action 1", "Specific action 2"]
    }
  ],
  "improvementPriorities": [
    {
      "field": "personalNetWorth",
      "recommendation": "What to improve and why",
      "effort": "low|medium|high",
      "impact": "Expected impact on eligibility/score"
    }
  ],
  "riskFactors": ["Macro risk or caveat 1", "Macro risk 2"]
}`
}

function buildUserPrompt(
  profile: UserProfile,
  results: ProgramResult[]
): string {
  const eligible = results.filter((r) => r.eligibility.eligible)
  const topEligible = eligible
    .filter((r) => r.meta.status === 'active')
    .slice(0, 5)

  const profileSummary = {
    age: profile.age,
    clbEnglish: profile.clbEnglish,
    clbFrench: profile.clbFrench,
    education: profile.highestEducation,
    hasCanadianDegree: profile.hasCanadianDegree,
    businessOwnershipYears: profile.businessOwnershipYears,
    seniorManagementYears: profile.seniorManagementYears,
    personalNetWorth: profile.personalNetWorth,
    investmentCapacity: profile.investmentCapacity,
    intendedProvince: profile.intendedProvince,
    intendedLocation: profile.intendedLocation,
    businessSector: profile.businessSector,
  }

  const resultsSummary = results.map((r) => ({
    programId: r.programId,
    status: r.meta.status,
    eligible: r.eligibility.eligible,
    score: r.eligibility.eligible ? r.eligibility.score : null,
    maxScore: r.eligibility.eligible ? r.eligibility.maxScore : null,
    probability: r.probability.percent,
    tier: r.probability.tier,
    confidence: r.probability.confidence,
    lastDrawMinScore: r.probability.lastDrawMinScore,
    disqualifiers: !r.eligibility.eligible
      ? r.eligibility.disqualifiers.map((d) => d.requirement)
      : [],
  }))

  return `## Candidate Profile
${JSON.stringify(profileSummary, null, 2)}

## Program Evaluation Results (${eligible.length} of ${results.length} eligible)
${JSON.stringify(resultsSummary, null, 2)}

## Top Eligible Active Programs
${JSON.stringify(
  topEligible.map((r) => ({
    programId: r.programId,
    score: r.eligibility.eligible ? r.eligibility.score : null,
    probability: r.probability.percent,
    lastDrawDate: r.probability.lastDrawDate,
    lastDrawMinScore: r.probability.lastDrawMinScore,
    sensitivity: r.sensitivity.slice(0, 3),
  })),
  null,
  2
)}

Analyze this candidate and produce the intelligence report. Focus program analyses on the top ${Math.min(topEligible.length, 5)} eligible active programs.`
}

export async function analyzeProfile(
  profile: UserProfile,
  results: ProgramResult[]
): Promise<AIAnalysis | null> {
  try {
    const client = getAnthropicClient()

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(profile, results),
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      console.error('No text block in Claude response')
      return null
    }

    const parsed = JSON.parse(textBlock.text) as Omit<
      AIAnalysis,
      'generatedAt' | 'modelUsed'
    >

    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
      modelUsed: MODEL,
    }
  } catch (err) {
    console.error('AI profile analysis failed:', err)
    return null
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ai/analyze.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/ai/analyze.ts lib/ai/analyze.test.ts
git commit -m "feat: add Claude-powered AI profile analyzer"
```

---

## Task 4: Create the `/api/assessment/analyze` Route

**Files:**
- Create: `app/api/assessment/analyze/route.ts`
- Modify: `middleware.ts:67` — add `/api/assessment/analyze` to rate limit matcher
- Modify: `lib/middleware/rate-limiter.ts` — add analyze rate limit config

**Step 1: Create the API route**

Create `app/api/assessment/analyze/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { UserProfileSchema } from '@/lib/validation/schemas'
import { analyzeProfile } from '@/lib/ai/analyze'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult } from '@/lib/types/results'

interface AnalyzeRequestBody {
  profile: unknown
  results: ProgramResult[]
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    )
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !('profile' in body) ||
    !('results' in body)
  ) {
    return NextResponse.json(
      { error: 'Request body must include "profile" and "results"' },
      { status: 400 }
    )
  }

  const { profile: rawProfile, results } = body as AnalyzeRequestBody

  // Validate profile
  const parseResult = UserProfileSchema.safeParse(rawProfile)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid profile data', details: parseResult.error.flatten() },
      { status: 400 }
    )
  }

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json(
      { error: 'Results array must not be empty' },
      { status: 400 }
    )
  }

  try {
    const profile = parseResult.data as UserProfile
    const analysis = await analyzeProfile(profile, results)

    if (!analysis) {
      return NextResponse.json(
        { error: 'AI analysis unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('Analyze endpoint error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Add rate limiting for the analyze endpoint**

In `lib/middleware/rate-limiter.ts`, find the route config map where the other assessment routes are defined and add:

```typescript
'/api/assessment/analyze': { maxTokens: 3, windowMs: 60_000 },
```

**Step 3: Update middleware matcher**

The existing matcher `/api/assessment/:path*` already covers the new route — no change needed.

**Step 4: Run the full test suite to verify nothing is broken**

Run: `npx vitest run`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add app/api/assessment/analyze/route.ts lib/middleware/rate-limiter.ts
git commit -m "feat: add /api/assessment/analyze endpoint with rate limiting"
```

---

## Task 5: Integrate AI Analysis into the Results Page

**Files:**
- Modify: `app/assessment/results/page.tsx`
- Create: `components/assessment/results/AIAnalysisSection.tsx`
- Create: `components/assessment/results/AIAnalysisSection.module.css`

**Step 1: Create the AIAnalysisSection component**

Create `components/assessment/results/AIAnalysisSection.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { AIAnalysis } from '@/lib/ai/types'
import styles from './AIAnalysisSection.module.css'

interface AIAnalysisSectionProps {
  profile: Record<string, unknown>
  results: unknown[]
}

export default function AIAnalysisSection({
  profile,
  results,
}: AIAnalysisSectionProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchAnalysis() {
      try {
        const res = await fetch('/api/assessment/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, results }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        if (!cancelled) {
          setAnalysis(data.analysis)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    fetchAnalysis()
    return () => { cancelled = true }
  }, [profile, results])

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>
            Preparing your intelligence report...
          </p>
          <p className={styles.loadingSubtext}>
            Our AI agent is analyzing your profile against all programs
          </p>
        </div>
      </section>
    )
  }

  if (error || !analysis) {
    return (
      <section className={styles.section}>
        <div className={styles.errorContainer}>
          <p>AI analysis is temporarily unavailable.</p>
          <button
            className={styles.retryButton}
            onClick={() => {
              setError(false)
              setLoading(true)
              // Re-trigger useEffect by forcing remount
              setAnalysis(null)
            }}
          >
            Retry Analysis
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        AI Intelligence Report
      </h2>

      {/* Executive Summary */}
      <div className={styles.executiveSummary}>
        <h3 className={styles.subsectionTitle}>Executive Summary</h3>
        <p className={styles.summaryText}>{analysis.executiveSummary}</p>
      </div>

      {/* Program Analyses */}
      {analysis.programAnalyses.length > 0 && (
        <div className={styles.programAnalyses}>
          <h3 className={styles.subsectionTitle}>Program Analysis</h3>
          {analysis.programAnalyses.map((pa) => (
            <div key={pa.programId} className={styles.programAnalysis}>
              <div className={styles.programHeader}>
                <span className={styles.programName}>
                  {pa.programId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span className={`${styles.fitBadge} ${styles[`fit_${pa.strategicFit}`]}`}>
                  {pa.strategicFit} fit
                </span>
              </div>
              <p className={styles.narrative}>{pa.narrative}</p>
              {pa.risks.length > 0 && (
                <ul className={styles.riskList}>
                  {pa.risks.map((risk, i) => (
                    <li key={i} className={styles.riskItem}>{risk}</li>
                  ))}
                </ul>
              )}
              <p className={styles.timeline}>{pa.timeline}</p>
            </div>
          ))}
        </div>
      )}

      {/* Strategic Roadmap */}
      {analysis.strategicRoadmap.length > 0 && (
        <div className={styles.roadmap}>
          <h3 className={styles.subsectionTitle}>Strategic Roadmap</h3>
          {analysis.strategicRoadmap.map((phase, i) => (
            <div key={i} className={styles.phase}>
              <h4 className={styles.phaseTitle}>{phase.phase}</h4>
              <ul className={styles.actionList}>
                {phase.actions.map((action, j) => (
                  <li key={j} className={styles.actionItem}>{action}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Improvement Priorities */}
      {analysis.improvementPriorities.length > 0 && (
        <div className={styles.improvements}>
          <h3 className={styles.subsectionTitle}>Improvement Priorities</h3>
          {analysis.improvementPriorities.map((item, i) => (
            <div key={i} className={styles.improvementItem}>
              <div className={styles.improvementHeader}>
                <span className={styles.improvementField}>{item.field}</span>
                <span className={`${styles.effortBadge} ${styles[`effort_${item.effort}`]}`}>
                  {item.effort} effort
                </span>
              </div>
              <p className={styles.improvementRec}>{item.recommendation}</p>
              <p className={styles.improvementImpact}>{item.impact}</p>
            </div>
          ))}
        </div>
      )}

      {/* Risk Factors */}
      {analysis.riskFactors.length > 0 && (
        <div className={styles.risks}>
          <h3 className={styles.subsectionTitle}>Risk Factors</h3>
          <ul className={styles.riskFactorList}>
            {analysis.riskFactors.map((risk, i) => (
              <li key={i} className={styles.riskFactorItem}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      <p className={styles.modelNote}>
        Analysis by {analysis.modelUsed} | Generated{' '}
        {new Date(analysis.generatedAt).toLocaleDateString('en-CA')}
      </p>
    </section>
  )
}
```

**Step 2: Create the CSS module**

Create `components/assessment/results/AIAnalysisSection.module.css` with styles matching the existing dark-theme design system used by `ResultsDashboard.module.css`. Key classes: `.section`, `.sectionTitle`, `.executiveSummary`, `.programAnalysis`, `.fitBadge`, `.fit_strong` (green), `.fit_moderate` (amber), `.fit_weak` (red), `.roadmap`, `.phase`, `.loadingContainer`, `.spinner` (CSS animation), `.errorContainer`, `.retryButton`.

**Step 3: Integrate into the results page**

Modify `app/assessment/results/page.tsx` to:
1. Store the raw profile from sessionStorage alongside results
2. Render `<AIAnalysisSection>` below `<ResultsDashboard>`

The results page currently reads `sessionStorage.getItem('assessmentResults')`. Update the questionnaire's submit handler to also store `sessionStorage.setItem('assessmentProfile', JSON.stringify(profile))` so the results page can pass it to the AI analysis component.

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add app/assessment/results/page.tsx components/assessment/results/AIAnalysisSection.tsx components/assessment/results/AIAnalysisSection.module.css
git commit -m "feat: integrate AI analysis section into results page"
```

---

## Task 6: Build the Biweekly Research Agent

**Files:**
- Create: `lib/ai/research.ts`
- Create: `lib/ai/research.test.ts`
- Create: `app/api/pipeline/research/route.ts`
- Modify: `vercel.json` — add research cron

**Step 1: Write the failing test**

Create `lib/ai/research.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({
  getAnthropicClient: vi.fn().mockReturnValue({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              draws: [
                {
                  draw_date: '2026-03-15',
                  min_score: 118,
                  invitations_issued: 12,
                },
              ],
              ruleChanges: [],
              statusChanges: [],
              notes: 'No significant changes detected',
            }),
          },
        ],
      }),
    },
  }),
}))

describe('researchProgram', () => {
  it('returns structured research results for a program', async () => {
    const { researchProgram } = await import('./research')

    const result = await researchProgram('bc-entrepreneur-base', {
      currentRules: {},
      lastDrawDate: '2026-02-10',
    })

    expect(result).toBeDefined()
    expect(result!.draws).toHaveLength(1)
    expect(result!.draws[0].min_score).toBe(118)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ai/research.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the research module**

Create `lib/ai/research.ts`:

```typescript
import { getAnthropicClient } from './client'

const MODEL = 'claude-sonnet-4-6'

export interface ResearchResult {
  draws: {
    draw_date: string
    min_score: number | null
    invitations_issued: number | null
  }[]
  ruleChanges: {
    field: string
    oldValue: string
    newValue: string
    source: string
  }[]
  statusChanges: {
    newStatus: 'active' | 'paused' | 'closed' | 'redesigning'
    reason: string
    source: string
  }[]
  notes: string
}

interface ResearchContext {
  currentRules: Record<string, unknown>
  lastDrawDate: string | null
}

const SYSTEM_PROMPT = `You are a Canadian immigration research agent. Your job is to report the LATEST factual updates about Provincial Nominee Program (PNP) entrepreneur streams.

You must report ONLY verifiable facts. If you are not confident about a data point, omit it.

For draw data: report only draws that occurred AFTER the last known draw date provided.
For rule changes: report only if a program's eligibility criteria, scoring, or investment thresholds changed.
For status changes: report only if a program opened, closed, paused, or was redesigned.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "draws": [{ "draw_date": "YYYY-MM-DD", "min_score": number|null, "invitations_issued": number|null }],
  "ruleChanges": [{ "field": "string", "oldValue": "string", "newValue": "string", "source": "URL or description" }],
  "statusChanges": [{ "newStatus": "active|paused|closed|redesigning", "reason": "string", "source": "URL" }],
  "notes": "Any other relevant observations"
}`

export async function researchProgram(
  programId: string,
  context: ResearchContext
): Promise<ResearchResult | null> {
  try {
    const client = getAnthropicClient()

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Research the latest updates for Canadian PNP program: ${programId}

Current rules summary: ${JSON.stringify(context.currentRules)}
Last known draw date: ${context.lastDrawDate ?? 'none'}
Current date: ${new Date().toISOString().split('T')[0]}

Report any new draws, rule changes, or status changes since the last known draw date.`,
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return null

    return JSON.parse(textBlock.text) as ResearchResult
  } catch (err) {
    console.error(`Research failed for ${programId}:`, err)
    return null
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ai/research.test.ts`
Expected: PASS

**Step 5: Create the research API route**

Create `app/api/pipeline/research/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { researchProgram } from '@/lib/ai/research'
import { insertDraw } from '@/lib/db/draws'
import { supabaseAdmin } from '@/lib/db/client'
import type { DrawInsert } from '@/lib/db/types'

// All 21 program IDs
const ALL_PROGRAMS = [
  'bc-entrepreneur-base', 'bc-entrepreneur-regional', 'bc-entrepreneur-strategic',
  'ab-rural-entrepreneur', 'ab-graduate-entrepreneur', 'ab-foreign-graduate', 'ab-farm',
  'sk-entrepreneur', 'sk-graduate-entrepreneur',
  'mb-entrepreneur', 'mb-farm-investor',
  'on-entrepreneur',
  'nb-entrepreneurial', 'nb-post-grad',
  'ns-entrepreneur', 'ns-graduate-entrepreneur',
  'pei-work-permit',
  'nl-entrepreneur', 'nl-graduate-entrepreneur',
  'nwt-business',
  'yk-business-nominee',
]

export async function POST(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary: Record<string, { draws: number; ruleChanges: number; status: string }> = {}

  // Research all programs in parallel (batches of 5 to avoid rate limits)
  for (let i = 0; i < ALL_PROGRAMS.length; i += 5) {
    const batch = ALL_PROGRAMS.slice(i, i + 5)
    const results = await Promise.allSettled(
      batch.map(async (programId) => {
        // Get last known draw date for this program
        const { data: lastDraw } = await supabaseAdmin
          .from('draws')
          .select('draw_date')
          .eq('program_id', programId)
          .order('draw_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        const result = await researchProgram(programId, {
          currentRules: {},
          lastDrawDate: lastDraw?.draw_date ?? null,
        })

        if (!result) {
          summary[programId] = { draws: 0, ruleChanges: 0, status: 'failed' }
          return
        }

        // Auto-apply draw data
        let drawsInserted = 0
        for (const draw of result.draws) {
          if (!draw.draw_date) continue
          try {
            const drawInsert: DrawInsert = {
              program_id: programId,
              draw_date: draw.draw_date,
              invitations_issued: draw.invitations_issued,
              min_score: draw.min_score,
              median_score: null,
              max_score: null,
              source_url: null,
              notes: 'Auto-discovered by AI research agent',
            }
            await insertDraw(drawInsert)
            drawsInserted++
          } catch (err) {
            console.error(`Failed to insert draw for ${programId}:`, err)
          }
        }

        // Queue rule/status changes for human review
        const changeCount = result.ruleChanges.length + result.statusChanges.length
        if (changeCount > 0) {
          await supabaseAdmin.from('review_queue').insert({
            program_id: programId,
            change_type: 'rules',
            new_value: {
              ruleChanges: result.ruleChanges,
              statusChanges: result.statusChanges,
            },
            diff_summary: `AI research agent found ${changeCount} change(s) for ${programId}`,
            status: 'pending',
          })
        }

        summary[programId] = {
          draws: drawsInserted,
          ruleChanges: changeCount,
          status: 'success',
        }
      })
    )

    // Log any batch-level errors
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        const pid = batch[idx]
        console.error(`Research failed for ${pid}:`, r.reason)
        summary[pid] = { draws: 0, ruleChanges: 0, status: 'error' }
      }
    })
  }

  // Log pipeline run
  await supabaseAdmin.from('pipeline_runs').insert({
    province_code: 'all',
    status: 'success',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    rules_changed: Object.values(summary).some((s) => s.ruleChanges > 0),
    draws_changed: Object.values(summary).some((s) => s.draws > 0),
    errors: null,
  })

  return NextResponse.json({
    status: 'complete',
    researchedAt: new Date().toISOString(),
    summary,
  })
}
```

**Step 6: Add cron schedule to vercel.json**

Add to the `crons` array in `vercel.json`:

```json
{ "path": "/api/pipeline/research", "schedule": "0 4 1,15 * *" }
```

This runs at 4 AM UTC on the 1st and 15th of each month (biweekly).

**Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

**Step 8: Commit**

```bash
git add lib/ai/research.ts lib/ai/research.test.ts app/api/pipeline/research/route.ts vercel.json
git commit -m "feat: add biweekly AI research agent with tiered trust"
```

---

## Task 7: Build the HTML Intelligence Report Page

**Files:**
- Create: `app/assessment/report/page.tsx`
- Create: `app/assessment/report/page.module.css`

**Step 1: Create the report page**

Create `app/assessment/report/page.tsx` — a `'use client'` component that:
1. Reads `assessmentResults` and `assessmentProfile` from sessionStorage
2. Reads or fetches the AI analysis (checks sessionStorage for cached `aiAnalysis`, otherwise calls `/api/assessment/analyze`)
3. Renders a full-page report layout with all sections from the design:
   - Header with GenesisLink branding, candidate name placeholder, and date
   - Executive Summary
   - Top 3 Recommendations with AI narrative
   - Strategic Roadmap as a phased timeline
   - Improvement Priorities table
   - Risk Factors
   - Full Program Matrix (all 21 programs in a sortable table)
   - "Download PDF" button
   - Disclaimer footer

The page should use CSS modules (`page.module.css`) matching the existing dark-theme design system. Key: the report page is print-friendly — include `@media print` rules that hide the header nav and download button.

**Step 2: Create the CSS module**

Create `app/assessment/report/page.module.css` with professional report styling. Follow the existing design tokens from the codebase (cyan `#0099cc` for accents, dark backgrounds, `#f1f5f9` for text).

**Step 3: Add navigation from results page**

Modify `components/assessment/results/ResultsDashboard.tsx` to add a "View Full Report" button that navigates to `/assessment/report`.

**Step 4: Verify build**

Run: `npx vitest run && npx next build`
Expected: All tests pass, build succeeds.

**Step 5: Commit**

```bash
git add app/assessment/report/page.tsx app/assessment/report/page.module.css components/assessment/results/ResultsDashboard.tsx
git commit -m "feat: add HTML intelligence report page"
```

---

## Task 8: Build the Intelligence Report PDF Generator

**Files:**
- Create: `lib/pdf/intelligence-report.tsx`
- Create: `app/api/assessment/report/pdf/route.ts`

**Step 1: Create the PDF component**

Create `lib/pdf/intelligence-report.tsx` using `@react-pdf/renderer`. Follow the pattern from the existing `lib/pdf/generator.tsx`:

```typescript
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { AIAnalysis } from '@/lib/ai/types'
import type { ProgramResult } from '@/lib/types/results'

export interface IntelligenceReportProps {
  analysis: AIAnalysis
  results: ProgramResult[]
  generatedAt: string
}

// Build a multi-page PDF with:
// Page 1: Header + Executive Summary
// Page 2+: Program Analyses (each program gets a section)
// Next page: Strategic Roadmap
// Next page: Improvement Priorities + Risk Factors
// Last page: Full Program Matrix + Disclaimer
```

Follow the existing `generator.tsx` patterns for styles, layout, and province name lookups.

**Step 2: Create the API route**

Create `app/api/assessment/report/pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { IntelligenceReport } from '@/lib/pdf/intelligence-report'
import type { ProgramResult } from '@/lib/types/results'
import type { AIAnalysis } from '@/lib/ai/types'

interface ReportPdfRequestBody {
  analysis: AIAnalysis
  results: ProgramResult[]
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    !body || typeof body !== 'object' ||
    !('analysis' in body) || !('results' in body)
  ) {
    return NextResponse.json(
      { error: 'Request body must include "analysis" and "results"' },
      { status: 400 }
    )
  }

  const { analysis, results } = body as ReportPdfRequestBody

  try {
    const generatedAt = new Date().toISOString().split('T')[0]
    const element = React.createElement(IntelligenceReport, {
      analysis,
      results,
      generatedAt,
    })
    const buffer = await renderToBuffer(element as any)
    const filename = `genesislink-intelligence-report-${generatedAt}.pdf`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Intelligence report PDF error:', err)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
```

**Step 3: Wire PDF download button in the report page**

In `app/assessment/report/page.tsx`, add the "Download PDF" button that calls `POST /api/assessment/report/pdf` with the analysis + results payload and triggers a browser download.

**Step 4: Add rate limiting**

Add to rate limiter config:
```typescript
'/api/assessment/report/pdf': { maxTokens: 3, windowMs: 60_000 },
```

**Step 5: Verify build**

Run: `npx vitest run && npx next build`
Expected: All pass.

**Step 6: Commit**

```bash
git add lib/pdf/intelligence-report.tsx app/api/assessment/report/pdf/route.ts app/assessment/report/page.tsx lib/middleware/rate-limiter.ts
git commit -m "feat: add intelligence report PDF generation"
```

---

## Task 9: Add ANTHROPIC_API_KEY to Vercel + Deploy

**Files:**
- No code changes — environment configuration only.

**Step 1: Add the API key to Vercel**

Run:
```bash
vercel env add ANTHROPIC_API_KEY
```

Enter the API key when prompted. Select "Production" and "Preview" environments.

**Step 2: Build and deploy**

Run:
```bash
npx vitest run && vercel build --prod && vercel deploy --prebuilt --prod
```

Expected: Deploy succeeds, aliased to `genesislink-eight.vercel.app`.

**Step 3: Test the deployed app**

1. Go to the assessment questionnaire and complete it
2. Verify results page renders instantly (rule engine)
3. Verify AI analysis section loads after a few seconds
4. Click "View Full Report" — verify HTML report page renders
5. Click "Download PDF" — verify PDF downloads correctly

**Step 4: Test the research cron**

Run manually:
```bash
curl -X POST https://genesislink-eight.vercel.app/api/pipeline/research \
  -H "Authorization: Bearer $CRON_SECRET"
```

Verify: returns JSON with research summary for all programs.

**Step 5: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: deploy AI intelligence agent to production"
```

---

## Task Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | SDK install + types | `lib/ai/types.ts` |
| 2 | Claude API client | `lib/ai/client.ts` |
| 3 | AI profile analyzer | `lib/ai/analyze.ts` |
| 4 | Analyze API route | `app/api/assessment/analyze/route.ts` |
| 5 | Results page AI section | `components/assessment/results/AIAnalysisSection.tsx` |
| 6 | Research agent + cron | `lib/ai/research.ts`, `app/api/pipeline/research/route.ts` |
| 7 | HTML report page | `app/assessment/report/page.tsx` |
| 8 | PDF report generator | `lib/pdf/intelligence-report.tsx` |
| 9 | Deploy + verify | Environment config |
