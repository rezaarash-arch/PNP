# AI Intelligence Agent — Design Document

**Date:** 2026-03-29
**Status:** Approved
**Author:** Claude + BT

## Overview

Transform the GenesisLink PNP Assessment Tool from a static rule-based engine into an AI-augmented intelligence platform. Three new capabilities:

1. **Biweekly Research Agent** — Vercel Cron + Claude API automatically researches all 21 programs for new draw data, policy changes, and status updates
2. **AI Profile Analysis** — Post-compute enrichment where Claude provides strategic narrative, cross-program comparisons, risk factors, and timeline recommendations
3. **Professional Report** — Rich HTML report page + downloadable branded PDF, both driven by the same AI analysis JSON

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Research agent runtime | Vercel Cron + Claude API | Fits existing stack, no new infrastructure |
| Profile analysis timing | Post-compute async | Instant results from rule engine, AI enriches after |
| Report format | HTML + PDF | Interactive web view + professional downloadable deliverable |
| Auto-update trust | Tiered — draws auto, rules need human approval | Draw data is low-risk; rule changes can disqualify candidates |

## Section 1: Biweekly Research Agent

### Architecture

```
Vercel Cron (every 14 days)
    |
POST /api/pipeline/research  (protected by CRON_SECRET)
    |
For each of 21 programs (parallelized):
    -> Claude Sonnet API call with structured prompt
    -> Includes: current rules JSON, last known draws, strict output schema
    -> Claude returns: DrawUpdate[], RuleChange[], StatusChange[]
    |
Tiered processing:
    -> Draw data -> auto-upsert into Supabase `draws` table
    -> Rule/status changes -> insert into `review_queue` for human approval
    |
Log run to `pipeline_runs` table (audit trail)
Optional: email alert if high-impact changes detected
```

### API Call Design

- Each province gets its own Claude call (isolated failures, parallelizable)
- System prompt includes current rules + last draw data (Claude only reports deltas)
- Strict JSON output schema enforced via tool_use
- Uses Claude Sonnet (fast, cheap, accurate for factual lookups)
- ~42K tokens per run, ~$0.13 per biweekly run (~$3.38/year)

### Failure Handling

- Individual province failure doesn't block others
- Failed provinces retry next cycle
- Fallback draw data (static) always available as backstop

## Section 2: AI Profile Analysis

### Flow

```
User submits questionnaire
    |
POST /api/assessment/compute  (existing, instant ~200ms)
    -> Rule engine evaluates all 21 programs
    -> Returns results immediately to frontend
    |
Frontend renders results page (instant)
    |
Async: POST /api/assessment/analyze
    -> Sends { profile, results, drawData } to Claude Sonnet
    -> Claude returns structured AIAnalysis JSON
    -> Frontend receives and enriches results page
```

### What Claude Analyzes (Beyond Rules)

- **Strategic narrative** — Why each program is a good/bad fit, with context
- **Cross-program comparison** — Trade-offs between top eligible programs
- **Risk factors** — Program-specific warnings, processing time concerns
- **Timeline recommendations** — Based on draw frequency and intake windows
- **Improvement priorities** — Which improvements are realistic and in what order

### API Call Design

- Single Claude Sonnet call with full context (profile + top results + draws)
- ~4K input tokens, ~2K output tokens (~$0.02 per user)
- Structured output with sections: executive_summary, program_analyses[], strategic_recommendations, risk_factors, timeline
- If Claude fails, results page works perfectly without AI sections

## Section 3: Professional Report

### HTML Report (`/assessment/report`)

Sections in order:
1. Header — "GenesisLink Intelligence Report" + candidate name + date
2. Executive Summary — AI-generated overview paragraph
3. Top 3 Recommendations — Cards with AI narrative for each
4. Strategic Roadmap — Phased timeline (Month 1-2, Month 3-4, etc.)
5. Improvement Opportunities — Prioritized with effort/impact ratings
6. Risk Factors & Caveats — Program-specific warnings
7. Full Program Matrix — All 21 programs in sortable table
8. Footer — Download PDF button + disclaimer

### PDF Report (`POST /api/assessment/report/pdf`)

- Generated via existing @react-pdf/renderer
- Mirrors HTML sections, formatted for A4 print
- Branded header with GenesisLink identity
- Same AI analysis JSON drives both HTML and PDF

### Single Source of Truth

The AIAnalysis JSON is consumed by both renderers. Update the analysis schema once, both outputs stay in sync.

## Section 4: Data Model & API Surface

### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/assessment/analyze` | POST | Claude AI profile analysis |
| `/api/assessment/report/pdf` | POST | PDF from AI analysis JSON |
| `/api/pipeline/research` | POST | Biweekly research cron |

### Schema Changes

```sql
-- assessments table: add column
ALTER TABLE assessments ADD COLUMN ai_analysis JSONB;
```

No new tables — existing `review_queue`, `pipeline_runs`, `draws` cover everything.

### AIAnalysis TypeScript Interface

```typescript
interface AIAnalysis {
  executiveSummary: string
  programAnalyses: {
    programId: string
    narrative: string
    strategicFit: 'strong' | 'moderate' | 'weak'
    risks: string[]
    timeline: string
  }[]
  strategicRoadmap: {
    phase: string
    actions: string[]
  }[]
  improvementPriorities: {
    field: string
    recommendation: string
    effort: 'low' | 'medium' | 'high'
    impact: string
  }[]
  riskFactors: string[]
  generatedAt: string
  modelUsed: string
}
```

### Caching

AI analysis stored in `assessments.ai_analysis`. Session resume loads cached analysis instantly. "Refresh Analysis" button triggers new Claude call if answers change.

## Section 5: Cost, Security & Error Handling

### Cost

| Item | Cost |
|------|------|
| AI analysis per user | ~$0.02 |
| Biweekly research run | ~$0.13 |
| Annual research total | ~$3.38 |
| PDF generation | Free (server-side) |

### Security

- `ANTHROPIC_API_KEY` in Vercel env vars (server-only, never client-exposed)
- User data sent to Claude is ephemeral (not used for training)
- AI analysis cached with same Supabase RLS policies as assessment data
- Research cron protected by existing `CRON_SECRET`
- Rate limit on `/api/assessment/analyze`: 3 req/min per IP

### Error Handling — Graceful Degradation

- Claude API down -> results page works, AI sections show "unavailable" + retry
- Research cron fails -> fallback draw data serves probability estimates
- Individual province research fails -> others still update, retry next cycle
- PDF generation fails -> HTML report fully functional
- Supabase down -> cookie-only session + static fallback (existing pattern)

**No single point of failure.** The rule engine is the backbone. Claude enriches but never blocks.

## New Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...    # Claude API access (server-only)
```
