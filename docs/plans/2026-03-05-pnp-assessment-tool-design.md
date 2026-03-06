# PNP Entrepreneur Programs Assessment Tool — Engineering Design Document

**Date**: 2026-03-05
**Status**: Draft — Pending Approval
**Author**: Engineering Design Session
**Repo Integration**: Inline within existing GenesisLink Next.js codebase

---

## Table of Contents

1. [Program Coverage Model](#1-program-coverage-model)
2. [Data Sourcing & Update Pipeline](#2-data-sourcing--update-pipeline)
3. [Scoring Engine](#3-scoring-engine)
4. [Probability Model](#4-probability-model)
5. [UX/UI Specification](#5-uxui-specification)
6. [Implementation Plan](#6-implementation-plan)
7. [Compliance & Disclaimers](#7-compliance--disclaimers)

---

## 1. Program Coverage Model

### 1.1 Canonical Program Registry

Every PNP entrepreneur stream is represented as a `ProgramDefinition` record. The system covers **18 streams across 11 provinces/territories**.

```typescript
// types/program.ts

type ProgramStatus = "active" | "paused" | "closed" | "redesigning";
type EOIType = "points_ranked" | "first_come" | "intake_period" | "hybrid" | "none";

interface ProgramDefinition {
  id: string;                          // e.g. "bc-entrepreneur-base"
  provinceCode: string;                // ISO 3166-2:CA code (e.g. "BC", "AB")
  provinceName: string;
  streamName: string;                  // e.g. "BC PNP Entrepreneur Immigration — Base Category"
  streamSlug: string;                  // URL-safe identifier
  category: "main" | "regional" | "graduate" | "farm" | "strategic";
  status: ProgramStatus;
  statusNote: string | null;           // e.g. "Redesigned stream expected Q3 2026"
  statusChangedAt: string;             // ISO date
  eoiType: EOIType;
  hasPointsGrid: boolean;
  officialUrl: string;
  drawPageUrl: string | null;

  // Eligibility thresholds (null = not specified by program)
  requirements: {
    minNetWorth: number | null;        // CAD
    minInvestment: number | null;      // CAD
    minInvestmentRegional: number | null;
    minCLB: number | null;
    minAge: number | null;
    maxAge: number | null;
    minBusinessExperienceYears: number | null;
    businessExperienceType: ("owner" | "senior_manager" | "either")[];
    minOwnershipPercent: number | null;
    minEducation: string | null;       // e.g. "high_school", "2yr_diploma", "3yr_degree"
    minJobCreation: number | null;
    requiresExploratoryVisit: boolean;
    requiresCommunityReferral: boolean;
    requiresLocalDegree: boolean;
    requiresPGWP: boolean;
    requiresBusinessPlan: boolean;
    requiresInterview: boolean;
    requiresNetWorthVerification: boolean;
    restrictedIndustries: string[];
    additionalConstraints: Record<string, string>; // freeform key-value for edge cases
  };

  // Points grid (null if program doesn't use points)
  pointsGrid: PointsGrid | null;

  // Metadata
  lastVerifiedAt: string;
  sourceVersion: number;               // increments on each rule change
  notes: string[];
}

interface PointsGrid {
  maxScore: number;
  minScoreRequired: number | null;
  categories: PointsCategory[];
}

interface PointsCategory {
  name: string;                        // e.g. "Business Experience"
  maxPoints: number;
  minRequired: number | null;          // category-level threshold (e.g. ON business concept 50%)
  factors: PointsFactor[];
}

interface PointsFactor {
  name: string;                        // e.g. "Years of ownership"
  maxPoints: number;
  scoringRules: ScoringRule[];
}

interface ScoringRule {
  condition: string;                   // JSONLogic expression (see §3)
  points: number;
  label: string;                       // Human-readable: "5+ years ownership → 20 pts"
}
```

### 1.2 Complete Program List

| ID | Province | Stream | Status | EOI | Points |
|----|----------|--------|--------|-----|--------|
| `bc-entrepreneur-base` | BC | Base Category | active | points_ranked | Yes (uncapped) |
| `bc-entrepreneur-regional` | BC | Regional Pilot | active | points_ranked | Yes |
| `bc-entrepreneur-strategic` | BC | Strategic Projects | active | none | No |
| `ab-rural-entrepreneur` | AB | Rural Entrepreneur | active | points_ranked | Yes (175) |
| `ab-graduate-entrepreneur` | AB | Graduate Entrepreneur | active | points_ranked | No |
| `ab-foreign-graduate` | AB | Foreign Graduate Entrepreneur | active | points_ranked | No |
| `ab-farm` | AB | Farm Stream | active | points_ranked | No |
| `sk-entrepreneur` | SK | Entrepreneur | closed | — | — |
| `sk-graduate-entrepreneur` | SK | Intl Graduate Entrepreneur | closed | — | — |
| `mb-entrepreneur` | MB | Entrepreneur Pathway | active | points_ranked | Yes (150) |
| `mb-farm-investor` | MB | Farm Investor | active | points_ranked | No |
| `on-entrepreneur` | ON | Entrepreneur | redesigning | — | — |
| `nb-entrepreneurial` | NB | Entrepreneurial Stream | active | points_ranked | Yes (65 min) |
| `nb-post-grad` | NB | Post-Graduate Entrepreneurial | active | points_ranked | Yes (65 min) |
| `ns-entrepreneur` | NS | Entrepreneur | active | points_ranked | Yes (100, 67 min) |
| `ns-graduate-entrepreneur` | NS | Intl Grad Entrepreneur | active | points_ranked | Yes |
| `pei-work-permit` | PEI | Work Permit Entrepreneur | active | points_ranked | Yes |
| `nl-entrepreneur` | NL | International Entrepreneur | active | points_ranked | Yes (120, 72 min) |
| `nl-graduate-entrepreneur` | NL | Intl Graduate Entrepreneur | active | points_ranked | Yes |
| `nwt-business` | NWT | Business Stream | active | first_come | No |
| `yk-business-nominee` | YK | Business Nominee Program | active | intake_period | No |

### 1.3 Status Flag Behavior

- **active**: Included in scoring, shown in results
- **paused**: Shown in results with "Currently Paused" badge; no probability calculated; gap analysis still shown ("If this program reopens, your score would be X")
- **closed**: Hidden from main results; available under "View Closed Programs" toggle
- **redesigning**: Shown with "Being Redesigned" badge + status note; scored against last known rules with caveat

---

## 2. Data Sourcing & Update Pipeline

### 2.1 Authoritative Sources

Each program has two data categories: **rules** (eligibility/scoring) and **draws** (invitation history).

| Province | Rules Source | Draw/Invitation Source |
|----------|-------------|----------------------|
| BC | welcomebc.ca/immigrate-to-b-c/ | welcomebc.ca (draw results page) |
| AB | alberta.ca/aaip-* | alberta.ca AAIP news/updates |
| SK | saskatchewan.ca/sinp | N/A (closed) |
| MB | immigratemanitoba.com/immigrate/bis/ | immigratemanitoba.com (LAA results) |
| ON | ontario.ca/oinp | N/A (redesigning) |
| NB | gnb.ca immigration portal | gnb.ca EOI draw results |
| NS | liveinnovascotia.com | liveinnovascotia.com draw results |
| PEI | princeedwardisland.ca/immigration | princeedwardisland.ca PNP stats |
| NL | gov.nl.ca/immigration | gov.nl.ca PNP draw results |
| NWT | immigratenwt.ca | immigratenwt.ca business stream stats |
| YK | yukon.ca/immigration | yukon.ca YBNP intake results |

**Supplementary sources** (for cross-validation only, never primary):
- IRCC annual PNP allocation tables (federal level)
- Canada Gazette regulatory updates

### 2.2 ETL Pipeline Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Vercel Cron │────▸│  Scraper Fns │────▸│  Normalizer  │────▸│  Change      │
│  (daily 2AM) │     │  (per source)│     │  + Validator │     │  Detector    │
└─────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                              ┌───────────────────────┼──────────┐
                                              ▼                       ▼          ▼
                                         ┌─────────┐         ┌────────────┐ ┌────────┐
                                         │ Auto-    │         │ Admin      │ │ Alert  │
                                         │ Apply    │         │ Review     │ │ (email │
                                         │ (draws)  │         │ Queue      │ │ +slack)│
                                         └─────────┘         └────────────┘ └────────┘
```

**Scraper functions** (one per province, deployed as Vercel serverless functions):

```typescript
// app/api/pipeline/scrape/[province]/route.ts

interface ScrapeResult {
  province: string;
  scrapedAt: string;
  rulesHash: string;           // SHA-256 of normalized rules content
  drawsHash: string;           // SHA-256 of normalized draws content
  rules: RawProgramRules[];
  draws: RawDrawRecord[];
  errors: ScrapeError[];
}
```

**Change detection logic**:
1. Compute content hash of scraped data
2. Compare to last stored hash in `pipeline_runs` table
3. If hashes match → log "no change", done
4. If draws changed → auto-apply (draws are factual, low risk)
5. If rules changed → create `pending_review` entry in admin queue + send alert
6. If scrape errors → log error, send alert, do NOT update data

### 2.3 Database Schema

```sql
-- Supabase/PostgreSQL

-- Program definitions (the canonical registry)
CREATE TABLE programs (
  id TEXT PRIMARY KEY,                    -- e.g. "bc-entrepreneur-base"
  province_code TEXT NOT NULL,
  province_name TEXT NOT NULL,
  stream_name TEXT NOT NULL,
  stream_slug TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('main','regional','graduate','farm','strategic')),
  status TEXT NOT NULL CHECK (status IN ('active','paused','closed','redesigning')),
  status_note TEXT,
  status_changed_at TIMESTAMPTZ,
  eoi_type TEXT NOT NULL,
  has_points_grid BOOLEAN DEFAULT FALSE,
  official_url TEXT NOT NULL,
  draw_page_url TEXT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Program rules (versioned JSON)
CREATE TABLE program_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL REFERENCES programs(id),
  version INTEGER NOT NULL,
  rules JSONB NOT NULL,                   -- Full ProgramDefinition.requirements + pointsGrid
  effective_from TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ,            -- NULL = current version
  change_summary TEXT,
  reviewed_by TEXT,                        -- admin who approved
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, version)
);

-- Draw/invitation history
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL REFERENCES programs(id),
  draw_date DATE NOT NULL,
  invitations_issued INTEGER,
  min_score INTEGER,                      -- NULL if not score-based
  median_score INTEGER,
  max_score INTEGER,
  notes TEXT,
  source_url TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, draw_date)
);

-- Pipeline run log
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_code TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running','success','partial','failed')),
  rules_hash TEXT,
  draws_hash TEXT,
  rules_changed BOOLEAN DEFAULT FALSE,
  draws_changed BOOLEAN DEFAULT FALSE,
  errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin review queue
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL REFERENCES programs(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('rules','status','new_program')),
  old_value JSONB,
  new_value JSONB,
  diff_summary TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','auto_applied')) DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessment sessions (anonymous)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,      -- encrypted, stored in cookie
  email TEXT,                              -- optional, for save/resume
  answers JSONB NOT NULL,                  -- encrypted at rest
  results JSONB,                           -- computed scores + probabilities
  rules_snapshot_ids JSONB,                -- array of program_rules.id used for this computation
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,         -- 30 days from creation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_draws_program_date ON draws(program_id, draw_date DESC);
CREATE INDEX idx_program_rules_current ON program_rules(program_id) WHERE effective_until IS NULL;
CREATE INDEX idx_assessments_session ON assessments(session_token);
CREATE INDEX idx_assessments_email ON assessments(email) WHERE email IS NOT NULL;
CREATE INDEX idx_review_queue_pending ON review_queue(status) WHERE status = 'pending';
```

### 2.4 Admin Review Queue

Protected route at `/admin/pipeline` (behind basic auth or Supabase admin role):

- Shows pending rule changes with diff view (old JSON vs new JSON)
- Admin can: approve (applies change), reject (keeps old), or edit-and-approve
- Draw data is auto-applied but visible in a log tab for audit
- Alert destinations: email to configured admin address + optional Slack webhook

---

## 3. Scoring Engine

### 3.1 Architecture

The scoring engine is a **pure function** that takes user answers + program rules and outputs a deterministic result. No side effects, fully unit-testable.

```typescript
// lib/scoring/engine.ts

interface UserProfile {
  // Personal
  age: number;
  citizenshipCountry: string;
  currentResidence: string;

  // Language
  clbEnglish: number | null;       // CLB level (1-12), null if no test
  clbFrench: number | null;

  // Education
  highestEducation: EducationLevel;
  educationCountry: string;
  hasCanadianDegree: boolean;
  canadianDegreeProvince: string | null;
  canadianDegreeLength: number | null;  // years
  hasECA: boolean;

  // Business Experience
  businessOwnershipYears: number;
  ownershipPercentage: number;
  seniorManagementYears: number;
  employeesManaged: number;
  businessSector: string;              // NOC/TEER or NAICS code
  annualRevenue: number | null;

  // Financial
  personalNetWorth: number;            // CAD
  liquidAssets: number;                // CAD
  investmentCapacity: number;          // CAD, how much willing to invest

  // Canada Connection
  hasExploratoryVisit: boolean;
  exploratoryVisitProvince: string | null;
  exploratoryVisitDays: number | null;
  hasCommunityReferral: boolean;
  communityReferralProvince: string | null;
  hasCanadianWorkExperience: boolean;
  canadianWorkProvince: string | null;
  hasFamilyInCanada: boolean;
  familyProvince: string | null;

  // Business Plan
  intendedProvince: string[];          // provinces of interest (can be multiple)
  intendedLocation: "metro" | "regional" | "rural" | "flexible";
  intendedJobCreation: number;
  hasPGWP: boolean;

  // Graduate-specific
  isRecentGraduate: boolean;
  hasOperatingBusiness: boolean;
  operatingBusinessProvince: string | null;
  operatingBusinessMonths: number | null;
}

type EligibilityResult = {
  eligible: true;
  score: number | null;              // null if program doesn't use points
  maxScore: number | null;
  breakdown: ScoreBreakdown[];
  meetsMinScore: boolean;
} | {
  eligible: false;
  disqualifiers: Disqualifier[];
  nearMisses: NearMiss[];            // "almost eligible, fix X"
};

interface ScoreBreakdown {
  category: string;
  factor: string;
  points: number;
  maxPoints: number;
  explanation: string;               // "5 years ownership → 15/20 points"
}

interface Disqualifier {
  requirement: string;
  userValue: string;
  requiredValue: string;
  explanation: string;               // "Net worth $400K is below minimum $600K"
  fixable: boolean;                  // can the user reasonably fix this?
  fixSuggestion: string | null;
}

interface NearMiss {
  requirement: string;
  gap: string;
  effort: "low" | "medium" | "high";
  suggestion: string;
}

interface ProgramResult {
  programId: string;
  eligibility: EligibilityResult;
  probability: ProbabilityEstimate;  // See §4
  sensitivity: SensitivityAnalysis[];
}

interface SensitivityAnalysis {
  factor: string;
  currentValue: string;
  improvedValue: string;
  scoreChange: number;
  probabilityChange: number;
  effort: "low" | "medium" | "high";
  description: string;              // "If CLB increases from 5→7, score +10, probability +15%"
}
```

### 3.2 Rules Engine (JSONLogic-based)

Rules are stored as structured JSON in the `program_rules` table. The engine uses [JSONLogic](https://jsonlogic.com/) for condition evaluation, making rules declarative and updateable without code deploys.

```typescript
// Example: BC Entrepreneur Base eligibility rules (stored in DB)
{
  "programId": "bc-entrepreneur-base",
  "version": 3,
  "eligibility": [
    {
      "id": "min-net-worth",
      "label": "Minimum net worth of $600,000 CAD",
      "condition": { ">=": [{ "var": "personalNetWorth" }, 600000] },
      "disqualifyMessage": "Net worth ${personalNetWorth} is below the $600,000 minimum"
    },
    {
      "id": "min-clb",
      "label": "Minimum CLB 4 in English or French",
      "condition": { "or": [
        { ">=": [{ "var": "clbEnglish" }, 4] },
        { ">=": [{ "var": "clbFrench" }, 4] }
      ]},
      "disqualifyMessage": "Language proficiency below CLB 4"
    },
    {
      "id": "min-business-exp",
      "label": "3+ years business ownership in past 5 years",
      "condition": { ">=": [{ "var": "businessOwnershipYears" }, 3] },
      "disqualifyMessage": "Business ownership experience (${businessOwnershipYears} years) below 3-year minimum"
    },
    {
      "id": "min-investment",
      "label": "Minimum $200,000 CAD investment",
      "condition": { ">=": [{ "var": "investmentCapacity" }, 200000] },
      "disqualifyMessage": "Investment capacity below $200,000 minimum"
    }
  ],
  "scoring": {
    "maxScore": null,
    "categories": [
      {
        "name": "Business Experience",
        "factors": [
          {
            "name": "Years of ownership",
            "rules": [
              { "condition": { ">=": [{"var": "businessOwnershipYears"}, 10] }, "points": 20 },
              { "condition": { ">=": [{"var": "businessOwnershipYears"}, 8] }, "points": 16 },
              { "condition": { ">=": [{"var": "businessOwnershipYears"}, 5] }, "points": 12 },
              { "condition": { ">=": [{"var": "businessOwnershipYears"}, 3] }, "points": 8 }
            ]
          }
        ]
      },
      {
        "name": "Location",
        "factors": [
          {
            "name": "Business location",
            "rules": [
              { "condition": { "==": [{"var": "intendedLocation"}, "rural"] }, "points": 12 },
              { "condition": { "==": [{"var": "intendedLocation"}, "regional"] }, "points": 8 },
              { "condition": { "==": [{"var": "intendedLocation"}, "metro"] }, "points": 0 }
            ]
          }
        ]
      }
    ]
  }
}
```

### 3.3 Evaluation Pseudocode

```
function evaluateProgram(profile: UserProfile, rules: ProgramRules): ProgramResult {
  // Step 1: Check hard eligibility
  disqualifiers = []
  for each rule in rules.eligibility:
    if NOT jsonLogic.apply(rule.condition, profile):
      disqualifiers.push({
        requirement: rule.label,
        userValue: resolveVar(rule.condition, profile),
        requiredValue: extractThreshold(rule.condition),
        explanation: interpolate(rule.disqualifyMessage, profile),
        fixable: classifyFixability(rule.id),
        fixSuggestion: generateSuggestion(rule.id, profile)
      })

  if disqualifiers.length > 0:
    return {
      eligible: false,
      disqualifiers,
      nearMisses: findNearMisses(disqualifiers, profile)
    }

  // Step 2: Compute score (if program uses points)
  if rules.scoring is null:
    return { eligible: true, score: null, breakdown: [] }

  breakdown = []
  totalScore = 0
  for each category in rules.scoring.categories:
    for each factor in category.factors:
      // Rules are ordered highest-to-lowest; first match wins
      for each scoringRule in factor.rules:
        if jsonLogic.apply(scoringRule.condition, profile):
          breakdown.push({
            category: category.name,
            factor: factor.name,
            points: scoringRule.points,
            maxPoints: factor.rules[0].points,  // first rule = max
            explanation: formatExplanation(scoringRule, profile)
          })
          totalScore += scoringRule.points
          break

  // Step 3: Check category minimums (e.g., ON business concept 50%)
  meetsMinScore = true
  if rules.scoring.minScoreRequired:
    meetsMinScore = totalScore >= rules.scoring.minScoreRequired

  // Step 4: Sensitivity analysis
  sensitivity = computeSensitivity(profile, rules, totalScore)

  return { eligible: true, score: totalScore, breakdown, meetsMinScore, sensitivity }
}

function computeSensitivity(profile, rules, currentScore): SensitivityAnalysis[] {
  analyses = []
  improvements = [
    { field: "clbEnglish", steps: [5,6,7,8,9], label: "CLB English" },
    { field: "businessOwnershipYears", steps: [3,5,8,10], label: "Years ownership" },
    { field: "personalNetWorth", steps: [300000,500000,600000,800000], label: "Net worth" },
    { field: "investmentCapacity", steps: [100000,200000,300000,600000], label: "Investment" },
  ]

  for each improvement in improvements:
    currentVal = profile[improvement.field]
    for each step in improvement.steps:
      if step > currentVal:
        modifiedProfile = { ...profile, [improvement.field]: step }
        newResult = evaluateProgram(modifiedProfile, rules)
        if newResult.score != currentScore:
          analyses.push({
            factor: improvement.label,
            currentValue: currentVal,
            improvedValue: step,
            scoreChange: newResult.score - currentScore,
            effort: classifyEffort(improvement.field, currentVal, step),
            description: `If ${improvement.label} improves from ${currentVal} to ${step}, score changes by ${newResult.score - currentScore} points`
          })
          break  // only report first meaningful step

  return analyses.sort(by: scoreChange descending)
}
```

### 3.4 Rule Update Workflow

1. Admin or pipeline detects rule change
2. New `program_rules` row created with `version = current + 1` and `effective_from = NOW()`
3. Previous version gets `effective_until = NOW()`
4. All active assessments continue using their `rules_snapshot_ids` (immutable)
5. New assessments use latest rules
6. Unit tests run automatically against the new rules (CI check before merge)

---

## 4. Probability ("Chance of Success") Model

### 4.1 Approach: Calibrated Heuristic (v1) → ML (v2)

**v1 (launch)**: Score-vs-cutoff percentile model with adjustment factors.

The core idea: for programs with draw history, compute where the user's score falls relative to historical invitation cutoffs. For programs without points, use a composite eligibility strength score.

```typescript
interface ProbabilityEstimate {
  percent: number;                // 0-100, rounded to nearest 5
  confidence: "low" | "moderate" | "high";
  range: [number, number];       // e.g. [25, 45] for "30-40%" display
  tier: "strong" | "competitive" | "moderate" | "low" | "unlikely" | "ineligible";
  explanation: string;
  caveats: string[];
  dataPoints: number;            // number of draws used
  lastDrawDate: string | null;
}
```

### 4.2 Scoring-to-Probability Algorithm

```
function estimateProbability(
  programId: string,
  userScore: number | null,
  eligible: boolean,
  draws: DrawRecord[]
): ProbabilityEstimate {

  if NOT eligible:
    return { percent: 0, tier: "ineligible", ... }

  // Programs WITH points-based draws
  if userScore is not null AND draws.length >= 3:
    recentDraws = draws.filter(last 12 months)

    if recentDraws.length >= 2:
      // Compute percentile position
      minScores = recentDraws.map(d => d.min_score).filter(nonNull)
      avgMinScore = mean(minScores)
      stdDevMinScore = stddev(minScores)

      // How many standard deviations above/below the average cutoff?
      zScore = (userScore - avgMinScore) / max(stdDevMinScore, 1)

      // Map z-score to probability using conservative logistic function
      // Shrunk toward 50% to avoid overconfidence
      rawProbability = logistic(zScore, midpoint=0, steepness=1.2)

      // Apply shrinkage based on data volume
      shrinkageFactor = min(recentDraws.length / 12, 1.0)  // full confidence at 12+ draws
      shrunkProbability = rawProbability * shrinkageFactor + 0.5 * (1 - shrinkageFactor)

      // Apply program activity adjustment
      drawFrequency = recentDraws.length / 12  // draws per month
      if drawFrequency < 0.25:  // less than quarterly
        activityPenalty = 0.7
      else if drawFrequency < 0.5:
        activityPenalty = 0.85
      else:
        activityPenalty = 1.0

      adjustedProbability = shrunkProbability * activityPenalty

      // Compute confidence interval
      marginOfError = (1 - shrinkageFactor) * 20 + 5  // 5-25% margin
      lowerBound = max(0, adjustedProbability - marginOfError)
      upperBound = min(100, adjustedProbability + marginOfError)

      // Round to nearest 5%
      displayPercent = round(adjustedProbability / 5) * 5

      return {
        percent: displayPercent,
        confidence: shrinkageFactor > 0.7 ? "high" : shrinkageFactor > 0.3 ? "moderate" : "low",
        range: [round(lowerBound/5)*5, round(upperBound/5)*5],
        tier: classifyTier(displayPercent),
        dataPoints: recentDraws.length,
        ...
      }

  // Programs WITHOUT points or with insufficient draw data
  else:
    // Composite strength score based on how far above minimums
    strengthFactors = [
      netWorthStrength(profile.netWorth, program.minNetWorth),      // 0-1
      investmentStrength(profile.investment, program.minInvestment),  // 0-1
      languageStrength(profile.clb, program.minCLB),                 // 0-1
      experienceStrength(profile.bizYears, program.minBizYears),     // 0-1
      bonusFactors(profile, program)                                  // 0-0.5
    ]
    compositeStrength = weightedMean(strengthFactors, [0.2, 0.2, 0.15, 0.25, 0.2])

    // With low data, cap probability at 60% and use wide range
    cappedProbability = min(compositeStrength * 70, 60)

    return {
      percent: round(cappedProbability / 5) * 5,
      confidence: "low",
      range: [max(0, cappedProbability - 20), min(60, cappedProbability + 20)],
      tier: classifyTier(cappedProbability),
      caveats: ["Limited historical draw data; estimate based on eligibility strength relative to requirements"],
      ...
    }
}

function classifyTier(percent: number): string {
  if percent >= 70: return "strong"
  if percent >= 50: return "competitive"
  if percent >= 30: return "moderate"
  if percent >= 15: return "low"
  return "unlikely"
}
```

### 4.3 Preventing Misleading Certainty

| Safeguard | Implementation |
|-----------|---------------|
| **Minimum data threshold** | Programs with < 3 draws get "low" confidence + capped at 60% |
| **Shrinkage toward prior** | All estimates shrunk toward 50% proportional to data scarcity |
| **Rounded display** | Never show decimals; round to nearest 5% |
| **Range display** | Always show range, not point estimate: "35-50%" not "42%" |
| **Tier labels** | Use qualitative tiers (Strong/Competitive/Moderate/Low/Unlikely) alongside numbers |
| **Visible disclaimers** | Mandatory disclaimer below every probability display |
| **"Last updated" timestamp** | Shows data freshness per program |
| **Inactive program penalty** | Programs with infrequent draws get lower probability |

### 4.4 v2 ML Upgrade Path (Post-Launch)

When sufficient data is collected (6+ months of tracking draws + user assessments):

- Train logistic regression per program: `P(invitation | score, draw_frequency, season, allocation_remaining)`
- Calibrate using Platt scaling; validate with reliability diagrams
- Add Bayesian updating: prior from program rules, updated with each new draw
- A/B test ML model vs heuristic; only deploy if calibration improves

---

## 5. UX/UI Specification

### 5.1 Design System Integration

The tool reuses GenesisLink's existing design tokens:

```css
/* Assessment-specific CSS variables, derived from GenesisLink brand */
:root {
  /* Typography — matches existing site */
  --font-display: 'Urbanist', sans-serif;
  --font-body: 'Nunito', sans-serif;

  /* Colors — extracted from genesislink.ca */
  --color-navy: #000000;
  --color-cyan: #0099cc;
  --color-gray: #93a0a9;
  --color-white: #ffffff;
  --color-bg-light: #f8f9fa;
  --color-bg-dark: #0a0a0a;

  /* Scoring tiers */
  --color-strong: #10b981;      /* green */
  --color-competitive: #0099cc; /* brand cyan */
  --color-moderate: #f59e0b;    /* amber */
  --color-low: #ef4444;         /* red */
  --color-unlikely: #6b7280;    /* gray */

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Components */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 12px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.15);
}
```

### 5.2 Screen Flow

```
Entry Point (CTA)
    │
    ▼
Landing Page (/assessment)
    │
    ▼
Questionnaire (/assessment/questionnaire)
  ├── Section 1: Personal Info (5 questions)
  ├── Section 2: Language (2-4 questions, conditional)
  ├── Section 3: Education (3-5 questions, conditional)
  ├── Section 4: Business Experience (5-7 questions)
  ├── Section 5: Financial Profile (4 questions)
  ├── Section 6: Canada Connection (3-6 questions, conditional)
  └── Section 7: Business Intent (4 questions)
    │
    ▼
Review Screen (/assessment/review)
    │
    ▼
Results Dashboard (/assessment/results)
  ├── Summary Card (top matches)
  ├── Program Cards (expandable)
  │   └── Detail Modal (score breakdown, gap analysis, sensitivity)
  └── CTA: "Book Consultation" / "Email PDF" / "Save & Return Later"
```

### 5.3 Screen Descriptions

#### Entry Point
- Added as a new nav item: "Assessment" (or integrated into existing "Services" dropdown)
- Hero CTA button on homepage: "Check Your Eligibility" with arrow icon
- Style: `theme-btn` primary with `bi bi-arrow-right` icon (matches existing CTAs)

#### Landing Page (`/assessment`)
- **Hero**: "Find Your Best Path to Canadian Entrepreneurship" — Urbanist bold, large
- **What to expect**: 3 icon cards: (1) "5-minute questionnaire" (2) "Scored against 15+ programs" (3) "Personalized gap analysis"
- **Disclaimer banner**: Light gray background, small text: "This assessment provides estimates based on publicly available program information..."
- **CTA**: "Start Assessment" button (primary cyan)
- **Social proof**: "Trusted by 300+ entrepreneurs across 30+ countries"

#### Questionnaire (`/assessment/questionnaire`)

**Layout**: Single-column, centered (max-width 640px), card-based. One section visible at a time.

**Progress indicator**: Horizontal step bar at top (7 dots with labels). Current section highlighted in cyan. Completed sections get checkmark.

**Question patterns**:
- **Number inputs**: Slider + manual input for ranges (age, years, amounts)
- **Currency inputs**: Formatted with $ prefix and thousand separators; CAD default with conversion tooltip
- **Single select**: Radio button cards (not dropdowns) for better mobile UX
- **Multi-select**: Checkbox cards for provinces of interest
- **Conditional**: Questions appear/hide with smooth animation based on previous answers

**Tooltips**: Every technical term has an `(i)` icon that opens a popover:
- CLB: "Canadian Language Benchmark — a standardized scale from 1-12 measuring English or French proficiency. CLB 4 is basic, CLB 7 is intermediate."
- Net Worth: "Total assets minus total liabilities. Includes real estate, investments, savings, and business equity."
- TEER: "Training, Education, Experience and Responsibilities — Canada's job classification system."
- Exploratory Visit: "A trip to a Canadian province to research business opportunities, meet local contacts, and explore communities."

**Section 1 — Personal Info** (5 questions):
1. Age (number slider, 18-75)
2. Country of citizenship (searchable dropdown)
3. Country of current residence (searchable dropdown)
4. Marital status (radio: single/married/common-law)
5. Does your spouse/partner intend to accompany you? (conditional, radio)

**Section 2 — Language** (2-4 questions):
1. Have you taken a recognized language test? (radio: IELTS/CELPIP/TEF/TCF/None)
2. If yes → CLB equivalent scores (4 fields: reading/writing/listening/speaking, with CLB converter helper)
3. If no → Self-assessed proficiency (radio: basic/intermediate/advanced/fluent per language)
4. French proficiency? (conditional radio, same structure)

**Section 3 — Education** (3-5 questions):
1. Highest level of education (radio cards: high school / 2yr diploma / 3yr degree / bachelor's / master's / PhD)
2. Country where credential was obtained (dropdown)
3. Do you have a Canadian degree or diploma? (radio)
4. If yes → province and length (conditional)
5. Do you have an ECA (Educational Credential Assessment)? (conditional radio)

**Section 4 — Business Experience** (5-7 questions):
1. Do you currently own or have you owned a business? (radio)
2. If yes → years of ownership (slider) + ownership percentage (slider)
3. Number of employees in your business (number input)
4. If no ownership → years of senior management experience (slider)
5. Primary business sector/industry (searchable dropdown with NAICS categories, plain language)
6. Approximate annual business revenue (range selector: <$100K / $100-500K / $500K-1M / $1-5M / $5M+)
7. Do you currently operate a business in Canada? (radio, conditional)

**Section 5 — Financial Profile** (4 questions):
1. Estimated personal net worth in CAD (range selector with breakpoints at key thresholds: <$250K / $250-400K / $400-600K / $600-800K / $800K-1M / $1M+)
2. Liquid assets available (same range pattern)
3. How much are you willing to invest in a Canadian business? (range selector aligned to program thresholds)
4. Can you provide verified proof of funds? (radio: yes/in-process/no)

**Section 6 — Canada Connection** (3-6 questions, conditional):
1. Have you visited any Canadian province for business research? (radio)
2. If yes → which province(s)? (multi-select) + duration (number input per province)
3. Do you have a community referral or endorsement letter? (radio)
4. If yes → from which community? (text input)
5. Do you have family members in Canada? (radio)
6. If yes → which province? (dropdown)

**Section 7 — Business Intent** (4 questions):
1. Which province(s) interest you? (multi-select cards with province flags/icons, or "Open to any")
2. Location preference (radio: major city / smaller city / rural / flexible)
3. Planned number of Canadian employees (number input)
4. Do you hold a Post-Graduation Work Permit? (radio)

**Total questions**: 25-35 depending on conditional branches.

**Save and Resume**: Auto-save to encrypted session cookie on every answer. Optional "Save with email" button appears after Section 3.

#### Review Screen (`/assessment/review`)
- All answers displayed in a summary card, grouped by section
- Edit button per section (returns to that section with answers preserved)
- "Submit for Analysis" CTA button
- Below CTA: privacy consent checkbox: "I consent to temporary storage of my responses for the purpose of this assessment. [Privacy Policy]"

#### Results Dashboard (`/assessment/results`)

**Layout**: Full-width, card-based dashboard.

**Top section — Summary**:
- Headline: "Your Assessment Results" (Urbanist bold)
- Subhead: "Based on your profile, here are your strongest program matches"
- Timestamp: "Assessed on March 5, 2026 · Program data last updated March 5, 2026"
- Disclaimer bar (always visible): "These results are estimates based on publicly available information and do not constitute legal advice or guarantee any outcome."

**Match cards** (sorted by probability tier, then score):
Each card shows:
```
┌─────────────────────────────────────────────────┐
│  [Province Flag] BC Entrepreneur — Base          │
│  Status: ● Active                                │
│                                                   │
│  Score: 127 / ~200        ████████████░░░░  64%  │
│  Estimated Chance: ■■■■■■■■░░  Competitive       │
│                    35 — 50%                       │
│                                                   │
│  ✓ Eligible  │  2 areas to improve               │
│                                                   │
│  [View Details]              [Compare Programs]   │
└─────────────────────────────────────────────────┘
```

**Tier color coding**:
- Strong (70%+): green bar + shield icon
- Competitive (50-69%): cyan bar
- Moderate (30-49%): amber bar
- Low (15-29%): red bar
- Unlikely (<15%): gray bar
- Ineligible: gray, struck-through, "Not Eligible" badge with reason

**Detail Modal** (opens on "View Details"):
- **Score Breakdown**: Accordion with each scoring category → factors → points earned / max
- **Gap Analysis**: Red/amber/green indicators per requirement. Red = disqualifier, amber = near miss, green = meets/exceeds
- **Sensitivity Table**: "How to improve" — ranked by impact, showing score/probability delta
- **Program Info**: Official link, last draw date, recent cutoff scores, draw frequency
- **Disclaimer**: Repeated at bottom of modal

**Bottom CTAs**:
- "Book a Consultation" → links to genesislink.ca/contact (or calendly embed)
- "Email My Results" → email input + send branded PDF
- "Start Over" → clears session, returns to landing

### 5.4 Mobile-First and Accessibility

- All screens designed mobile-first (320px minimum viewport)
- Touch targets minimum 44x44px
- Questions use full-width card radio buttons (not tiny radio circles)
- Color is never the sole indicator (always paired with text/icon)
- All interactive elements keyboard-navigable
- ARIA labels on progress bar, tooltips, modals
- Focus management: modal trap, section transitions move focus
- Reduced motion: respect `prefers-reduced-motion`
- Contrast ratios: all text meets WCAG 2.1 AA (4.5:1 body, 3:1 large)
- Screen reader: results table has proper `<th>` scope, breakdown uses description lists

### 5.5 PDF Report

Generated server-side using `@react-pdf/renderer`:
- GenesisLink branded header (logo, navy + cyan)
- Assessment date and data freshness date
- Summary table: all programs with scores and tiers
- Per-program detail: breakdown + gap analysis
- Full disclaimer on final page
- "Prepared by GenesisLink · genesislink.ca"
- CTA: "Schedule your consultation at genesislink.ca/contact"

---

## 6. Implementation Plan

### 6.1 Component Architecture

```
app/
├── assessment/
│   ├── page.tsx                    # Landing page
│   ├── questionnaire/
│   │   └── page.tsx                # Multi-step questionnaire (client component)
│   ├── review/
│   │   └── page.tsx                # Review answers
│   └── results/
│       ├── page.tsx                # Results dashboard (server component with client islands)
│       └── [programId]/
│           └── page.tsx            # Deep-link to specific program detail
├── admin/
│   ├── pipeline/
│   │   └── page.tsx                # Review queue, pipeline logs
│   └── programs/
│       └── page.tsx                # Program rule editor
├── api/
│   ├── assessment/
│   │   ├── compute/route.ts        # POST: compute scores from answers
│   │   ├── save/route.ts           # POST: save assessment to DB
│   │   ├── resume/route.ts         # GET: load assessment by session/email
│   │   └── pdf/route.ts            # POST: generate and return PDF
│   ├── pipeline/
│   │   ├── scrape/[province]/route.ts  # Cron-triggered scraper per province
│   │   └── review/route.ts         # Admin: approve/reject changes
│   └── programs/
│       └── route.ts                # GET: list programs with current rules
lib/
├── scoring/
│   ├── engine.ts                   # Core evaluation function
│   ├── probability.ts              # Probability estimation
│   ├── sensitivity.ts              # Sensitivity analysis
│   └── jsonlogic.ts                # JSONLogic evaluator wrapper
├── pipeline/
│   ├── scrapers/                   # Per-province scraper modules
│   │   ├── bc.ts
│   │   ├── ab.ts
│   │   └── ...
│   ├── normalizer.ts               # Raw → structured data transform
│   └── changeDetector.ts           # Hash comparison + diff generation
├── db/
│   ├── client.ts                   # Supabase client singleton
│   ├── programs.ts                 # Program CRUD operations
│   ├── draws.ts                    # Draw history operations
│   ├── assessments.ts              # Assessment session operations
│   └── pipeline.ts                 # Pipeline run log operations
├── pdf/
│   └── generator.tsx               # React-PDF report template
└── types/
    ├── program.ts                  # Program, rules, draw types
    ├── assessment.ts               # UserProfile, answers types
    └── results.ts                  # Scoring, probability result types
components/
├── assessment/
│   ├── QuestionnaireShell.tsx       # Progress bar, navigation, auto-save
│   ├── sections/                    # One component per questionnaire section
│   │   ├── PersonalInfo.tsx
│   │   ├── Language.tsx
│   │   ├── Education.tsx
│   │   ├── BusinessExperience.tsx
│   │   ├── FinancialProfile.tsx
│   │   ├── CanadaConnection.tsx
│   │   └── BusinessIntent.tsx
│   ├── inputs/                      # Reusable form components
│   │   ├── RadioCardGroup.tsx
│   │   ├── RangeSlider.tsx
│   │   ├── CurrencyInput.tsx
│   │   ├── SearchableDropdown.tsx
│   │   └── Tooltip.tsx
│   ├── results/
│   │   ├── ResultsDashboard.tsx
│   │   ├── ProgramCard.tsx
│   │   ├── ScoreBreakdown.tsx
│   │   ├── GapAnalysis.tsx
│   │   ├── SensitivityTable.tsx
│   │   ├── ProbabilityBar.tsx
│   │   └── ProgramDetailModal.tsx
│   └── shared/
│       ├── DisclaimerBanner.tsx
│       ├── ProgressBar.tsx
│       └── SavePrompt.tsx
```

### 6.2 API Endpoints

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/assessment/compute` | Session cookie | 10/min | Compute scores from answers |
| POST | `/api/assessment/save` | Session cookie | 5/min | Save answers + optional email |
| GET | `/api/assessment/resume?token=X` | Session cookie | 10/min | Load saved assessment |
| POST | `/api/assessment/pdf` | Session cookie | 3/min | Generate PDF report |
| GET | `/api/programs` | None (public) | 30/min | List programs with status |
| POST | `/api/pipeline/scrape/[province]` | Cron secret | N/A | Trigger scrape (Vercel cron) |
| POST | `/api/pipeline/review` | Admin auth | N/A | Approve/reject rule changes |

**Request/response for compute endpoint**:

```typescript
// POST /api/assessment/compute
// Request body:
{
  answers: UserProfile,      // validated against Zod schema
  sessionToken: string       // from encrypted cookie
}

// Response:
{
  results: ProgramResult[],  // sorted by probability desc
  meta: {
    computedAt: string,
    rulesVersions: Record<string, number>,  // programId → version used
    dataFreshness: Record<string, string>,  // programId → last draw date
  },
  disclaimer: string
}
```

### 6.3 Session Strategy

1. On first visit to `/assessment`, generate `sessionToken` (UUID v4) and set as encrypted `httpOnly` cookie (AES-256-GCM, key from env var)
2. All answers auto-saved to `assessments` table keyed by `sessionToken`
3. Cookie expires in 30 days; DB row has matching `expires_at`
4. If user provides email → store hashed email in `assessments.email` → enables resume from any device via magic link
5. No passwords, no accounts, no OAuth
6. Assessment data encrypted at rest in Supabase (column-level encryption for `answers` and `results` JSONB)

### 6.4 Security

| Threat | Mitigation |
|--------|-----------|
| XSS | Next.js automatic escaping; CSP headers; no raw HTML injection |
| CSRF | `SameSite=Strict` cookie; CSRF token on POST endpoints |
| Injection | Zod validation on all inputs; parameterized queries via Supabase client |
| Scraping abuse | Rate limiting (Vercel Edge middleware); no PII in public endpoints |
| Data exfiltration | Encrypted cookies; encrypted DB columns; RLS on Supabase tables |
| Prompt injection | No LLM in scoring pipeline; all evaluation is deterministic JSONLogic |
| Admin access | `/admin/*` routes behind basic auth or Supabase admin role; IP allowlist optional |

### 6.5 Caching

- Program list (`/api/programs`): CDN cached 1 hour, `stale-while-revalidate`
- Draw data: cached in-memory (Node.js module scope) for 1 hour, refreshed by cron
- Scoring computation: not cached (stateless, fast — sub-100ms for all 18 programs)
- Static pages (landing): ISR with 1-hour revalidation

### 6.6 Observability and Logging

- **Vercel Analytics**: page views, Web Vitals (LCP, FID, CLS)
- **Structured logging**: `pino` logger for API routes; log every computation with `sessionToken` (hashed), `programIds`, `duration_ms`
- **Pipeline monitoring**: Vercel cron dashboard + custom `/admin/pipeline` page showing last 30 runs, success rate, and error details
- **Alerting**: Failed scrapes or rule changes → email to admin; configurable Slack webhook

### 6.7 Testing Plan

| Layer | Tool | What | Coverage Target |
|-------|------|------|-----------------|
| Scoring rules | Vitest | Unit test every program's eligibility + scoring with fixture profiles | 100% of rules |
| Probability | Vitest | Unit test heuristic with known draw data → expected tier | Every tier boundary |
| JSONLogic | Vitest | Validate all rule JSON files parse and evaluate correctly | 100% of rule files |
| API routes | Vitest + supertest | Integration test compute/save/resume endpoints | All endpoints |
| Pipeline | Vitest | Mock scraper responses; test change detection + normalization | All provinces |
| Components | React Testing Library | Questionnaire navigation, conditional rendering, validation | All sections |
| E2E | Playwright | Full flow: landing → questionnaire → results → PDF | Happy path + 3 edge cases |
| Accessibility | axe-core + Playwright | Automated WCAG 2.1 AA checks on all pages | Zero violations |
| Visual regression | Playwright screenshots | Catch unintended UI changes | Results page |

**Fixture profiles for scoring tests**:
- `strong-candidate.json` — Exceeds all programs
- `minimal-candidate.json` — Barely eligible for cheapest programs
- `graduate-candidate.json` — Recent Canadian graduate with small business
- `high-net-worth-low-experience.json` — Rich but inexperienced
- `ineligible-all.json` — Fails all programs (test disqualifier messages)
- Per-province fixtures for edge cases

### 6.8 Rollout Plan

| Phase | Audience | Duration | Gate Criteria |
|-------|----------|----------|---------------|
| **1. Internal alpha** | GenesisLink team only | 1 week | All scoring unit tests pass; pipeline runs 3+ days without errors |
| **2. Admin preview** | Team + select advisors | 1 week | Manual review of 10+ real client profiles; scoring matches advisor expectations |
| **3. Closed beta** | 20-50 invited clients | 2 weeks | Completion rate > 70%; no critical bugs; advisor feedback incorporated |
| **4. Public launch** | All site visitors | — | Analytics baseline established; disclaimer approved by legal |

Feature flag: `ASSESSMENT_ENABLED` env var. When `false`, `/assessment` returns "Coming Soon" page with email signup.

---

## 7. Compliance & Disclaimers

### 7.1 Assessment Disclaimer (displayed on landing page, results page, and PDF)

> **Important Notice**
>
> This assessment tool provides **estimates only** based on publicly available information about Canadian Provincial Nominee Program entrepreneur streams. Results are generated using automated analysis of program requirements and historical invitation data.
>
> **This tool does not provide:**
> - Legal or immigration advice
> - Guarantees of invitation, nomination, or permanent residency
> - Official government assessments
>
> **Limitations:**
> - Program rules and requirements may change without notice. While we update our data daily, there may be a delay between official changes and our system updates.
> - Estimated success probabilities are statistical approximations based on historical patterns and may not reflect future outcomes.
> - Individual circumstances and application quality factors (business plan strength, interview performance, community fit) are not fully captured by this tool.
>
> **We strongly recommend** consulting with a licensed immigration consultant (RCIC) or lawyer before making any decisions based on these results.
>
> GenesisLink is not a law firm and does not provide legal advice. For professional immigration assistance, [book a consultation](/contact).

### 7.2 Privacy Consent (displayed on review screen before submission)

> **Your Privacy**
>
> By submitting this assessment, you consent to the following:
>
> - **What we collect**: Your questionnaire responses and computed results.
> - **How we use it**: Solely to generate your assessment results and, if you provide an email, to send you a copy.
> - **How long we keep it**: Assessment data is automatically deleted after **30 days**. If you provide an email, we retain only the hashed email for the purpose of re-sending results.
> - **Who can access it**: Your data is encrypted and accessible only to you (via your session or email link). GenesisLink advisors may access anonymized, aggregated data for service improvement.
> - **Your rights**: You may request deletion of your data at any time by contacting privacy@genesislink.ca. We will process deletion requests within 72 hours.
>
> We comply with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). We do not sell, share, or transfer your personal information to third parties.
>
> [View Full Privacy Policy](/privacy)

### 7.3 Data Retention Schedule

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| Assessment answers | 30 days from creation | Automated Supabase Edge Function (daily) |
| Computed results | 30 days from creation | Deleted with assessment |
| Email (if provided) | 30 days, or until deletion request | Automated + manual on request |
| Session cookies | 30 days | Browser expiry |
| Pipeline logs | 90 days | Automated cleanup |
| Draw history | Indefinite (public data) | N/A |
| Program rules | Indefinite (versioned, public) | N/A |

### 7.4 Deletion Request Workflow

1. User emails privacy@genesislink.ca with deletion request
2. Admin locates record by email hash or session token
3. Admin triggers deletion via `/admin/assessments` interface
4. All PII fields nullified; assessment row retained as anonymized record for analytics
5. Confirmation email sent within 72 hours
6. Deletion logged in audit trail

### 7.5 Cookie Consent

The assessment uses only **strictly necessary** cookies (session token for assessment functionality). Under PIPEDA and Canadian cookie guidance, strictly necessary cookies do not require opt-in consent. However, the privacy notice on the review screen covers this transparently.

If the site uses analytics cookies (Google Analytics, etc.), those are handled by the site's existing cookie consent mechanism, separate from the assessment tool.

---

## Appendix A: Questionnaire-to-Profile Mapping

| Question | Maps to UserProfile field | Validation |
|----------|--------------------------|------------|
| Age | `age` | integer, 18-75 |
| Country of citizenship | `citizenshipCountry` | ISO 3166-1 alpha-2 |
| CLB Reading/Writing/Listening/Speaking | `clbEnglish` (lowest of 4) | integer, 1-12 |
| Highest education | `highestEducation` | enum |
| Years of business ownership | `businessOwnershipYears` | integer, 0-50 |
| Ownership percentage | `ownershipPercentage` | integer, 0-100 |
| Personal net worth (range) | `personalNetWorth` | midpoint of selected range |
| Provinces of interest | `intendedProvince` | array of province codes |
| ... | ... | ... |

Note: Range selectors map to the **lower bound** of the selected range for conservative scoring (e.g., "$400-600K" maps to $400,000).

---

## Appendix B: Draw Data Seeding

To launch with meaningful probability estimates, historical draw data must be seeded for programs with publicly available draw results. Priority programs (those with the most available data):

1. **BC Base** — Monthly draws since 2019; min scores published
2. **Manitoba Entrepreneur** — LAA draws published quarterly
3. **Ontario** — Historical draws available (program now closed, useful for "if reopened" scenarios)
4. **Nova Scotia** — Draw results published
5. **Newfoundland** — EOI draw results since Feb 2025
6. **New Brunswick** — Periodic EOI results

For programs without published draw history (NWT, Yukon, PEI), the system defaults to the composite-strength fallback model with "low confidence" labeling.

---

## Acceptance Criteria

- [ ] Single questionnaire (25-35 questions) maps to all 18 program streams
- [ ] Every eligible program shows: score breakdown, gap analysis, and probability estimate
- [ ] Ineligible programs show disqualifiers with fix suggestions
- [ ] Sensitivity analysis shows top 3 improvements per program with score/probability delta
- [ ] Probability displayed as range with tier label, never false precision
- [ ] Disclaimer visible on landing page, results page, every program detail, and PDF
- [ ] Data pipeline runs daily; rule changes require admin approval; draws auto-apply
- [ ] Assessment data encrypted at rest and auto-deleted after 30 days
- [ ] WCAG 2.1 AA compliant (zero axe-core violations)
- [ ] Mobile-first responsive (320px to 1440px+)
- [ ] PDF report generates with branded layout and all results
- [ ] All scoring rules unit-tested with fixture profiles
- [ ] E2E test covers full happy-path flow
- [ ] Feature flag for staged rollout
