'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { ProgramResult } from '@/lib/types/results'
import { DisclaimerBanner } from '../shared'
import SummaryStats from './SummaryStats'
import ComparisonChart from './ComparisonChart'
import PathwayRecommendations from './PathwayRecommendations'
import ProgramCard from './ProgramCard'
import ProgramDetailModal from './ProgramDetailModal'
import styles from './ResultsDashboard.module.css'

/** Number of top programs to feature prominently */
const TOP_PICK_COUNT = 3

export interface ResultsDashboardProps {
  results: ProgramResult[]
  assessedAt: string
}

export default function ResultsDashboard({
  results,
  assessedAt,
}: ResultsDashboardProps) {
  const router = useRouter()
  const [activeModalId, setActiveModalId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'eligible' | 'ineligible'>('all')
  const [showAllOther, setShowAllOther] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Three-tier sort: eligible+active → eligible+inactive → ineligible
  const sortedResults = useMemo(
    () =>
      [...results].sort((a, b) => {
        const tierA = getTier(a)
        const tierB = getTier(b)
        if (tierA !== tierB) return tierA - tierB
        return b.probability.percent - a.probability.percent
      }),
    [results],
  )

  // ---- Top 3 picks: eligible + active programs only ----
  const topPicks = useMemo(() => {
    return sortedResults
      .filter((r) => r.eligibility.eligible && r.meta.status === 'active')
      .slice(0, TOP_PICK_COUNT)
  }, [sortedResults])

  const topPickIds = useMemo(
    () => new Set(topPicks.map((r) => r.programId)),
    [topPicks],
  )

  // ---- Remaining programs (everything not in top picks) ----
  const otherResults = useMemo(
    () => sortedResults.filter((r) => !topPickIds.has(r.programId)),
    [sortedResults, topPickIds],
  )

  const filteredOther = useMemo(() => {
    if (filter === 'eligible') return otherResults.filter((r) => r.eligibility.eligible)
    if (filter === 'ineligible') return otherResults.filter((r) => !r.eligibility.eligible)
    return otherResults
  }, [otherResults, filter])

  const activeResult = useMemo(
    () => sortedResults.find((r) => r.programId === activeModalId) ?? null,
    [sortedResults, activeModalId],
  )

  const eligibleCount = sortedResults.filter((r) => r.eligibility.eligible).length
  const otherEligibleCount = otherResults.filter((r) => r.eligibility.eligible).length
  const hasIneligible = sortedResults.some((r) => !r.eligibility.eligible)
  const formattedDate = formatDate(assessedAt)

  // ---- PDF download handler ----
  const handleDownloadPdf = useCallback(async () => {
    if (pdfLoading) return
    setPdfLoading(true)
    try {
      const response = await fetch('/api/assessment/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: sortedResults }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('PDF generation failed:', err)
        alert('Failed to generate PDF. Please try again.')
        return
      }

      // Create a blob from the response and trigger download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().split('T')[0]
      a.download = `genesislink-assessment-${date}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download error:', err)
      alert('An error occurred while generating the PDF. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }, [sortedResults, pdfLoading])

  // ---- Start over handler ----
  const handleStartOver = useCallback(() => {
    sessionStorage.removeItem('assessmentResults')
    sessionStorage.removeItem('assessmentAnswers')
    router.push('/assessment/questionnaire')
  }, [router])

  return (
    <div className={styles.dashboard}>
      {/* Page title */}
      <header className={styles.header}>
        <h1 className={styles.title}>Your Assessment Results</h1>
        <p className={styles.subtitle}>Assessed {formattedDate}</p>
      </header>

      {/* Summary stats bar */}
      <SummaryStats results={sortedResults} />

      {/* Disclaimer */}
      <DisclaimerBanner variant="banner" />

      {/* ========================================================= */}
      {/* TOP RECOMMENDATIONS — up to 3 best eligible active programs */}
      {/* ========================================================= */}
      {topPicks.length > 0 && (
        <section className={styles.topSection} aria-label="Top recommendations">
          <div className={styles.topSectionHeader}>
            <h2 className={styles.topSectionTitle}>
              <span className={styles.topIcon} aria-hidden="true">&#9733;</span>
              {' '}Your Top {topPicks.length === 1 ? 'Recommendation' : `${topPicks.length} Recommendations`}
            </h2>
            <p className={styles.topSectionSubtitle}>
              Based on your profile, these are your strongest pathways
            </p>
          </div>

          <div className={styles.topGrid} role="list" aria-label="Top program recommendations">
            {topPicks.map((result, index) => (
              <div key={result.programId} role="listitem" className={styles.topCardWrapper}>
                <div className={styles.rankBadge} aria-label={`Rank ${index + 1}`}>
                  #{index + 1}
                </div>
                <ProgramCard
                  result={result}
                  onViewDetails={() => setActiveModalId(result.programId)}
                  featured
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comparison chart — only show when there are eligible programs */}
      {eligibleCount > 0 && <ComparisonChart results={sortedResults} />}

      {/* Pathway recommendations — show when there are ineligible programs */}
      {hasIneligible && <PathwayRecommendations results={sortedResults} />}

      {/* ========================================================= */}
      {/* OTHER PROGRAMS — remaining eligible + all ineligible        */}
      {/* ========================================================= */}
      {otherResults.length > 0 && (
        <section className={styles.otherSection} aria-label="Other programs">
          <div className={styles.otherSectionHeader}>
            <h2 className={styles.otherSectionTitle}>
              Other Programs ({otherResults.length})
            </h2>
            {otherEligibleCount > 0 && (
              <span className={styles.otherEligibleNote}>
                {otherEligibleCount} also eligible
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className={styles.filterBar} role="tablist" aria-label="Filter other programs">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={`${styles.filterTab} ${filter === 'all' ? styles.filterActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({otherResults.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'eligible'}
              className={`${styles.filterTab} ${filter === 'eligible' ? styles.filterActive : ''}`}
              onClick={() => setFilter('eligible')}
            >
              Eligible ({otherEligibleCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'ineligible'}
              className={`${styles.filterTab} ${filter === 'ineligible' ? styles.filterActive : ''}`}
              onClick={() => setFilter('ineligible')}
            >
              Not Eligible ({otherResults.length - otherEligibleCount})
            </button>
          </div>

          {/* Program cards grid — show first 6 by default, expand on click */}
          <div className={styles.cardGrid} role="list" aria-label="Other program results">
            {(showAllOther ? filteredOther : filteredOther.slice(0, 6)).map((result) => (
              <div key={result.programId} role="listitem">
                <ProgramCard
                  result={result}
                  onViewDetails={() => setActiveModalId(result.programId)}
                />
              </div>
            ))}
          </div>

          {filteredOther.length === 0 && (
            <p className={styles.empty}>
              No programs match the selected filter.
            </p>
          )}

          {!showAllOther && filteredOther.length > 6 && (
            <button
              type="button"
              className={styles.showMoreButton}
              onClick={() => setShowAllOther(true)}
            >
              Show {filteredOther.length - 6} More Programs
            </button>
          )}
        </section>
      )}

      {/* Bottom CTAs */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
        </button>
        <a
          href="/contact"
          className={styles.primaryAction}
        >
          Book Consultation
        </a>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={handleStartOver}
        >
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

function getTier(result: ProgramResult): number {
  if (!result.eligibility.eligible) return 2
  if (result.meta.status === 'active') return 0
  return 1
}

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
