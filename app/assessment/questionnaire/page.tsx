'use client'

import { useRouter } from 'next/navigation'
import { QuestionnaireShell } from '@/components/assessment/QuestionnaireShell'

export default function QuestionnairePage() {
  const router = useRouter()

  const handleComplete = async (answers: Record<string, unknown>) => {
    // Store answers in sessionStorage for the review page
    sessionStorage.setItem('assessmentAnswers', JSON.stringify(answers))
    router.push('/assessment/review')
  }

  return (
    <main style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <QuestionnaireShell onComplete={handleComplete} />
    </main>
  )
}
