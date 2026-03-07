'use client'

import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  /** 0-indexed current step (0 through 6) */
  currentStep: number
  /** Array of completed step indices */
  completedSteps: number[]
  /** Labels for each of the 7 sections */
  labels: string[]
}

function CheckIcon() {
  return (
    <svg
      className={styles.checkIcon}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 7.5L5.5 10L11 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ProgressBar({
  currentStep,
  completedSteps,
  labels,
}: ProgressBarProps) {
  const totalSteps = labels.length
  const completedSet = new Set(completedSteps)
  const mobileProgress = ((currentStep + 1) / totalSteps) * 100

  return (
    <nav className={styles.container} aria-label="Assessment progress">
      {/* Mobile: compact indicator */}
      <div className={styles.mobileIndicator} aria-hidden="true">
        <span>
          Step {currentStep + 1} of {totalSteps}
          {labels[currentStep] ? ` — ${labels[currentStep]}` : ''}
        </span>
        <div className={styles.mobileBar}>
          <div
            className={styles.mobileBarFill}
            style={{ width: `${mobileProgress}%` }}
          />
        </div>
      </div>

      {/* Desktop: full stepper */}
      <ol className={styles.stepper} role="list">
        {labels.map((label, index) => {
          const isCompleted = completedSet.has(index)
          const isCurrent = index === currentStep
          const isFuture = !isCompleted && !isCurrent

          const stepClasses = [
            styles.step,
            isCompleted ? styles.stepCompleted : '',
            isCurrent ? styles.stepCurrent : '',
          ]
            .filter(Boolean)
            .join(' ')

          const dotClasses = [
            styles.dot,
            isCurrent ? styles.dotCurrent : '',
            isCompleted ? styles.dotCompleted : '',
            isFuture ? styles.dotFuture : '',
          ]
            .filter(Boolean)
            .join(' ')

          const labelClasses = [
            styles.label,
            isCurrent ? styles.labelCurrent : '',
            isCompleted ? styles.labelCompleted : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li
              key={index}
              className={stepClasses}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={dotClasses}
                aria-label={
                  isCompleted
                    ? `${label} — completed`
                    : isCurrent
                      ? `${label} — current step`
                      : `${label} — not started`
                }
                role="img"
              >
                {isCompleted ? <CheckIcon /> : index + 1}
              </div>
              <span className={labelClasses}>{label}</span>
            </li>
          )
        })}
      </ol>

      {/* Screen reader summary */}
      <div className="sr-only" role="status" aria-live="polite">
        Step {currentStep + 1} of {totalSteps}: {labels[currentStep]}.{' '}
        {completedSteps.length} of {totalSteps} steps completed.
      </div>
    </nav>
  )
}
