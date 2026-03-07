'use client'

import ProbabilityBar from './ProbabilityBar'
import type { ProbabilityBarProps } from './ProbabilityBar'

export interface ProgramResult {
  programName: string
  province: string
  score: number
  tier: ProbabilityBarProps['tier']
  confidence: ProbabilityBarProps['confidence']
  range: [number, number]
  gaps: string[]
  strengths: string[]
}

export interface ResultsDashboardProps {
  results: ProgramResult[]
  assessedAt: string
}

export function ResultsDashboard({ results, assessedAt }: ResultsDashboardProps) {
  const sortedResults = [...results].sort((a, b) => b.score - a.score)

  return (
    <div style={{ fontFamily: "var(--font-body, 'Nunito', sans-serif)" }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            color: 'var(--color-navy, #000)',
            marginBottom: '0.25rem',
          }}
        >
          Your Assessment Results
        </h1>
        <p style={{ color: 'var(--color-gray, #93a0a9)', fontSize: '0.9rem' }}>
          Assessed on{' '}
          {new Date(assessedAt).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      {sortedResults.length === 0 && (
        <p style={{ color: 'var(--color-gray, #93a0a9)' }}>
          No program results available. Please complete the assessment first.
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gap: '1.25rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        }}
      >
        {sortedResults.map((result) => (
          <div
            key={result.programName}
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.1))',
              padding: '1.25rem 1.5rem',
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--color-navy, #000)',
                marginBottom: '0.15rem',
              }}
            >
              {result.programName}
            </h2>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-gray, #93a0a9)',
                marginBottom: '0.75rem',
              }}
            >
              {result.province}
            </p>

            <ProbabilityBar
              percent={result.score}
              range={result.range}
              tier={result.tier}
              confidence={result.confidence}
            />

            {result.strengths.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <h3
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-strong, #10b981)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Strengths
                </h3>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-navy, #000)',
                  }}
                >
                  {result.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.gaps.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <h3
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-moderate, #f59e0b)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Gaps
                </h3>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-navy, #000)',
                  }}
                >
                  {result.gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
