'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { ProgramResult } from '@/lib/types/results'
import ScoreBreakdown from './ScoreBreakdown'
import GapAnalysis from './GapAnalysis'
import SensitivityTable from './SensitivityTable'
import ProbabilityBar from './ProbabilityBar'
import styles from './ProgramDetailModal.module.css'

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
  'fed-start-up-visa': { province: 'Federal', stream: 'Start-Up Visa' },
  'fed-self-employed': { province: 'Federal', stream: 'Self-Employed Persons' },
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

/** Programs where a portion of the total score is assessed by program officers */
const BUSINESS_CONCEPT_PROGRAMS: Record<string, { label: string; maxPoints: number }> = {
  'bc-entrepreneur-base': { label: 'Business Concept (assessed by BC PNP)', maxPoints: 80 },
  'bc-entrepreneur-regional': { label: 'Business Concept (assessed by BC PNP)', maxPoints: 60 },
  'on-entrepreneur': { label: 'Business Concept (assessed by OINP)', maxPoints: 74 },
  'nb-entrepreneurial': { label: 'Business Concept (assessed by NB PNP)', maxPoints: 15 },
  'ab-rural-entrepreneur': { label: 'Business Establishment (assessed by AAIP)', maxPoints: 60 },
  'sk-entrepreneur': { label: 'Business Establishment Plan (assessed by SINP)', maxPoints: 35 },
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface ProgramDetailModalProps {
  result: ProgramResult
  isOpen: boolean
  onClose: () => void
}

export default function ProgramDetailModal({
  result,
  isOpen,
  onClose,
}: ProgramDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Focus trap + escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'

      // Focus the dialog after mount
      requestAnimationFrame(() => {
        const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
          FOCUSABLE_SELECTOR,
        )
        if (firstFocusable) {
          firstFocusable.focus()
        } else {
          dialogRef.current?.focus()
        }
      })
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const { province, stream } = formatProgramId(result.programId)
  const { eligibility, probability, sensitivity, meta } = result
  const isEligible = eligibility.eligible
  const isInactive = meta.status !== 'active'
  const businessConcept = BUSINESS_CONCEPT_PROGRAMS[result.programId]

  return (
    <div className={styles.overlay} onClick={onClose} aria-hidden="true">
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`${province} ${stream} details`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.province}>{province}</span>
            <h2 className={styles.stream}>{stream}</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close details"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Status banner for closed/paused/redesigning */}
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
                {meta.status === 'closed' && 'This program is currently closed and not accepting applications.'}
                {meta.status === 'paused' && 'This program is temporarily suspended.'}
                {meta.status === 'redesigning' && 'This program is being redesigned. Requirements may change.'}
                {meta.statusNote ? ` ${meta.statusNote}` : ''}
              </span>
            </div>
          )}

          {/* Probability */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Selection Probability</h3>
            <ProbabilityBar
              percent={probability.percent}
              range={probability.range}
              tier={probability.tier}
              confidence={probability.confidence}
            />
            <p className={styles.explanation}>{probability.explanation}</p>
            {probability.caveats.length > 0 && (
              <ul className={styles.caveats}>
                {probability.caveats.map((caveat, idx) => (
                  <li key={idx} className={styles.caveat}>
                    {caveat}
                  </li>
                ))}
              </ul>
            )}
            {(probability.lastDrawDate || probability.lastDrawMinScore !== null) && (
              <div className={styles.drawDate}>
                {probability.lastDrawDate && (
                  <p>
                    Last draw: {new Date(probability.lastDrawDate).toLocaleDateString('en-CA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {probability.lastDrawMinScore !== null && (
                  <p>
                    Latest draw minimum score: <strong>{probability.lastDrawMinScore}</strong>
                    {isEligible && eligibility.score !== null && (
                      eligibility.score >= probability.lastDrawMinScore
                        ? <span style={{ color: '#059669', marginLeft: '6px' }}>&#10003; Your score exceeds the cutoff</span>
                        : <span style={{ color: '#dc2626', marginLeft: '6px' }}>&#9650; Your score is below the cutoff by {probability.lastDrawMinScore - eligibility.score} points</span>
                    )}
                  </p>
                )}
                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Based on {probability.dataPoints} historical draw{probability.dataPoints !== 1 ? 's' : ''} &middot; {probability.confidence} confidence
                </p>
              </div>
            )}
          </section>

          {/* Score breakdown (eligible only) */}
          {isEligible && eligibility.score !== null && eligibility.maxScore !== null && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Score Breakdown</h3>
              <ScoreBreakdown
                breakdown={eligibility.breakdown}
                totalScore={eligibility.score}
                maxScore={eligibility.maxScore}
              />
              {/* Business Concept note for programs with officer-assessed components */}
              {businessConcept && (
                <div className={styles.businessConceptNote}>
                  <strong>{businessConcept.label}</strong> — up to {businessConcept.maxPoints} points
                  are assessed by program officers based on your business plan, market research, and
                  proposed economic benefits. The score shown above includes an estimate for this
                  component based on your profile, but the actual score will be determined during
                  the application review.
                </div>
              )}
            </section>
          )}

          {/* Gap analysis (ineligible only) */}
          {!isEligible && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Gap Analysis</h3>
              <GapAnalysis
                disqualifiers={eligibility.disqualifiers}
                nearMisses={eligibility.nearMisses}
              />
            </section>
          )}

          {/* Sensitivity / improvements (eligible only) */}
          {isEligible && sensitivity.length > 0 && (
            <section className={styles.section}>
              <SensitivityTable items={sensitivity} />
            </section>
          )}

          {/* Official link */}
          {meta.officialUrl && (
            <section className={styles.section}>
              <a
                href={meta.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.officialLink}
              >
                View official program page ↗
              </a>
            </section>
          )}

          {/* Disclaimer */}
          <aside className={styles.disclaimer} role="note" aria-label="Disclaimer">
            This analysis is based on publicly available program information and
            historical draw data. It does not constitute legal immigration
            advice. Consult a licensed immigration consultant for personalized
            guidance.
          </aside>
        </div>
      </div>
    </div>
  )
}
