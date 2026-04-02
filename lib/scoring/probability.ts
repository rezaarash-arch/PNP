import type { ProbabilityEstimate } from '@/lib/types/results'

// ---------------------------------------------------------------------------
// Draw data shape expected by this module
// ---------------------------------------------------------------------------
export interface DrawRecord {
  draw_date: string
  min_score: number
  invitations_issued: number
}

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((sum, v) => sum + v, 0) / arr.length
}

export function stddev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

export function logistic(z: number, steepness: number = 1.2): number {
  return 1 / (1 + Math.exp(-steepness * z))
}

export function classifyTier(
  percent: number,
): ProbabilityEstimate['tier'] {
  if (percent >= 70) return 'strong'
  if (percent >= 50) return 'competitive'
  if (percent >= 30) return 'moderate'
  if (percent >= 15) return 'low'
  return 'unlikely'
}

export function roundToNearest5(n: number): number {
  return Math.round(n / 5) * 5
}

// ---------------------------------------------------------------------------
// Main estimation function
// ---------------------------------------------------------------------------

export function estimateProbability(
  programId: string,
  score: number | null,
  eligible: boolean,
  draws: DrawRecord[],
): ProbabilityEstimate {
  // ---- Ineligible candidates ----
  if (!eligible) {
    return {
      percent: 0,
      confidence: 'low',
      range: [0, 0],
      tier: 'ineligible',
      explanation: 'Candidate does not meet the eligibility requirements for this program.',
      caveats: ['Candidate is ineligible for this program.'],
      dataPoints: 0,
      lastDrawDate: null,
      lastDrawMinScore: null,
    }
  }

  // Sort draws by date descending to find the most recent
  const sortedDraws = [...draws].sort(
    (a, b) => new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime(),
  )
  const lastDrawDate = sortedDraws.length > 0 ? sortedDraws[0].draw_date : null
  const lastDrawMinScore = sortedDraws.length > 0 ? sortedDraws[0].min_score : null
  const dataPoints = draws.length

  const hasSufficientData = draws.length >= 3
  const hasScore = score !== null

  // ---- No score or insufficient data: fallback ----
  if (!hasScore || !hasSufficientData) {
    const caveats: string[] = []

    if (!hasScore) {
      caveats.push(
        'No points grid available for this program; estimate is based on general eligibility only.',
      )
    }
    if (!hasSufficientData) {
      caveats.push(
        `Limited historical draw data (${dataPoints} draw${dataPoints !== 1 ? 's' : ''} available). Estimate carries high uncertainty.`,
      )
    }

    // If we have some data and a score, do a rough estimate capped at 60%
    let rawPercent = 35
    if (hasScore && draws.length > 0) {
      const minScores = draws.map((d) => d.min_score)
      const avg = mean(minScores)
      // Simple above/below average heuristic
      if (score > avg) {
        rawPercent = Math.min(60, 35 + ((score - avg) / avg) * 40)
      } else {
        rawPercent = Math.max(5, 35 - ((avg - score) / avg) * 40)
      }
    }

    const percent = Math.min(60, roundToNearest5(rawPercent))
    const margin = 20
    const rangeLow = roundToNearest5(Math.max(0, percent - margin))
    const rangeHigh = roundToNearest5(Math.min(100, percent + margin))

    return {
      percent,
      confidence: 'low',
      range: [rangeLow, rangeHigh],
      tier: classifyTier(percent),
      explanation: generateExplanation(programId, percent, 'low', dataPoints),
      caveats,
      dataPoints,
      lastDrawDate,
      lastDrawMinScore,
    }
  }

  // ---- Has score + sufficient draw data (3+ draws) ----
  const minScores = draws.map((d) => d.min_score)
  const avgMinScore = mean(minScores)
  const stdDevMinScore = stddev(minScores)

  // Z-score: how many std devs above/below the average cutoff
  const z = (score - avgMinScore) / Math.max(stdDevMinScore, 1)

  // Conservative logistic mapping
  const rawProbability = logistic(z, 1.2) * 100

  // Shrinkage: pull toward 50% when data is sparse
  const shrinkageFactor = Math.min(dataPoints / 12, 1)
  const shrunk = rawProbability * shrinkageFactor + 50 * (1 - shrinkageFactor)

  // Activity penalty: how frequently does this program draw?
  const drawDates = sortedDraws.map((d) => new Date(d.draw_date).getTime())
  let activityMultiplier = 1.0
  if (drawDates.length >= 2) {
    const spanMonths =
      (drawDates[0] - drawDates[drawDates.length - 1]) / (1000 * 60 * 60 * 24 * 30)
    const drawFrequency = spanMonths > 0 ? dataPoints / spanMonths : 0
    if (drawFrequency < 0.25) {
      activityMultiplier = 0.7
    } else if (drawFrequency < 0.5) {
      activityMultiplier = 0.85
    }
  }

  const adjustedPercent = shrunk * activityMultiplier

  // Confidence interval
  const margin = (1 - shrinkageFactor) * 20 + 5

  // Determine confidence level
  let confidence: ProbabilityEstimate['confidence'] = 'high'
  if (dataPoints < 6) confidence = 'moderate'
  if (dataPoints < 3) confidence = 'low'

  // Round and clamp
  const percent = Math.min(100, Math.max(0, roundToNearest5(adjustedPercent)))
  const rangeLow = roundToNearest5(Math.max(0, adjustedPercent - margin))
  const rangeHigh = roundToNearest5(Math.min(100, adjustedPercent + margin))

  const caveats: string[] = []
  if (activityMultiplier < 1) {
    caveats.push('This program draws less frequently than average, reducing the probability estimate.')
  }
  if (shrinkageFactor < 1) {
    caveats.push('Limited draw history; estimate is pulled toward the baseline.')
  }

  return {
    percent,
    confidence,
    range: [rangeLow, rangeHigh],
    tier: classifyTier(percent),
    explanation: generateExplanation(programId, percent, confidence, dataPoints),
    caveats,
    dataPoints,
    lastDrawDate,
    lastDrawMinScore,
  }
}

// ---------------------------------------------------------------------------
// Explanation generator
// ---------------------------------------------------------------------------

function generateExplanation(
  programId: string,
  percent: number,
  confidence: ProbabilityEstimate['confidence'],
  dataPoints: number,
): string {
  const tier = classifyTier(percent)
  const tierLabels: Record<string, string> = {
    strong: 'strong chance',
    competitive: 'competitive chance',
    moderate: 'moderate chance',
    low: 'low chance',
    unlikely: 'unlikely chance',
  }
  const tierLabel = tierLabels[tier] || tier

  if (dataPoints === 0) {
    return `Based on eligibility alone, you have a ${tierLabel} of receiving an invitation from ${programId}. No historical draw data is available.`
  }

  return `Based on ${dataPoints} historical draw${dataPoints !== 1 ? 's' : ''}, you have a ${tierLabel} (~${percent}%) of receiving an invitation from ${programId}. Confidence: ${confidence}.`
}
