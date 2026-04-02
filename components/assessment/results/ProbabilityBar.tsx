'use client'

import styles from './ProbabilityBar.module.css'

const TIER_LABELS: Record<ProbabilityBarProps['tier'], string> = {
  strong: 'Strong',
  competitive: 'Competitive',
  moderate: 'Moderate',
  low: 'Low',
  unlikely: 'Unlikely',
  ineligible: 'Ineligible',
}

export interface ProbabilityBarProps {
  percent: number
  range: [number, number]
  tier: 'strong' | 'competitive' | 'moderate' | 'low' | 'unlikely' | 'ineligible'
  confidence: 'low' | 'moderate' | 'high'
}

export default function ProbabilityBar({
  percent,
  range,
  tier,
  confidence,
}: ProbabilityBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent))
  const tierLabel = TIER_LABELS[tier]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={`${styles.tierBadge} ${styles[tier]}`}>
          {tierLabel}
        </span>
        <span className={styles.rangeText}>
          {range[0]}&ndash;{range[1]}%
        </span>
      </div>

      <div
        className={styles.track}
        role="meter"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Selection probability: ${clampedPercent}%, tier: ${tierLabel}`}
      >
        <div
          className={`${styles.fill} ${styles[tier]}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      <div className={styles.footer}>
        <span className={styles.percentText}>{clampedPercent}%</span>
        <span className={styles.confidenceText}>
          {confidence} confidence
        </span>
      </div>
    </div>
  )
}
