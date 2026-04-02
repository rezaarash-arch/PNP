'use client'

import type { Disqualifier, NearMiss } from '@/lib/types/results'
import styles from './GapAnalysis.module.css'

export interface GapAnalysisProps {
  disqualifiers: Disqualifier[]
  nearMisses: NearMiss[]
}

function AlertIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 1L15 14H1L8 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line
        x1="8"
        y1="6"
        x2="8"
        y2="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12" r="0.75" fill="currentColor" />
    </svg>
  )
}

const EFFORT_LABELS: Record<NearMiss['effort'], string> = {
  low: 'Low effort',
  medium: 'Medium effort',
  high: 'High effort',
}

export default function GapAnalysis({
  disqualifiers,
  nearMisses,
}: GapAnalysisProps) {
  const hasContent = disqualifiers.length > 0 || nearMisses.length > 0

  if (!hasContent) return null

  return (
    <div className={styles.container}>
      {disqualifiers.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <AlertIcon />
            <span>Disqualifying Factors</span>
          </h4>
          <ul className={styles.list} role="list">
            {disqualifiers.map((dq, idx) => (
              <li key={idx} className={styles.disqualifierItem}>
                <div className={styles.itemHeader}>
                  <span className={styles.requirement}>{dq.requirement}</span>
                </div>
                <div className={styles.comparison}>
                  <span className={styles.userValue}>
                    Your value: <strong>{dq.userValue}</strong>
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    &rarr;
                  </span>
                  <span className={styles.requiredValue}>
                    Required: <strong>{dq.requiredValue}</strong>
                  </span>
                </div>
                <p className={styles.explanation}>{dq.explanation}</p>
                {dq.fixable && dq.fixSuggestion && (
                  <p className={styles.suggestion}>
                    <strong>Suggestion:</strong> {dq.fixSuggestion}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {nearMisses.length > 0 && (
        <section className={styles.section}>
          <h4 className={`${styles.sectionTitle} ${styles.nearMissTitle}`}>
            <AlertIcon />
            <span>Near Misses</span>
          </h4>
          <ul className={styles.list} role="list">
            {nearMisses.map((nm, idx) => (
              <li key={idx} className={styles.nearMissItem}>
                <div className={styles.itemHeader}>
                  <span className={styles.requirement}>{nm.requirement}</span>
                  <span
                    className={`${styles.effortBadge} ${styles[nm.effort]}`}
                  >
                    {EFFORT_LABELS[nm.effort]}
                  </span>
                </div>
                <p className={styles.gap}>
                  Gap: <strong>{nm.gap}</strong>
                </p>
                <p className={styles.suggestion}>{nm.suggestion}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
