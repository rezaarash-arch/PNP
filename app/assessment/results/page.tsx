'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ResultsDashboard } from '@/components/assessment/results'
import AIAnalysisSection from '@/components/assessment/results/AIAnalysisSection'

export default function ResultsPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('assessmentResults')
    if (stored) {
      setData(JSON.parse(stored))
    } else {
      router.push('/assessment/questionnaire')
    }

    const storedProfile = sessionStorage.getItem('assessmentProfile')
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile))
    }
  }, [router])

  if (!data) {
    return (
      <main style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-gray, #93a0a9)' }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <ResultsDashboard
        results={data.results}
        assessedAt={data.meta?.timestamp ?? new Date().toISOString()}
      />
      {profile && (
        <AIAnalysisSection profile={profile} results={data.results} />
      )}
    </main>
  )
}
