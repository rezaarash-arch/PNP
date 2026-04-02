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

  // Stats for the banner
  const stats = useMemo(() => {
    if (!results) return { eligible: 0, total: 0, bestProb: 0, bestProvince: '', activeCount: 0 }
    const eligible = results.filter((r) => r.eligibility.eligible)
    const active = results.filter((r) => r.meta.status === 'active')
    const best = eligible.length > 0
      ? eligible.reduce((a, b) => a.probability.percent > b.probability.percent ? a : b)
      : null
    return {
      eligible: eligible.length,
      total: results.length,
      bestProb: best?.probability.percent ?? 0,
      bestProvince: best ? displayName(best.programId).province : '—',
      activeCount: active.length,
    }
  }, [results])

  // Tier distribution for eligibility chart
  const tierDistribution = useMemo(() => {
    if (!results) return []
    const counts: Record<string, number> = {}
    for (const r of results) {
      counts[r.probability.tier] = (counts[r.probability.tier] ?? 0) + 1
    }
    return [
      { tier: 'strong', count: counts['strong'] ?? 0, color: '#34d399' },
      { tier: 'competitive', count: counts['competitive'] ?? 0, color: '#22d3ee' },
      { tier: 'moderate', count: counts['moderate'] ?? 0, color: '#fbbf24' },
      { tier: 'low', count: counts['low'] ?? 0, color: '#fb7185' },
      { tier: 'unlikely', count: counts['unlikely'] ?? 0, color: '#64748b' },
      { tier: 'ineligible', count: counts['ineligible'] ?? 0, color: '#334155' },
    ].filter((d) => d.count > 0)
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
     PHASE 2: AI Business Immigration Report
     ================================================================== */
  const preparedDate = timestamp
    ? new Date(timestamp).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const clientName = contactInfo?.fullName ?? 'Candidate'

  // Donut chart colors per rank
  const RANK_COLORS = ['#34d399', '#fbbf24', '#22d3ee']

  return (
    <main className={styles.reportPage}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>GenesisLink Business Immigration Report</h1>
          <p className={styles.subtitle}>
            Prepared for <strong style={{ color: '#e2e8f0' }}>{clientName}</strong> &middot; {preparedDate}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.downloadButton}
            onClick={handleDownloadPdf}
            disabled={pdfLoading || !analysis}
          >
            {pdfLoading ? 'Generating...' : '📄 Download PDF'}
          </button>
        </div>
      </header>

      {/* ===== STATS BANNER ===== */}
      <div className={styles.statsBanner}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Eligible Programs</span>
          <span className={styles.statValue}>{stats.eligible}<span style={{ fontSize: '0.9rem', color: '#5a6a7a', fontWeight: 500 }}>/{stats.total}</span></span>
          <span className={styles.statNote}>programs matched</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Best Probability</span>
          <span className={styles.statValue}>{stats.bestProb}%</span>
          <span className={styles.statNote}>selection chance</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Top Province</span>
          <span className={styles.statValue} style={{ fontSize: '1.35rem' }}>{stats.bestProvince}</span>
          <span className={styles.statNote}>highest match</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Programs</span>
          <span className={styles.statValue}>{stats.activeCount}</span>
          <span className={styles.statNote}>currently accepting</span>
        </div>
      </div>

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

      {/* ===== TOP RECOMMENDATIONS with DONUT CHARTS ===== */}
      {topPicks.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Top Recommendations</h2>
          <div className={styles.topRecommendations}>
            {topPicks.map((r, i) => {
              const d = displayName(r.programId)
              const pa = analysisMap.get(r.programId)
              const score = r.eligibility.eligible ? r.eligibility.score : null
              const maxScore = r.eligibility.eligible ? r.eligibility.maxScore : null
              const pct = r.probability.percent
              const donutColor = RANK_COLORS[i] ?? '#22d3ee'

              // SVG donut params
              const DR = 32
              const DS = 5
              const DCIRC = 2 * Math.PI * (DR - DS)
              const donutOffset = DCIRC - (pct / 100) * DCIRC

              return (
                <div key={r.programId} className={styles.recommendationCard}>
                  <div className={styles.recHeader}>
                    <span className={styles.recRank}>{i + 1}</span>
                    <div>
                      <span className={styles.recProvince}>{d.province}</span>
                      <h3 className={styles.recName}>{d.stream}</h3>
                    </div>
                  </div>

                  {/* Donut chart + score */}
                  <div className={styles.recChartRow}>
                    <svg width={DR * 2} height={DR * 2} viewBox={`0 0 ${DR * 2} ${DR * 2}`}>
                      <circle cx={DR} cy={DR} r={DR - DS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={DS} />
                      <circle
                        cx={DR} cy={DR} r={DR - DS} fill="none"
                        stroke={donutColor} strokeWidth={DS}
                        strokeDasharray={DCIRC} strokeDashoffset={donutOffset}
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                      <text x={DR} y={DR + 1} textAnchor="middle" dominantBaseline="middle"
                        fill="#fff" fontSize="13" fontWeight="800" fontFamily="Outfit, sans-serif">
                        {pct}%
                      </text>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span className={styles.recChartLabelTitle}>Probability</span>
                      {score !== null && maxScore !== null && (
                        <span style={{ fontSize: '0.75rem', color: '#5a6a7a' }}>
                          Score: <strong style={{ color: '#e2e8f0' }}>{score}/{maxScore}</strong>
                        </span>
                      )}
                    </div>
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

      {/* ===== ELIGIBILITY OVERVIEW PIE CHART ===== */}
      {tierDistribution.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Eligibility Overview</h2>
          <div className={styles.eligibilityOverview}>
            <div className={styles.eligPieArea}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                {(() => {
                  const total = tierDistribution.reduce((s, d) => s + d.count, 0)
                  let cumulativeAngle = -90
                  return tierDistribution.map((d, idx) => {
                    const angle = (d.count / total) * 360
                    const startAngle = cumulativeAngle
                    cumulativeAngle += angle
                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = ((startAngle + angle) * Math.PI) / 180
                    const largeArc = angle > 180 ? 1 : 0
                    const cx = 80, cy = 80, r = 60
                    const x1 = cx + r * Math.cos(startRad)
                    const y1 = cy + r * Math.sin(startRad)
                    const x2 = cx + r * Math.cos(endRad)
                    const y2 = cy + r * Math.sin(endRad)
                    const pathD = total === d.count
                      ? `M ${cx},${cy - r} A ${r},${r} 0 1 1 ${cx - 0.01},${cy - r} Z`
                      : `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`
                    return <path key={idx} d={pathD} fill={d.color} opacity={0.85} />
                  })
                })()}
                <circle cx="80" cy="80" r="36" fill="#06101c" />
                <text x="80" y="76" textAnchor="middle" dominantBaseline="middle"
                  fill="#fff" fontSize="22" fontWeight="800" fontFamily="Outfit, sans-serif">
                  {stats.eligible}
                </text>
                <text x="80" y="95" textAnchor="middle" dominantBaseline="middle"
                  fill="#5a6a7a" fontSize="9" fontWeight="600" fontFamily="DM Sans, sans-serif"
                  style={{ letterSpacing: '0.08em' }}>
                  ELIGIBLE
                </text>
              </svg>
            </div>
            <div className={styles.eligLegend}>
              {tierDistribution.map((d) => (
                <div key={d.tier} className={styles.eligLegendItem}>
                  <span className={styles.eligLegendDot} style={{ background: d.color }} />
                  <span className={styles.eligLegendLabel} style={{ textTransform: 'capitalize' }}>{d.tier}</span>
                  <span className={styles.eligLegendCount}>{d.count}</span>
                </div>
              ))}
            </div>
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

      {/* ===== FULL PROGRAM MATRIX with VISUAL BARS ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Full Program Matrix</h2>
        <div className={styles.matrixWrapper}>
          <table className={styles.matrixTable}>
            <thead>
              <tr className={styles.matrixHeader}>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('province')}>Province {renderSortArrow('province')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('stream')}>Stream {renderSortArrow('stream')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('status')}>Status {renderSortArrow('status')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('eligible')}>Eligible {renderSortArrow('eligible')}</button></th>
                <th style={{ minWidth: '140px' }}><button type="button" className={styles.sortButton} onClick={() => handleSort('score')}>Score {renderSortArrow('score')}</button></th>
                <th style={{ minWidth: '130px' }}><button type="button" className={styles.sortButton} onClick={() => handleSort('probability')}>Probability {renderSortArrow('probability')}</button></th>
                <th><button type="button" className={styles.sortButton} onClick={() => handleSort('tier')}>Tier {renderSortArrow('tier')}</button></th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r) => {
                const d = displayName(r.programId)
                const score = r.eligibility.eligible ? r.eligibility.score : null
                const maxScore = r.eligibility.eligible ? r.eligibility.maxScore : null
                const scorePct = score !== null && maxScore !== null && maxScore > 0
                  ? (score / maxScore) * 100
                  : 0
                const probPct = r.probability.percent
                const probColor = probPct >= 60 ? '#34d399'
                  : probPct >= 30 ? '#fbbf24'
                    : probPct > 0 ? '#fb7185'
                      : '#334155'
                const scoreColor = scorePct >= 70 ? '#34d399'
                  : scorePct >= 40 ? '#fbbf24'
                    : scorePct > 0 ? '#fb7185'
                      : '#334155'
                return (
                  <tr key={r.programId} className={rowClass(r)}>
                    <td>{d.province}</td>
                    <td>{d.stream}</td>
                    <td><span className={statusClass(r.meta.status)}>{r.meta.status}</span></td>
                    <td>{r.eligibility.eligible
                      ? <span style={{ color: '#34d399', fontWeight: 700 }}>Yes</span>
                      : <span style={{ color: '#3a4a5a' }}>No</span>}
                    </td>
                    <td>
                      {score !== null && maxScore !== null ? (
                        <div className={styles.scoreBarCell}>
                          <div className={styles.scoreBarTrack}>
                            <div className={styles.scoreBarFill}
                              style={{ width: `${scorePct}%`, background: scoreColor }} />
                          </div>
                          <span className={styles.scoreBarLabel}>{score}/{maxScore}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#2a3a4a' }}>&mdash;</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.probBarCell}>
                        <div className={styles.probBarTrack}>
                          <div className={styles.probBarFill}
                            style={{ width: `${probPct}%`, background: probColor }} />
                        </div>
                        <span className={styles.probBarLabel} style={{ color: probColor }}>{probPct}%</span>
                      </div>
                    </td>
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
