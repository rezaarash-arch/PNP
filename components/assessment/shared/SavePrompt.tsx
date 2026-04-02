'use client'

import { useState, useCallback, type FormEvent } from 'react'
import styles from './SavePrompt.module.css'

export interface SavePromptProps {
  /** Called with the email address when the user clicks Save */
  onSave: (email: string) => void
  /** Called when the user dismisses the prompt */
  onDismiss: () => void
  /** Controls visibility of the floating prompt */
  isVisible: boolean
}

export default function SavePrompt({
  onSave,
  onDismiss,
  isVisible,
}: SavePromptProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const trimmed = email.trim()
      if (trimmed) {
        onSave(trimmed)
      }
    },
    [email, onSave]
  )

  const cardClasses = [styles.card, isVisible ? styles.cardVisible : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={styles.overlay}
      role="complementary"
      aria-label="Save progress"
      aria-hidden={!isVisible}
    >
      <div className={cardClasses}>
        <p className={styles.text}>
          Save your progress? Enter your email to resume later.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="save-prompt-email" className="sr-only">
            Email address
          </label>
          <input
            id="save-prompt-email"
            className={styles.emailInput}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            aria-label="Email address for saving progress"
            tabIndex={isVisible ? 0 : -1}
          />
          <button
            type="submit"
            className={styles.saveButton}
            disabled={!email.trim()}
            tabIndex={isVisible ? 0 : -1}
          >
            Save
          </button>
        </form>

        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Dismiss save prompt"
          tabIndex={isVisible ? 0 : -1}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
