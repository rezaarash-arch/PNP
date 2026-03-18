'use client'

import type { ProgramResult } from '@/lib/types/results'
import { computePathways, type PathwayRecommendation } from '@/lib/scoring/pathways'
import { useMemo } from 'react'
import styles from './PathwayRecommendations.module.css'

/** Human-readable names derived from programId slugs */
const PROGRAM_DISPLAY_NAMES: Record<string, { province: string; stream: string }> = {
  'bc-entrepreneur-base': { province: 'British Columbia', stream: 'Entrepreneur Base' },
  'bc-entrepreneur-regional': { province: 'British Columbia', stream: 'Entrepreneur Regional' },
  'bc-entrepreneur-strategic': { province: 'British Columbia', stream: 'Entrepreneur Strategic' },
  'ab-rural-entrepreneur': { province: 'Alberta', stream: 'Rural Entrepreneur' },
  'ab-graduate-entrepreneur': { province: 'Alberta', stream: 'Graduate Entrepreneur' },
  'ab-foreign-graduate': { province: 'Alberta', stream: 'Foreign Graduate' },
  'ab-farm': { province: 'Alberta', stream: 'Farm Stream' },
  'sk-entrepreneur': { province: 'Saskatchewan', stream: 'Entrepreneur' },
  'sk-graduate-entrepreneur': { province: 'Saskatchewan', stream: 'Graduate Entrepreneur' },
  'mb-entrepreneur': { province: 'Manitoba', stream: 'Entrepreneur' },
  'mb-farm-investor': { province: 'Manitoba', stream: 'Farm Investor' },
  'on-entrepreneur': { province: 'Ontario', stream: 'Entrepreneur' },
  'nb-entrepreneurial': { province: 'New Brunswick', stream: 'Entrepreneurial' },
  'nb-post-grad': { province: 'New Brunswick', stream: 'Post-Graduate' },
  'ns-entrepreneur': { province: 'Nova Scotia', stream: 'Entrepreneur' },
  'ns-graduate-entrepreneur': { province: 'Nova Scotia', stream: 'Graduate Entrepreneur' },
  'pei-work-permit': { province: 'Prince Edward Island', stream: 'Work Permit' },
  'nl-entrepreneur': { province: 'Newfoundland & Labrador', stream: 'Entrepreneur' },
  'nl-graduate-entrepreneur': { province: 'Newfoundland & Labrador', stream: 'Graduate Entrepreneur' },
  'nwt-business': { province: 'Northwest Territories', stream: 'Business' },
  'yk-business-nominee': { province: 'Yukon', stream: 'Business Nominee' },
}

function formatProgramId(programId: string): { province: string; stream: string } {
  const known = PROGRAM_DISPLAY_NAMES[programId]
  if (known) return known
  const parts = programId.split('-')
  const province = (parts[0] ?? programId).toUpperCase()
  const stream = parts
    .slice(1)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return { province, stream: stream || 'General' }
}

interface PathwayRecommendationsProps {
  results: ProgramResult[]
}

export default function PathwayRecommendations({ results }: PathwayRecommendationsProps) {
  const pathways = useMemo(() => computePathways(results), [results])

  if (pathways.length === 0) return null

  const hasNoEligible = results.every((r) => !r.eligibility.eligible)

  return (
    <div className={styles.container}>
      {/* Banner when no programs are eligible */}
      {hasNoEligible && (
        <div className={styles.overallBanner}>
          <span className={styles.bannerIcon} aria-hidden="true">💡</span>
          <div className={styles.bannerText}>
            <strong>You&apos;re not eligible for any programs yet — but you&apos;re close!</strong>
            Here are the programs you&apos;re closest to qualifying for, with specific steps you can take to become eligible.
          </div>
        </div>
      )}

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Your Path to Eligibility</h2>
        <p className={styles.sectionSubtitle}>
          {hasNoEligible
            ? 'These programs require the fewest improvements to qualify. Focus on the actionable steps below.'
            : 'Programs you could unlock with a few improvements.'}
        </p>
      </div>

      {/* Pathway cards */}
      <div className={styles.cardGrid}>
        {pathways.map((pathway, index) => (
          <PathwayCard key={pathway.programId} pathway={pathway} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

// ----- Individual pathway card -----

function PathwayCard({ pathway, rank }: { pathway: PathwayRecommendation; rank: number }) {
  const { province, stream } = formatProgramId(pathway.programId)
  const { totalDisqualifiers, fixableCount, improvements, overallEffort, meta } = pathway

  // Progress ring values
  const ringSize = 60
  const strokeWidth = 5
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // What fraction of disqualifiers are fixable
  const fixProgress = totalDisqualifiers > 0 ? fixableCount / totalDisqualifiers : 0
  const strokeDashoffset = circumference * (1 - fixProgress)

  const ringColor = overallEffort === 'low' ? '#10b981' : overallEffort === 'medium' ? '#f59e0b' : '#ef4444'

  const rankClass =
    rank === 1 ? styles.rank1 : rank === 2 ? styles.rank2 : styles.rank3

  return (
    <article className={styles.pathwayCard}>
      {/* Rank badge */}
      <div className={`${styles.rankBadge} ${rankClass}`}>#{rank}</div>

      {/* Header */}
      <div className={styles.cardHeader}>
        <span className={styles.province}>
          {province}
          {meta.status === 'paused' && (
            <span className={styles.statusTag}>⏸ Paused</span>
          )}
        </span>
        <h3 className={styles.stream}>{stream}</h3>
      </div>

      {/* Progress ring + summary */}
      <div className={styles.progressSection}>
        <div className={styles.progressRing}>
          <svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            className={styles.progressRingSvg}
          >
            <circle
              className={styles.progressTrack}
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
            />
            <circle
              className={styles.progressFill}
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className={styles.progressLabel}>
            <span className={styles.progressCount}>{fixableCount}</span>
            <span className={styles.progressUnit}>fixable</span>
          </div>
        </div>
        <div className={styles.progressMeta}>
          <span className={styles.progressMetaLine}>
            {totalDisqualifiers} requirement{totalDisqualifiers !== 1 ? 's' : ''} to meet
          </span>
          <span className={styles.progressMetaDetail}>
            {fixableCount} of {totalDisqualifiers} are within your control
          </span>
          <span
            className={`${styles.effortBadge} ${
              overallEffort === 'low'
                ? styles.effortLow
                : overallEffort === 'medium'
                  ? styles.effortMedium
                  : styles.effortHigh
            }`}
          >
            {overallEffort === 'low' ? '⚡' : overallEffort === 'medium' ? '🔧' : '🏋️'}{' '}
            {overallEffort} effort
          </span>
        </div>
      </div>

      {/* Improvements list */}
      <ul className={styles.improvementsList}>
        {improvements.map((item, i) => (
          <li
            key={i}
            className={`${styles.improvementItem} ${
              item.fixable ? styles.improvementFixable : styles.improvementHard
            }`}
          >
            <span className={styles.improvementIcon} aria-hidden="true">
              {item.fixable ? '✅' : '🔒'}
            </span>
            <div className={styles.improvementContent}>
              <span className={styles.improvementRequirement}>{item.requirement}</span>
              <span className={styles.improvementGap}>{item.gap}</span>
              <span
                className={`${styles.improvementEffort} ${
                  item.effort === 'low'
                    ? styles.effortLow
                    : item.effort === 'medium'
                      ? styles.effortMedium
                      : styles.effortHigh
                }`}
              >
                {item.effort} effort
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Official link */}
      {meta.officialUrl && (
        <a
          href={meta.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.officialLink}
        >
          View official program page →
        </a>
      )}
    </article>
  )
}
