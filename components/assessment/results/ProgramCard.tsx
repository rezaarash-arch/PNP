'use client'

import type { ProgramResult } from '@/lib/types/results'
import ProbabilityBar from './ProbabilityBar'
import styles from './ProgramCard.module.css'

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
  'nb-entrepreneurial': { province: 'New Brunswick', stream: 'Business Immigration' },
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

export interface ProgramCardProps {
  result: ProgramResult
  onViewDetails: () => void
  /** When true, renders with featured styling (used for top recommendations) */
  featured?: boolean
}

export default function ProgramCard({ result, onViewDetails, featured = false }: ProgramCardProps) {
  const { province, stream } = formatProgramId(result.programId)
  const { eligibility, probability, sensitivity, meta } = result

  const isEligible = eligibility.eligible
  const score = isEligible ? eligibility.score : null
  const maxScore = isEligible ? eligibility.maxScore : null
  const hasScore = score !== null && maxScore !== null && maxScore > 0
  const scorePercent = hasScore ? Math.round((score / maxScore) * 100) : 0

  const cutoff = probability.lastDrawMinScore
  const cutoffPercent = hasScore && cutoff !== null && maxScore > 0
    ? Math.round((cutoff / maxScore) * 100)
    : null

  const aboveCutoff = hasScore && cutoff !== null ? score >= cutoff : null

  const improvementCount = sensitivity.length
  const isInactive = meta.status !== 'active'

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.header}>
        <div className={styles.programInfo}>
          <span className={styles.province}>{province}</span>
          <h3 className={styles.stream}>{stream}</h3>
        </div>
        <span
          className={`${styles.eligibilityBadge} ${isEligible ? styles.eligible : styles.ineligible}`}
          aria-label={isEligible ? 'Eligible' : 'Not Eligible'}
        >
          {isEligible ? (
            <>
              <span aria-hidden="true">&#10003;</span> Eligible
            </>
          ) : (
            <>
              <span aria-hidden="true">&#10007;</span> Not Eligible
            </>
          )}
        </span>
      </div>

      {/* Status banner for closed/paused/redesigning programs */}
      {isInactive && (
        <div
          className={`${styles.statusBanner} ${
            meta.status === 'closed'
              ? styles.statusClosed
              : meta.status === 'paused'
                ? styles.statusPaused
                : styles.statusRedesigning
          }`}
          role="alert"
        >
          <span className={styles.statusIcon} aria-hidden="true">
            {meta.status === 'closed' ? '⊘' : meta.status === 'paused' ? '⏸' : '🔄'}
          </span>
          <span>
            {meta.status === 'closed' && 'This program is closed'}
            {meta.status === 'paused' && 'This program is currently suspended'}
            {meta.status === 'redesigning' && 'This program is being redesigned'}
          </span>
        </div>
      )}

      {/* Score vs Cutoff comparison */}
      {hasScore && (
        <div className={styles.scoreSection}>
          <div className={styles.scoreHeader}>
            <span className={styles.scoreLabel}>Your Score</span>
            <span className={styles.scoreValue}>
              {score}/{maxScore}
            </span>
          </div>
          <div className={styles.scoreTrack}>
            <div
              className={styles.scoreFill}
              style={{ width: `${scorePercent}%` }}
            />
            {/* Cutoff marker line */}
            {cutoffPercent !== null && (
              <div
                className={styles.cutoffMarker}
                style={{ left: `${Math.min(cutoffPercent, 100)}%` }}
                title={`Latest draw cutoff: ${cutoff}`}
              >
                <div className={styles.cutoffLine} />
              </div>
            )}
          </div>
          {/* Score legend */}
          {cutoff !== null && (
            <div className={styles.scoreLegend}>
              <span className={`${styles.cutoffLabel} ${aboveCutoff ? styles.cutoffAbove : styles.cutoffBelow}`}>
                {aboveCutoff ? '✓' : '▲'} Last draw cutoff: {cutoff}
              </span>
              <span className={styles.dataPointsLabel}>
                {probability.dataPoints} draw{probability.dataPoints !== 1 ? 's' : ''} &middot; {probability.confidence} confidence
              </span>
            </div>
          )}
        </div>
      )}

      <div className={styles.probabilitySection}>
        <ProbabilityBar
          percent={probability.percent}
          range={probability.range}
          tier={probability.tier}
          confidence={probability.confidence}
        />
      </div>

      {probability.lastDrawDate && (
        <p className={styles.drawInfo}>
          Last draw: {new Date(probability.lastDrawDate).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      )}

      <div className={styles.footer}>
        {improvementCount > 0 && (
          <span className={styles.improvements}>
            {improvementCount} improvement{improvementCount !== 1 ? 's' : ''} available
          </span>
        )}
        <button
          type="button"
          className={styles.detailsButton}
          onClick={onViewDetails}
        >
          View Details
        </button>
      </div>
    </article>
  )
}
