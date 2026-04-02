'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const PROGRAM_DISPLAY: Record<string, { province: string; stream: string }> = {
  'bc-entrepreneur-base': { province: 'BC', stream: 'Entrepreneur Base' },
  'bc-entrepreneur-regional': { province: 'BC', stream: 'Entrepreneur Regional' },
  'bc-entrepreneur-strategic': { province: 'BC', stream: 'Entrepreneur Strategic' },
  'ab-rural-entrepreneur': { province: 'AB', stream: 'Rural Entrepreneur' },
  'ab-graduate-entrepreneur': { province: 'AB', stream: 'Graduate Entrepreneur' },
  'ab-foreign-graduate': { province: 'AB', stream: 'Foreign Graduate' },
  'ab-farm': { province: 'AB', stream: 'Farm Stream' },
  'sk-entrepreneur': { province: 'SK', stream: 'Entrepreneur' },
  'sk-graduate-entrepreneur': { province: 'SK', stream: 'Graduate Entrepreneur' },
  'mb-entrepreneur': { province: 'MB', stream: 'Entrepreneur' },
  'mb-farm-investor': { province: 'MB', stream: 'Farm Investor' },
  'on-entrepreneur': { province: 'ON', stream: 'Entrepreneur' },
  'nb-entrepreneurial': { province: 'NB', stream: 'Business Immigration' },
  'nb-post-grad': { province: 'NB', stream: 'Post-Graduate' },
  'ns-entrepreneur': { province: 'NS', stream: 'Entrepreneur' },
  'ns-graduate-entrepreneur': { province: 'NS', stream: 'Graduate Entrepreneur' },
  'pei-work-permit': { province: 'PEI', stream: 'Work Permit' },
  'nl-entrepreneur': { province: 'NL', stream: 'Entrepreneur' },
  'nl-graduate-entrepreneur': { province: 'NL', stream: 'Graduate Entrepreneur' },
  'nwt-business': { province: 'NWT', stream: 'Business' },
  'yk-business-nominee': { province: 'YK', stream: 'Business Nominee' },
  'fed-start-up-visa': { province: 'Federal', stream: 'Start-Up Visa' },
  'fed-self-employed': { province: 'Federal', stream: 'Self-Employed Persons' },
}

function formatProgram(id: string): string {
  const known = PROGRAM_DISPLAY[id]
  if (known) return `${known.province} — ${known.stream}`
  return id
}

interface HistoryEntry {
  id: string
  date: string
  name: string
  email: string
  topPrograms: string[]
  totalEligible: number
  totalPrograms: number
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('assessmentHistory')
      if (stored) setHistory(JSON.parse(stored))
    } catch {
      // localStorage unavailable
    }
    setHydrated(true)
  }, [])

  function handleDelete(id: string) {
    const updated = history.filter((h) => h.id !== id)
    setHistory(updated)
    localStorage.setItem('assessmentHistory', JSON.stringify(updated))
  }

  function handleClearAll() {
    setHistory([])
    localStorage.removeItem('assessmentHistory')
  }

  if (!hydrated) {
    return (
      <main style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p style={{ color: '#93a0a9' }}>Loading...</p>
      </main>
    )
  }

  return (
    <main
      style={{
        padding: '2rem 1rem 4rem',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: "var(--font-body, 'Nunito', sans-serif)",
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1
          style={{
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-navy, #0f172a)',
            margin: 0,
          }}
        >
          My Assessments
        </h1>
        <Link
          href="/assessment"
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-cyan, #0099cc)',
            textDecoration: 'none',
          }}
        >
          + New Assessment
        </Link>
      </div>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#93a0a9',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}
      >
        View your past assessment results. Data is stored locally in your browser.
      </p>

      {history.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <p
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--color-navy, #0f172a)',
              marginBottom: '0.5rem',
            }}
          >
            No assessments yet
          </p>
          <p style={{ color: '#93a0a9', marginBottom: '1.5rem' }}>
            Complete your first assessment to see your results here.
          </p>
          <Link
            href="/assessment"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.75rem',
              backgroundColor: 'var(--color-cyan, #0099cc)',
              color: '#fff',
              fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: '10px',
              textDecoration: 'none',
            }}
          >
            Start Assessment &rarr;
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((entry) => (
              <div
                key={entry.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                {/* Eligibility badge */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: entry.totalEligible > 0
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : 'linear-gradient(135deg, #dc2626, #f87171)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {entry.totalEligible}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                    <p
                      style={{
                        fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'var(--color-navy, #0f172a)',
                        margin: 0,
                      }}
                    >
                      {entry.name}
                    </p>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(entry.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.2rem 0 0.6rem' }}>
                    {entry.totalEligible} of {entry.totalPrograms} programs eligible
                  </p>

                  {entry.topPrograms.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                      {entry.topPrograms.map((p) => (
                        <span
                          key={p}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(0,153,204,0.1)',
                            color: '#0077a8',
                          }}
                        >
                          {formatProgram(p)}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {history.length > 1 && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                Clear All History
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
