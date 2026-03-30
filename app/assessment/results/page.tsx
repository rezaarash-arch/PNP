'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { AIAnalysis, ProgramAnalysis } from '@/lib/ai/types'
import type { ProgramResult } from '@/lib/types/results'
import styles from '../report/page.module.css'

/* ------------------------------------------------------------------ */
/*  Program display-name map                                           */
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
/*  Progress bar stages                                                */
/* ------------------------------------------------------------------ */
const STAGES = [
  { label: 'Analyzing your profile...', target: 15, durationMs: 2000 },
  { label: 'Evaluating eligibility across 21 programs...', target: 35, durationMs: 3000 },
  { label: 'Calculating selection probabilities...', target: 55, durationMs: 3000 },
  { label: 'Generating strategic recommendations...', target: 75, durationMs: 3000 },
  { label: 'Preparing your intelligence report...', target: 90, durationMs: 2000 },
]

/* ------------------------------------------------------------------ */
/*  Sort helpers for matrix table                                      */
/* ------------------------------------------------------------------ */
type SortKey = 'province' | 'stream' | 'status' | 'eligible' | 'score' | 'probability' | 'tier'
type SortDir = 'asc' | 'desc'

const TIER_ORDER: Record<string, number> = {
  strong: 1, competitive: 2, moderate: 3, low: 4, unlikely: 5, ineligible: 6,
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
/*  Results Page Component                                             */
/* ================================================================== */
export default function ResultsPage() {
  const router = useRouter()

  // Data
  const [results, setResults] = useState<ProgramResult[] | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [contactInfo, setContactInfo] = useState<{ fullName: string; email: string; phone: string } | null>(null)
  const [timestamp, setTimestamp] = useState('')

  // AI analysis
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState(false)

  // Progress bar
  const [progress, setProgress] = useState(0)
  const [stageLabel, setStageLabel] = useState(STAGES[0].label)
  const [reportReady, setReportReady] = useState(false)
  const apiDoneRef = useRef(false)

  // PDF
  const [pdfLoading, setPdfLoading] = useState(false)

  // Matrix sort
  const [sortKey, setSortKey] = useState<SortKey>('probability')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  /* ---- Hydrate from sessionStorage ---- */
  useEffect(() => {
    const storedResults = sessionStorage.getItem('assessmentResults')
    const storedProfile = sessionStorage.getItem('assessmentProfile')
    const storedContact = sessionStorage.getItem('contactInfo')
    if (!storedResults) {
      router.push('/assessment/questionnaire')
      return
    }
    const parsed = JSON.parse(storedResults) as { results: ProgramResult[]; meta: { timestamp: string } }
    setResults(parsed.results)
    setTimestamp(parsed.meta?.timestamp ?? new Date().toISOString())
    if (storedProfile) setProfile(JSON.parse(storedProfile))
    if (storedContact) setContactInfo(JSON.parse(storedContact))
  }, [router])

  /* ---- Fetch AI analysis ---- */
  const fetchAnalysis = useCallback(async (signal?: AbortSignal) => {
    if (!profile || !results) return

    // Check cache
    const cached = sessionStorage.getItem('aiAnalysis')
    if (cached) {
      try {
        setAnalysis(JSON.parse(cached) as AIAnalysis)
        apiDoneRef.current = true
        return
      } catch { /* fall through */ }
    }

    try {
      const res = await fetch('/api/assessment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, results }),
        signal,
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (!signal?.aborted) {
        const analysisData = data.analysis as AIAnalysis
        setAnalysis(analysisData)
        sessionStorage.setItem('aiAnalysis', JSON.stringify(analysisData))
        apiDoneRef.current = true
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!signal?.aborted) {
        setAnalysisError(true)
        apiDoneRef.current = true
      }
    }
  }, [profile, results])

  useEffect(() => {
    if (!results || !profile) return
    const controller = new AbortController()
    fetchAnalysis(controller.signal)
    return () => controller.abort()
  }, [fetchAnalysis, results, profile])

  /* ---- Animated progress bar ---- */
  useEffect(() => {
    if (!results) return
    let currentStage = 0
    let animFrame: number
    let startTime = Date.now()

    function tick() {
      const stage = STAGES[currentStage]
      if (!stage) return

      const elapsed = Date.now() - startTime
      const prevTarget = currentStage > 0 ? STAGES[currentStage - 1].target : 0
      const range = stage.target - prevTarget
      const fraction = Math.min(elapsed / stage.durationMs, 1)
      const currentProgress = prevTarget + range * easeOutCubic(fraction)

      setProgress(Math.round(currentProgress))
      setStageLabel(stage.label)

      if (fraction >= 1) {
        currentStage++
        startTime = Date.now()
        if (currentStage >= STAGES.length) {
          // Hold at 90% until API finishes
          const waitForApi = () => {
            if (apiDoneRef.current) {
              setProgress(100)
              setStageLabel('Report ready!')
              setTimeout(() => setReportReady(true), 600)
            } else {
              animFrame = requestAnimationFrame(waitForApi)
            }
          }
          waitForApi()
          return
        }
      }
      animFrame = requestAnimationFrame(tick)
    }

    animFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrame)
  }, [results])

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
      for (const pa of analysis.programAnalyses) m.set(pa.programId, pa)
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
    setAnalysisError(false)
    apiDoneRef.current = false
    fetchAnalysis()
  }

  /* ---- Render helpers ---- */
  function renderSortArrow(key: SortKey) {
    if (sortKey !== key) return <span className={styles.sortArrow}>&#9650;</span>
    return <span className={styles.sortArrowActive}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
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
      strong: styles.tier_strong, competitive: styles.tier_competitive,
      moderate: styles.tier_moderate, low: styles.tier_low,
      unlikely: styles.tier_unlikely, ineligible: styles.tier_ineligible,
    }
    return `${styles.tierBadge} ${map[tier] ?? ''}`
  }

  function statusClass(status: string): string {
    const map: Record<string, string> = {
      active: styles.statusActive, paused: styles.statusPaused,
      closed: styles.statusClosed, redesigning: styles.statusRedesigning,
    }
    return map[status] ?? ''
  }

  /* ---- Loading gate ---- */
  if (!results) {
    return (
      <main style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p style={{ color: '#93a0a9' }}>Loading...</p>
      </main>
    )
  }

  /* ==================================================================
     PHASE 1: Circular Progress Gauge
     ================================================================== */
  if (!reportReady) {
    const SIZE = 220
    const STROKE = 10
    const RADIUS = (SIZE - STROKE) / 2
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS
    const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE

    // Determine current stage index for step indicators
    const currentStageIdx = STAGES.findIndex((s) => s.target > progress)
    const activeStage = currentStageIdx === -1 ? STAGES.length - 1 : currentStageIdx

    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          fontFamily: "var(--font-body, 'Nunito', sans-serif)",
          background: 'linear-gradient(135deg, #0a1628 0%, #0f2744 50%, #0a1628 100%)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '520px', textAlign: 'center' }}>
          {/* Logo */}
          <h1
            style={{
              fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '2.5rem',
            }}
          >
            GenesisLink
          </h1>

          {/* Circular gauge */}
          <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto 2rem' }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {/* Outer glow */}
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0099cc" />
                  <stop offset="50%" stopColor="#00c2ff" />
                  <stop offset="100%" stopColor="#00e5ff" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="innerShadow">
                  <feGaussianBlur stdDeviation="2" />
                  <feComposite operator="out" in2="SourceGraphic" />
                </filter>
              </defs>

              {/* Background track */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={STROKE}
              />

              {/* Tick marks */}
              {Array.from({ length: 40 }).map((_, i) => {
                const angle = (i / 40) * 360 - 90
                const rad = (angle * Math.PI) / 180
                const innerR = RADIUS - STROKE / 2 - 4
                const outerR = RADIUS - STROKE / 2 - (i % 5 === 0 ? 12 : 8)
                return (
                  <line
                    key={i}
                    x1={SIZE / 2 + innerR * Math.cos(rad)}
                    y1={SIZE / 2 + innerR * Math.sin(rad)}
                    x2={SIZE / 2 + outerR * Math.cos(rad)}
                    y2={SIZE / 2 + outerR * Math.sin(rad)}
                    stroke={
                      (i / 40) * 100 <= progress
                        ? 'rgba(0,194,255,0.4)'
                        : 'rgba(255,255,255,0.08)'
                    }
                    strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
                    strokeLinecap="round"
                  />
                )
              })}

              {/* Progress arc */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                filter="url(#glow)"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: 'stroke-dashoffset 0.3s ease-out',
                }}
              />

              {/* Leading dot */}
              {progress > 0 && progress < 100 && (() => {
                const angle = ((progress / 100) * 360 - 90) * (Math.PI / 180)
                return (
                  <circle
                    cx={SIZE / 2 + RADIUS * Math.cos(angle)}
                    cy={SIZE / 2 + RADIUS * Math.sin(angle)}
                    r={4}
                    fill="#00e5ff"
                    filter="url(#glow)"
                  />
                )
              })()}
            </svg>

            {/* Center content */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '3.2rem',
                  fontWeight: 800,
                  fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                  background: 'linear-gradient(135deg, #00c2ff, #00e5ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                }}
              >
                {progress}
              </span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: '0.15rem',
                  letterSpacing: '0.05em',
                }}
              >
                PERCENT
              </span>
            </div>
          </div>

          {/* Stage label */}
          <p
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: '1.5rem',
              minHeight: '1.5em',
            }}
          >
            {stageLabel}
          </p>

          {/* Step indicators */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
            }}
          >
            {STAGES.map((stage, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: i <= activeStage ? 32 : 24,
                    height: 4,
                    borderRadius: 2,
                    background:
                      i < activeStage
                        ? 'linear-gradient(90deg, #0099cc, #00c2ff)'
                        : i === activeStage
                          ? 'linear-gradient(90deg, #0099cc, rgba(0,194,255,0.5))'
                          : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.4s ease',
                    boxShadow:
                      i <= activeStage
                        ? '0 0 8px rgba(0,153,204,0.4)'
                        : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Subtext */}
          <p
            style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.35)',
              lineHeight: 1.6,
              maxWidth: '360px',
              margin: '0 auto',
            }}
          >
            Our AI agent is analyzing your profile against all 21 Canadian
            provincial entrepreneur programs
          </p>
        </div>
      </main>
    )
  }

  /* ==================================================================
     PHASE 2: AI Intelligence Report
     ================================================================== */
  const preparedDate = timestamp
    ? new Date(timestamp).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const clientName = contactInfo?.fullName ?? 'Candidate'

  return (
    <main className={styles.reportPage}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>GenesisLink Intelligence Report</h1>
          <p className={styles.subtitle}>
            Prepared for {clientName} &middot; {preparedDate}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.downloadButton}
            onClick={handleDownloadPdf}
            disabled={pdfLoading || !analysis}
          >
            {pdfLoading ? 'Generating PDF...' : '\u{1F4C4} Download PDF'}
          </button>
        </div>
      </header>

      {/* ===== ERROR STATE ===== */}
      {analysisError && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>AI analysis temporarily unavailable</p>
          <button type="button" className={styles.retryButton} onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* ===== EXECUTIVE SUMMARY ===== */}
      {analysis && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Executive Summary</h2>
          <div className={styles.summaryCard}>
            <p>{analysis.executiveSummary}</p>
          </div>
        </section>
      )}

      {/* ===== TOP RECOMMENDATIONS ===== */}
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
                      <span className={`${styles.fitBadge} ${
                        pa.strategicFit === 'strong' ? styles.fit_strong
                          : pa.strategicFit === 'moderate' ? styles.fit_moderate
                            : styles.fit_weak
                      }`}>
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
                  <span className={`${styles.effortBadge} ${
                    item.effort === 'low' ? styles.effort_low
                      : item.effort === 'medium' ? styles.effort_medium
                        : styles.effort_high
                  }`}>
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
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('tier')}>Tier {renderSortArrow('tier')}</button></th>
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
                    <td><span className={tierClass(r.probability.tier)}>{r.probability.tier}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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

/* ---- Easing function ---- */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
