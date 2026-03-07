'use client'

import { useState, useMemo } from 'react'
import type { ProgramResult } from '@/lib/types/results'
import { DisclaimerBanner } from '../shared'
import ProgramCard from './ProgramCard'
import ProgramDetailModal from './ProgramDetailModal'
import styles from './ResultsDashboard.module.css'

export interface ResultsDashboardProps {
  results: ProgramResult[]
  assessedAt: string
}

export default function ResultsDashboard({
  results,
  assessedAt,
}: ResultsDashboardProps) {
  const [activeModalId, setActiveModalId] = useState<string | null>(null)

  // Sort by probability descending
  const sortedResults = useMemo(
    () => [...results].sort((a, b) => b.probability.percent - a.probability.percent),
    [results],
  )

  const activeResult = useMemo(
    () => sortedResults.find((r) => r.programId === activeModalId) ?? null,
    [sortedResults, activeModalId],
  )

  const eligibleCount = sortedResults.filter((r) => r.eligibility.eligible).length
  const formattedDate = formatDate(assessedAt)

  return (
    <div className={styles.dashboard}>
      {/* Summary header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Your Assessment Results</h1>
        <p className={styles.subtitle}>
          {sortedResults.length} program{sortedResults.length !== 1 ? 's' : ''} evaluated
          {' '}&middot;{' '}
          {eligibleCount} eligible
          {' '}&middot;{' '}
          Assessed {formattedDate}
        </p>
      </header>

      {/* Disclaimer */}
      <DisclaimerBanner variant="banner" />

      {/* Program cards */}
      <div className={styles.cardList} role="list" aria-label="Program results">
        {sortedResults.map((result) => (
          <div key={result.programId} role="listitem">
            <ProgramCard
              result={result}
              onViewDetails={() => setActiveModalId(result.programId)}
            />
          </div>
        ))}
      </div>

      {sortedResults.length === 0 && (
        <p className={styles.empty}>
          No programs could be evaluated. Please verify your assessment answers
          and try again.
        </p>
      )}

      {/* Bottom CTAs */}
      <div className={styles.actions}>
        <button type="button" className={styles.primaryAction}>
          Download PDF
        </button>
        <button type="button" className={styles.primaryAction}>
          Book Consultation
        </button>
        <button type="button" className={styles.secondaryAction}>
          Start Over
        </button>
      </div>

      {/* Detail modal */}
      {activeResult && (
        <ProgramDetailModal
          result={activeResult}
          isOpen={activeModalId !== null}
          onClose={() => setActiveModalId(null)}
        />
      )}
    </div>
  )
}

/** Format an ISO date string into a readable format */
function formatDate(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
