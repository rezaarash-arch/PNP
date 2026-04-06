'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AIAnalysis } from '@/lib/ai/types'
import styles from './AIAnalysisSection.module.css'

/** Short human-readable names for program IDs */
const PROGRAM_NAMES: Record<string, string> = {
  'bc-entrepreneur-base': 'BC Entrepreneur (Base)',
  'bc-entrepreneur-regional': 'BC Entrepreneur (Regional)',
  'bc-entrepreneur-strategic': 'BC Entrepreneur (Strategic)',
  'ab-rural-entrepreneur': 'Alberta Rural Entrepreneur',
  'ab-graduate-entrepreneur': 'Alberta Graduate Entrepreneur',
  'ab-foreign-graduate': 'Alberta Foreign Graduate',
  'ab-farm': 'Alberta Farm',
  'sk-entrepreneur': 'Saskatchewan Entrepreneur',
  'sk-graduate-entrepreneur': 'Saskatchewan Graduate Entrepreneur',
  'mb-entrepreneur': 'Manitoba Entrepreneur',
  'mb-farm-investor': 'Manitoba Farm Investor',
  'on-entrepreneur': 'Ontario Entrepreneur',
  'nb-entrepreneurial': 'New Brunswick Entrepreneurial',
  'nb-post-grad': 'New Brunswick Post-Graduate',
  'ns-entrepreneur': 'Nova Scotia Entrepreneur',
  'ns-graduate-entrepreneur': 'Nova Scotia Graduate Entrepreneur',
  'pei-work-permit': 'PEI Work Permit',
  'nl-entrepreneur': 'Newfoundland Entrepreneur',
  'nl-graduate-entrepreneur': 'Newfoundland Graduate Entrepreneur',
  'nwt-business': 'Northwest Territories Business',
  'yk-business-nominee': 'Yukon Business Nominee',
  'fed-start-up-visa': 'Federal Start-Up Visa',
  'fed-self-employed': 'Federal Self-Employed',
}

function getProgramName(id: string): string {
  return PROGRAM_NAMES[id] ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export interface AIAnalysisSectionProps {
  profile: Record<string, unknown>
  results: unknown[]
}

export default function AIAnalysisSection({ profile, results }: AIAnalysisSectionProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAnalysis = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch('/api/assessment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, results }),
        signal,
      })
      if (!response.ok) throw new Error('API error')
      const data: AIAnalysis = await response.json()
      if (!signal?.aborted) {
        setAnalysis(data)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!signal?.aborted) {
        setError(true)
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [profile, results])

  useEffect(() => {
    const controller = new AbortController()
    fetchAnalysis(controller.signal)
    return () => controller.abort()
  }, [fetchAnalysis])

  const handleRetry = () => {
    fetchAnalysis()
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>AI Business Immigration Report</h2>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Preparing your intelligence report...</p>
          <p className={styles.loadingSubtext}>Our AI agent is analyzing your profile against all programs</p>
        </div>
      </section>
    )
  }

  if (error || !analysis) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>AI Business Immigration Report</h2>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>AI analysis temporarily unavailable</p>
          <button type="button" className={styles.retryButton} onClick={handleRetry}>
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>AI Business Immigration Report</h2>

      {/* Executive Summary */}
      <div className={styles.executiveSummary}>
        <p>{analysis.executiveSummary}</p>
      </div>

      {/* Program Analysis */}
      {analysis.programAnalyses.length > 0 && (
        <>
          <h3 className={styles.subSectionTitle}>Program Analysis</h3>
          {analysis.programAnalyses.map((pa) => (
            <div key={pa.programId} className={styles.programAnalysis}>
              <div className={styles.programAnalysisHeader}>
                <span className={styles.programAnalysisName}>
                  {getProgramName(pa.programId)}
                </span>
                <span
                  className={`${styles.fitBadge} ${
                    pa.strategicFit === 'strong'
                      ? styles.fit_strong
                      : pa.strategicFit === 'moderate'
                        ? styles.fit_moderate
                        : styles.fit_weak
                  }`}
                >
                  {pa.strategicFit}
                </span>
              </div>
              <p className={styles.narrative}>{pa.narrative}</p>
              {pa.risks.length > 0 && (
                <ul className={styles.risksList}>
                  {pa.risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              )}
              <span className={styles.timeline}>{pa.timeline}</span>
            </div>
          ))}
        </>
      )}

      {/* Ineligibility Insights */}
      {analysis.ineligibilityInsights && analysis.ineligibilityInsights.length > 0 && (
        <>
          <h3 className={styles.subSectionTitle}>Why You Don&apos;t Qualify (Yet)</h3>
          {analysis.ineligibilityInsights.map((insight) => (
            <div key={insight.programId} className={styles.ineligibilityCard}>
              <div className={styles.ineligibilityHeader}>
                <span className={styles.ineligibilityName}>
                  {getProgramName(insight.programId)}
                </span>
                <span
                  className={`${styles.feasibilityBadge} ${
                    insight.feasibility === 'achievable'
                      ? styles.feasibility_achievable
                      : insight.feasibility === 'difficult'
                        ? styles.feasibility_difficult
                        : styles.feasibility_impractical
                  }`}
                >
                  {insight.feasibility}
                </span>
              </div>
              <ul className={styles.barriersList}>
                {insight.barriers.map((barrier, i) => (
                  <li key={i}>{barrier}</li>
                ))}
              </ul>
              <p className={styles.suggestionText}>{insight.suggestion}</p>
            </div>
          ))}
        </>
      )}

      {/* Strategic Roadmap */}
      {analysis.strategicRoadmap.length > 0 && (
        <>
          <h3 className={styles.subSectionTitle}>Strategic Roadmap</h3>
          <div className={styles.roadmap}>
            {analysis.strategicRoadmap.map((phase, i) => (
              <div key={i} className={styles.phase}>
                <h4 className={styles.phaseTitle}>{phase.phase}</h4>
                <ul className={styles.actionList}>
                  {phase.actions.map((action, j) => (
                    <li key={j}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Improvement Priorities */}
      {analysis.improvementPriorities.length > 0 && (
        <>
          <h3 className={styles.subSectionTitle}>Improvement Priorities</h3>
          <div className={styles.improvements}>
            {analysis.improvementPriorities.map((item, i) => (
              <div key={i} className={styles.improvementItem}>
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
        </>
      )}

      {/* Risk Factors */}
      {analysis.riskFactors.length > 0 && (
        <>
          <h3 className={styles.subSectionTitle}>Risk Factors</h3>
          <ul className={styles.riskFactorList}>
            {analysis.riskFactors.map((risk, i) => (
              <li key={i} className={styles.riskFactorItem}>{risk}</li>
            ))}
          </ul>
        </>
      )}

      {/* Model note */}
      <p className={styles.modelNote}>
        Analysis by {analysis.modelUsed} | Generated{' '}
        {new Date(analysis.generatedAt).toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </section>
  )
}
