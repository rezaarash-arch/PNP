'use client'

import type { ProgramResult } from '@/lib/types/results'
import styles from './SummaryStats.module.css'

export interface SummaryStatsProps {
  results: ProgramResult[]
}

export default function SummaryStats({ results }: SummaryStatsProps) {
  const eligible = results.filter((r) => r.eligibility.eligible)
  const activeEligible = eligible.filter((r) => r.meta.status === 'active')
  const topProgram = activeEligible.length > 0
    ? activeEligible.reduce((best, r) =>
        r.probability.percent > best.probability.percent ? r : best,
      )
    : eligible.length > 0
      ? eligible.reduce((best, r) =>
          r.probability.percent > best.probability.percent ? r : best,
        )
      : null

  const avgConfidence = eligible.length > 0
    ? eligible.reduce((sum, r) => sum + r.probability.percent, 0) / eligible.length
    : 0

  return (
    <div className={styles.container}>
      <div className={styles.stat}>
        <span className={styles.statNumber}>{eligible.length}</span>
        <span className={styles.statLabel}>
          Eligible Program{eligible.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span className={styles.statNumber}>
          {topProgram ? `${topProgram.probability.percent}%` : '—'}
        </span>
        <span className={styles.statLabel}>Best Match</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span className={styles.statNumber}>
          {Math.round(avgConfidence)}%
        </span>
        <span className={styles.statLabel}>Avg. Probability</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span className={styles.statNumber}>{results.length}</span>
        <span className={styles.statLabel}>Total Evaluated</span>
      </div>
    </div>
  )
}
