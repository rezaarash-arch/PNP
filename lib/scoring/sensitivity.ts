import { computeScore } from './engine'
import type { UserProfile } from '@/lib/types/assessment'
import type { SensitivityAnalysis } from '@/lib/types/results'

interface ProgramRules {
  eligibility: unknown[]
  scoring: unknown
}

interface ImprovementStep {
  field: keyof UserProfile
  steps: number[]
  label: string
}

const IMPROVEMENT_FIELDS: ImprovementStep[] = [
  { field: 'clbEnglish', steps: [4, 5, 6, 7, 8, 9], label: 'CLB English' },
  { field: 'businessOwnershipYears', steps: [3, 5, 8, 10], label: 'Years of business ownership' },
  { field: 'personalNetWorth', steps: [300000, 500000, 600000, 800000, 1000000, 2000000], label: 'Personal net worth' },
  { field: 'investmentCapacity', steps: [100000, 200000, 300000, 600000], label: 'Investment capacity' },
  { field: 'employeesManaged', steps: [1, 5, 10, 20], label: 'Employees managed' },
  { field: 'annualRevenue', steps: [100000, 250000, 500000, 1000000], label: 'Annual revenue' },
]

export function computeSensitivity(
  profile: UserProfile,
  rules: ProgramRules
): SensitivityAnalysis[] {
  if (!rules.scoring) return []

  const currentResult = computeScore(profile, rules.scoring as any)
  if (!currentResult) return []

  const analyses: SensitivityAnalysis[] = []

  for (const improvement of IMPROVEMENT_FIELDS) {
    const currentVal = profile[improvement.field] as number | null
    if (currentVal === null || currentVal === undefined) continue

    for (const step of improvement.steps) {
      if (step > (currentVal ?? 0)) {
        const modified = { ...profile, [improvement.field]: step }
        const newResult = computeScore(modified, rules.scoring as any)
        if (newResult && newResult.totalScore > currentResult.totalScore) {
          analyses.push({
            factor: improvement.label,
            currentValue: formatValue(currentVal, improvement.field),
            improvedValue: formatValue(step, improvement.field),
            scoreChange: newResult.totalScore - currentResult.totalScore,
            probabilityChange: 0, // Will be calculated later when combined with probability
            effort: classifyEffort(improvement.field, currentVal, step),
            description: `If ${improvement.label} improves from ${formatValue(currentVal, improvement.field)} to ${formatValue(step, improvement.field)}, score increases by ${newResult.totalScore - currentResult.totalScore} points`,
          })
          break // Only report first meaningful improvement per field
        }
      }
    }
  }

  return analyses.sort((a, b) => b.scoreChange - a.scoreChange)
}

function formatValue(value: number, field: string): string {
  const moneyFields = ['personalNetWorth', 'investmentCapacity', 'annualRevenue', 'liquidAssets']
  if (moneyFields.includes(field)) {
    return `$${value.toLocaleString('en-CA')}`
  }
  return String(value)
}

function classifyEffort(field: string, current: number, target: number): 'low' | 'medium' | 'high' {
  const gap = target - current
  if (field === 'clbEnglish' || field === 'clbFrench') {
    return gap <= 1 ? 'low' : gap <= 3 ? 'medium' : 'high'
  }
  if (field === 'businessOwnershipYears') {
    return gap <= 2 ? 'medium' : 'high'
  }
  if (field === 'personalNetWorth' || field === 'investmentCapacity') {
    return gap <= 200000 ? 'low' : gap <= 500000 ? 'medium' : 'high'
  }
  return 'medium'
}
