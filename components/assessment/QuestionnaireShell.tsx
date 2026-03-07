'use client'

import { useState, useCallback } from 'react'
import { ProgressBar } from './shared'
import { SavePrompt } from './shared'
import { DisclaimerBanner } from './shared'
import {
  PersonalInfo,
  Language,
  Education,
  BusinessExperience,
  FinancialProfile,
  CanadaConnection,
  BusinessIntent,
} from './sections'
import styles from './QuestionnaireShell.module.css'

interface QuestionnaireShellProps {
  onComplete: (answers: Record<string, unknown>) => void
  initialAnswers?: Record<string, unknown>
}

const SECTION_LABELS = [
  'Personal Info',
  'Language',
  'Education',
  'Business',
  'Financial',
  'Canada',
  'Intent',
]

export function QuestionnaireShell({
  onComplete,
  initialAnswers = {},
}: QuestionnaireShellProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showSavePrompt, setShowSavePrompt] = useState(false)

  const handleUpdate = useCallback((field: string, value: unknown) => {
    setAnswers(prev => {
      const next = { ...prev, [field]: value }
      // Auto-save to sessionStorage (best-effort)
      try {
        sessionStorage.setItem('pnp-assessment-answers', JSON.stringify(next))
      } catch {
        // Graceful failure — sessionStorage may be unavailable
      }
      return next
    })
  }, [])

  const handleNext = () => {
    if (currentStep < 6) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      setCurrentStep(prev => prev + 1)
      // Show save prompt after completing section 3
      if (currentStep === 2) {
        setShowSavePrompt(true)
      }
    } else {
      // Last section — submit
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      onComplete(answers)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  const handleSave = async (email: string) => {
    try {
      await fetch('/api/assessment/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, email }),
      })
      setShowSavePrompt(false)
    } catch {
      // Graceful failure — don't block navigation on save errors
    }
  }

  // Render the active section
  const sections = [
    <PersonalInfo key="personal" answers={answers} onUpdate={handleUpdate} />,
    <Language key="language" answers={answers} onUpdate={handleUpdate} />,
    <Education key="education" answers={answers} onUpdate={handleUpdate} />,
    <BusinessExperience key="business" answers={answers} onUpdate={handleUpdate} />,
    <FinancialProfile key="financial" answers={answers} onUpdate={handleUpdate} />,
    <CanadaConnection key="canada" answers={answers} onUpdate={handleUpdate} />,
    <BusinessIntent key="intent" answers={answers} onUpdate={handleUpdate} />,
  ]

  return (
    <div className={styles.shell}>
      <ProgressBar
        currentStep={currentStep}
        completedSteps={completedSteps}
        labels={SECTION_LABELS}
      />

      <div className={styles.sectionContainer}>
        {sections[currentStep]}
      </div>

      <div className={styles.navigation}>
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className={styles.backButton}
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className={styles.nextButton}
        >
          {currentStep < 6 ? 'Continue' : 'View Results'}
        </button>
      </div>

      <SavePrompt
        isVisible={showSavePrompt}
        onSave={handleSave}
        onDismiss={() => setShowSavePrompt(false)}
      />
      <DisclaimerBanner variant="inline" />
    </div>
  )
}
