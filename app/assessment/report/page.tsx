'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AIAnalysis, ProgramAnalysis } from '@/lib/ai/types'
import type { ProgramResult } from '@/lib/types/results'
import styles from './page.module.css'

/* ------------------------------------------------------------------ */
/*  Program display-name map (local copy from ProgramCard)             */
/* ------------------------------------------------------------------ */
const PROGRAM_DISPLAY: Record<string, { province: string; stream: string }> = {
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
  'fed-start-up-visa': { province: 'Federal', stream: 'Start-Up Visa' },
  'fed-self-employed': { province: 'Federal', stream: 'Self-Employed Persons' },
}

function displayName(id: string): { province: string; stream: string } {
  const known = PROGRAM_DISPLAY[id]
  if (known) return known
  const parts = id.split('-')
  const province = (parts[0] ?? id).toUpperCase()
  const stream = parts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return { province, stream: stream || 'General' }
}

/* ------------------------------------------------------------------ */
/*  Sort helpers for the matrix table                                  */
/* ------------------------------------------------------------------ */
type SortKey = 'province' | 'stream' | 'status' | 'eligible' | 'score' | 'probability' | 'tier'
type SortDir = 'asc' | 'desc'

const TIER_ORDER: Record<string, number> = {
  strong: 1,
  competitive: 2,
  moderate: 3,
  low: 4,
  unlikely: 5,
  ineligible: 6,
}

function getSortValue(r: ProgramResult, key: SortKey): string | number {
  const d = displayName(r.programId)
  switch (key) {
    case 'province': return d.province
    case 'stream': return d.stream
    case 'status': return r.meta.status
    case 'eligible': return r.eligibility.eligible ? 0 : 1
    case 'score': return r.eligibility.eligible ? (r.eligibility.score ?? 0) : -1
    case 'probability': return r.probability.percent
    case 'tier': return TIER_ORDER[r.probability.tier] ?? 99
  }
}

/* ================================================================== */
/*  Report Page Component                                              */
/* ================================================================== */
export default function ReportPage() {
  const router = useRouter()

  const [results, setResults] = useState<ProgramResult[] | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [timestamp, setTimestamp] = useState<string>('')

  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(true)
  const [analysisError, setAnalysisError] = useState(false)

  const [pdfLoading, setPdfLoading] = useState(false)

  const [sortKey, setSortKey] = useState<SortKey>('probability')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  /* ---- Hydrate from sessionStorage ---- */
  useEffect(() => {
    const storedResults = sessionStorage.getItem('assessmentResults')
    const storedProfile = sessionStorage.getItem('assessmentProfile')
    if (!storedResults && !storedProfile) {
      router.push('/assessment/questionnaire')
      return
    }
    if (storedResults) {
      const parsed = JSON.parse(storedResults) as { results: ProgramResult[]; meta: { timestamp: string } }
      setResults(parsed.results)
      setTimestamp(parsed.meta?.timestamp ?? new Date().toISOString())
    }
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile) as Record<string, unknown>)
    }
  }, [router])

  /* ---- Fetch / cache AI analysis ---- */
  const fetchAnalysis = useCallback(async (signal?: AbortSignal) => {
    setAnalysisLoading(true)
    setAnalysisError(false)

    // Check cache first
    const cached = sessionStorage.getItem('aiAnalysis')
    if (cached) {
      try {
        setAnalysis(JSON.parse(cached) as AIAnalysis)
        setAnalysisLoading(false)
        return
      } catch { /* fall through to fetch */ }
    }

    if (!profile || !results) {
      setAnalysisLoading(false)
      return
    }

    try {
      const res = await fetch('/api/assessment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, results }),
        signal,
      })
      if (!res.ok) throw new Error('API error')
      const data: AIAnalysis = await res.json()
      if (!signal?.aborted) {
        setAnalysis(data)
        sessionStorage.setItem('aiAnalysis', JSON.stringify(data))
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!signal?.aborted) setAnalysisError(true)
    } finally {
      if (!signal?.aborted) setAnalysisLoading(false)
    }
  }, [profile, results])

  useEffect(() => {
    if (!results) return
    const controller = new AbortController()
    fetchAnalysis(controller.signal)
    return () => controller.abort()
  }, [fetchAnalysis, results])

  /* ---- Derived data ---- */
  const topPicks = useMemo(() => {
    if (!results) return []
    return results
      .filter((r) => r.eligibility.eligible && r.meta.status === 'active')
      .sort((a, b) => b.probability.percent - a.probability.percent)
      .slice(0, 3)
  }, [results])

  const analysisMap = useMemo(() => {
    const m = new Map<string, ProgramAnalysis>()
    if (analysis) {
      for (const pa of analysis.programAnalyses) {
        m.set(pa.programId, pa)
      }
    }
    return m
  }, [analysis])

  const sortedResults = useMemo(() => {
    if (!results) return []
    return [...results].sort((a, b) => {
      const aVal = getSortValue(a, sortKey)
      const bVal = getSortValue(b, sortKey)
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [results, sortKey, sortDir])

  /* ---- Handlers ---- */
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'province' || key === 'stream' || key === 'status' ? 'asc' : 'desc')
    }
  }

  async function handleDownloadPdf() {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/assessment/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, results }),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `genesislink-intelligence-report-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  function handleRetry() {
    sessionStorage.removeItem('aiAnalysis')
    fetchAnalysis()
  }

  /* ---- Loading gate ---- */
  if (!results) {
    return (
      <main className={styles.reportPage}>
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '4rem 0' }}>Loading...</p>
      </main>
    )
  }

  /* ---- Render helpers ---- */
  function renderSortArrow(key: SortKey) {
    if (sortKey !== key) return <span className={styles.sortArrow}>&#9650;</span>
    return (
      <span className={styles.sortArrowActive}>
        {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
      </span>
    )
  }

  function rowClass(r: ProgramResult): string {
    const classes = [styles.matrixRow]
    if (r.eligibility.eligible && r.meta.status === 'active') classes.push(styles.eligible)
    else if (!r.eligibility.eligible) classes.push(styles.ineligible)
    else if (r.meta.status === 'paused' || r.meta.status === 'closed') classes.push(styles.paused)
    return classes.join(' ')
  }

  function tierClass(tier: string): string {
    const map: Record<string, string> = {
      strong: styles.tier_strong,
      competitive: styles.tier_competitive,
      moderate: styles.tier_moderate,
      low: styles.tier_low,
      unlikely: styles.tier_unlikely,
      ineligible: styles.tier_ineligible,
    }
    return `${styles.tierBadge} ${map[tier] ?? ''}`
  }

  function statusClass(status: string): string {
    const map: Record<string, string> = {
      active: styles.statusActive,
      paused: styles.statusPaused,
      closed: styles.statusClosed,
      redesigning: styles.statusRedesigning,
    }
    return map[status] ?? ''
  }

  const preparedDate = timestamp
    ? new Date(timestamp).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className={styles.reportPage}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>GenesisLink Business Immigration Report</h1>
          <p className={styles.subtitle}>Prepared on {preparedDate}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.downloadButton} onClick={handleDownloadPdf} disabled={pdfLoading || !analysis}>
            {pdfLoading ? 'Generating PDF...' : '\u{1F4C4} Download PDF'}
          </button>
          <Link href="/assessment/results" className={styles.backLink}>
            &larr; Back to Results
          </Link>
        </div>
      </header>

      {/* ===== EXECUTIVE SUMMARY ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Executive Summary</h2>
        <div className={styles.summaryCard}>
          {analysisLoading ? (
            <>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
            </>
          ) : analysisError || !analysis ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>AI analysis temporarily unavailable</p>
              <button type="button" className={styles.retryButton} onClick={handleRetry}>Retry</button>
            </div>
          ) : (
            <p>{analysis.executiveSummary}</p>
          )}
        </div>
      </section>

      {/* ===== TOP 3 RECOMMENDATIONS ===== */}
      {topPicks.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Top Recommendations</h2>
          <div className={styles.topRecommendations}>
            {topPicks.map((r, i) => {
              const d = displayName(r.programId)
              const pa = analysisMap.get(r.programId)
              const score = r.eligibility.eligible ? r.eligibility.score : null
              const maxScore = r.eligibility.eligible ? r.eligibility.maxScore : null
              return (
                <div key={r.programId} className={styles.recommendationCard}>
                  <div className={styles.recHeader}>
                    <span className={styles.recRank}>{i + 1}</span>
                    <div>
                      <span className={styles.recProvince}>{d.province}</span>
                      <h3 className={styles.recName}>{d.stream}</h3>
                    </div>
                  </div>

                  <div className={styles.recStats}>
                    <span>Probability: <span className={styles.recStatValue}>{r.probability.percent}%</span></span>
                    {score !== null && maxScore !== null && (
                      <span>Score: <span className={styles.recStatValue}>{score}/{maxScore}</span></span>
                    )}
                  </div>

                  {pa && (
                    <>
                      <span
                        className={`${styles.fitBadge} ${
                          pa.strategicFit === 'strong'
                            ? styles.fit_strong
                            : pa.strategicFit === 'moderate'
                              ? styles.fit_moderate
                              : styles.fit_weak
                        }`}
                      >
                        {pa.strategicFit} fit
                      </span>
                      <p className={styles.recNarrative}>{pa.narrative}</p>
                      {pa.risks.length > 0 && (
                        <ul className={styles.recRisks}>
                          {pa.risks.map((risk, j) => <li key={j}>{risk}</li>)}
                        </ul>
                      )}
                      <span className={styles.recTimeline}>{pa.timeline}</span>
                    </>
                  )}

                  {!pa && analysisLoading && (
                    <>
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLine} />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ===== STRATEGIC ROADMAP ===== */}
      {analysis && analysis.strategicRoadmap.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Strategic Roadmap</h2>
          <div className={styles.roadmapTimeline}>
            {analysis.strategicRoadmap.map((phase, i) => (
              <div key={i} className={styles.phase}>
                <h4 className={styles.phaseTitle}>{phase.phase}</h4>
                <ul className={styles.phaseActions}>
                  {phase.actions.map((action, j) => <li key={j}>{action}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== IMPROVEMENT PRIORITIES ===== */}
      {analysis && analysis.improvementPriorities.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Improvement Priorities</h2>
          <div className={styles.improvementsGrid}>
            {analysis.improvementPriorities.map((item, i) => (
              <div key={i} className={styles.improvementCard}>
                <div className={styles.improvementHeader}>
                  <span className={styles.improvementField}>{item.field}</span>
                  <span
                    className={`${styles.effortBadge} ${
                      item.effort === 'low'
                        ? styles.effort_low
                        : item.effort === 'medium'
                          ? styles.effort_medium
                          : styles.effort_high
                    }`}
                  >
                    {item.effort} effort
                  </span>
                </div>
                <p className={styles.improvementRec}>{item.recommendation}</p>
                <p className={styles.improvementImpact}>Impact: {item.impact}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== RISK FACTORS ===== */}
      {analysis && analysis.riskFactors.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Risk Factors</h2>
          <ul className={styles.riskList}>
            {analysis.riskFactors.map((risk, i) => (
              <li key={i} className={styles.riskItem}>{risk}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ===== FULL PROGRAM MATRIX ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Full Program Matrix</h2>
        <div className={styles.matrixWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr className={styles.matrixHeader}>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('province')}>Province {renderSortArrow('province')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('stream')}>Stream {renderSortArrow('stream')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('status')}>Status {renderSortArrow('status')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('eligible')}>Eligible? {renderSortArrow('eligible')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('score')}>Score {renderSortArrow('score')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('probability')}>Probability {renderSortArrow('probability')}</button></th>
                <th className={styles.lastDrawCol}>Last Draw</th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('tier')}>Tier {renderSortArrow('tier')}</button></th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r) => {
                const d = displayName(r.programId)
                const score = r.eligibility.eligible ? r.eligibility.score : null
                const maxScore = r.eligibility.eligible ? r.eligibility.maxScore : null
                return (
                  <tr key={r.programId} className={rowClass(r)}>
                    <td>{d.province}</td>
                    <td>{d.stream}</td>
                    <td><span className={statusClass(r.meta.status)}>{r.meta.status}</span></td>
                    <td>{r.eligibility.eligible ? 'Yes' : 'No'}</td>
                    <td>{score !== null && maxScore !== null ? `${score}/${maxScore}` : '\u2014'}</td>
                    <td>{r.probability.percent}%</td>
                    <td className={styles.lastDrawCol}>
                      {r.probability.lastDrawDate
                        ? new Date(r.probability.lastDrawDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '\u2014'}
                      {r.probability.lastDrawMinScore != null && (
                        <span className={styles.lastDrawScore}> (min: {r.probability.lastDrawMinScore})</span>
                      )}
                    </td>
                    <td><span className={tierClass(r.probability.tier)}>{r.probability.tier}</span></td>
                    <td>
                      {r.meta.officialUrl ? (
                        <a href={r.meta.officialUrl} target="_blank" rel="noopener noreferrer" className={styles.programLink}>
                          View &#8599;
                        </a>
                      ) : '\u2014'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== CONSULTATION CTA ===== */}
      <section className={styles.section}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Ready to Take the Next Step?</h2>
          <p className={styles.ctaText}>
            Book a personalized consultation with a regulated Canadian immigration consultant
            to discuss your results and develop a tailored strategy.
          </p>
          <a
            href="https://genesislink.co/consultation"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            Book a Consultation
          </a>
        </div>
      </section>

      {/* ===== DISCLAIMER ===== */}
      <footer className={styles.disclaimer}>
        This analysis does not constitute legal immigration advice. All information is based on
        publicly available program criteria and may change without notice. Consult a regulated
        Canadian immigration consultant (RCIC) or lawyer before making immigration decisions.
        GenesisLink provides informational tools only and is not responsible for application outcomes.
      </footer>
    </main>
  )
}
