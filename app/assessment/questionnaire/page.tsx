'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionnaireShell } from '@/components/assessment/QuestionnaireShell'

export default function QuestionnairePage() {
  const router = useRouter()
  const [initialData, setInitialData] = useState<{
    answers: Record<string, unknown>
    step: number
  } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const editStep = sessionStorage.getItem('assessmentEditStep')
    const savedAnswers = sessionStorage.getItem('assessmentAnswers')

    if (editStep !== null && savedAnswers) {
      setInitialData({
        answers: JSON.parse(savedAnswers),
        step: parseInt(editStep, 10),
      })
      sessionStorage.removeItem('assessmentEditStep')
    }
    setReady(true)
  }, [])

  const handleComplete = async (answers: Record<string, unknown>) => {
    sessionStorage.setItem('assessmentAnswers', JSON.stringify(answers))
    router.push('/assessment/review')
  }

  if (!ready) {
    return (
      <main style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p style={{ color: '#93a0a9' }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <QuestionnaireShell
        onComplete={handleComplete}
        initialAnswers={initialData?.answers}
        initialStep={initialData?.step}
      />
    </main>
  )
}
