'use client'

import type { SensitivityAnalysis } from '@/lib/types/results'
import styles from './SensitivityTable.module.css'

export interface SensitivityTableProps {
  items: SensitivityAnalysis[]
}

const EFFORT_LABELS: Record<SensitivityAnalysis['effort'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export default function SensitivityTable({ items }: SensitivityTableProps) {
  if (items.length === 0) return null

  // Sort by score change descending (biggest improvements first)
  const sorted = [...items].sort((a, b) => b.scoreChange - a.scoreChange)

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Improvement Opportunities</h4>

      {/* Desktop table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Improvement opportunities">
          <thead>
            <tr>
              <th className={styles.th} scope="col">Factor</th>
              <th className={styles.th} scope="col">Current &rarr; Improved</th>
              <th className={`${styles.th} ${styles.thRight}`} scope="col">Score Change</th>
              <th className={styles.th} scope="col">Effort</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => (
              <tr key={`${item.factor}-${idx}`} className={styles.row}>
                <td className={styles.td}>
                  <span className={styles.factorName}>{item.factor}</span>
                  <span className={styles.factorDescription}>
                    {item.description}
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={styles.transition}>
                    <span className={styles.currentValue}>
                      {item.currentValue}
                    </span>
                    <span className={styles.transitionArrow} aria-label="to">
                      &rarr;
                    </span>
                    <span className={styles.improvedValue}>
                      {item.improvedValue}
                    </span>
                  </span>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                  <span className={styles.scoreChange}>
                    +{item.scoreChange}
                  </span>
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.effortBadge} ${styles[item.effort]}`}
                  >
                    {EFFORT_LABELS[item.effort]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className={styles.mobileCards} role="list" aria-label="Improvement opportunities">
        {sorted.map((item, idx) => (
          <div
            key={`mobile-${item.factor}-${idx}`}
            className={styles.mobileCard}
            role="listitem"
          >
            <div className={styles.mobileHeader}>
              <span className={styles.factorName}>{item.factor}</span>
              <span
                className={`${styles.effortBadge} ${styles[item.effort]}`}
              >
                {EFFORT_LABELS[item.effort]}
              </span>
            </div>
            <p className={styles.factorDescription}>{item.description}</p>
            <div className={styles.mobileDetails}>
              <span className={styles.transition}>
                <span className={styles.currentValue}>
                  {item.currentValue}
                </span>
                <span className={styles.transitionArrow} aria-label="to">
                  &rarr;
                </span>
                <span className={styles.improvedValue}>
                  {item.improvedValue}
                </span>
              </span>
              <span className={styles.scoreChange}>+{item.scoreChange}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
