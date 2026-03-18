'use client'

import type { ProgramResult } from '@/lib/types/results'
import styles from './ComparisonChart.module.css'

/** Short labels for the chart */
const SHORT_NAMES: Record<string, string> = {
  'bc-entrepreneur-base': 'BC Base',
  'bc-entrepreneur-regional': 'BC Regional',
  'bc-entrepreneur-strategic': 'BC Strategic',
  'ab-rural-entrepreneur': 'AB Rural',
  'ab-graduate-entrepreneur': 'AB Graduate',
  'ab-foreign-graduate': 'AB Foreign Grad',
  'ab-farm': 'AB Farm',
  'sk-entrepreneur': 'SK Entrepreneur',
  'sk-graduate-entrepreneur': 'SK Graduate',
  'mb-entrepreneur': 'MB Entrepreneur',
  'mb-farm-investor': 'MB Farm',
  'on-entrepreneur': 'ON Entrepreneur',
  'nb-entrepreneurial': 'NB Entrepreneurial',
  'nb-post-grad': 'NB Post-Grad',
  'ns-entrepreneur': 'NS Entrepreneur',
  'ns-graduate-entrepreneur': 'NS Graduate',
  'pei-work-permit': 'PEI Work Permit',
  'nl-entrepreneur': 'NL Entrepreneur',
  'nl-graduate-entrepreneur': 'NL Graduate',
  'nwt-business': 'NWT Business',
  'yk-business-nominee': 'YK Business',
}

function getShortName(id: string): string {
  return SHORT_NAMES[id] ?? id.replace(/-/g, ' ')
}

const TIER_COLORS: Record<string, string> = {
  strong: '#10b981',
  competitive: '#0099cc',
  moderate: '#f59e0b',
  low: '#ef4444',
  unlikely: '#6b7280',
  ineligible: '#d1d5db',
}

export interface ComparisonChartProps {
  results: ProgramResult[]
}

export default function ComparisonChart({ results }: ComparisonChartProps) {
  // Only show eligible programs, sorted by probability
  const eligible = results
    .filter((r) => r.eligibility.eligible)
    .sort((a, b) => b.probability.percent - a.probability.percent)

  if (eligible.length === 0) return null

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Program Comparison</h3>
      <p className={styles.subtitle}>Your selection probability across eligible programs</p>

      <div className={styles.chart} role="img" aria-label="Program probability comparison chart">
        {eligible.map((r) => {
          const score = r.eligibility.eligible ? r.eligibility.score : null
          const maxScore = r.eligibility.eligible ? r.eligibility.maxScore : null
          const cutoff = r.probability.lastDrawMinScore
          const color = TIER_COLORS[r.probability.tier] ?? '#6b7280'

          return (
            <div key={r.programId} className={styles.row}>
              <div className={styles.label}>
                <span className={styles.programName}>{getShortName(r.programId)}</span>
                {r.meta.status !== 'active' && (
                  <span className={styles.statusTag}>
                    {r.meta.status === 'paused' ? 'Paused' : r.meta.status === 'closed' ? 'Closed' : 'Redesigning'}
                  </span>
                )}
              </div>

              <div className={styles.barArea}>
                {/* Main probability bar */}
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${Math.max(2, r.probability.percent)}%`,
                      backgroundColor: color,
                    }}
                  />
                  {/* Confidence range overlay */}
                  <div
                    className={styles.rangeOverlay}
                    style={{
                      left: `${r.probability.range[0]}%`,
                      width: `${r.probability.range[1] - r.probability.range[0]}%`,
                      borderColor: color,
                    }}
                  />
                </div>

                {/* Score info line below bar */}
                <div className={styles.barMeta}>
                  <span className={styles.percent} style={{ color }}>
                    {r.probability.percent}%
                  </span>
                  {score !== null && maxScore !== null && maxScore > 0 && (
                    <span className={styles.scoreInfo}>
                      {score}/{maxScore}
                      {cutoff !== null && (
                        <> &middot; Cutoff: {cutoff}</>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendBar} style={{ backgroundColor: '#10b981' }} />
          <span>Strong</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendBar} style={{ backgroundColor: '#0099cc' }} />
          <span>Competitive</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendBar} style={{ backgroundColor: '#f59e0b' }} />
          <span>Moderate</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendBar} style={{ backgroundColor: '#ef4444' }} />
          <span>Low</span>
        </div>
      </div>
    </div>
  )
}
