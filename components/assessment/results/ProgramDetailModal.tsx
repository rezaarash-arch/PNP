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
  const { eligibility, probability, sensitivity } = result
  const isEligible = eligibility.eligible

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
            {probability.lastDrawDate && (
              <p className={styles.drawDate}>
                Last draw: {probability.lastDrawDate}
              </p>
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
