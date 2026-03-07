'use client'

import { useState, type FormEvent } from 'react'
import styles from './ComingSoon.module.css'

export default function ComingSoon() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    // TODO: integrate with backend notification service
    setSubmitted(true)
  }

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        {/* Icon */}
        <div className={styles.iconWrapper} aria-hidden="true">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className={styles.heading}>
          PNP Assessment Tool &mdash; Coming Soon
        </h1>

        {/* Description */}
        <p className={styles.description}>
          We&apos;re building a comprehensive tool to evaluate your eligibility
          across 15+ Canadian Provincial Nominee Program entrepreneur streams.
          Get scored, discover gaps, and find your best path to Canadian
          entrepreneurship &mdash; all in under 5 minutes.
        </p>

        {/* Email signup or success message */}
        {submitted ? (
          <div className={styles.success} role="status">
            <svg
              className={styles.successIcon}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className={styles.successText}>
              Thanks! We&apos;ll notify you when the assessment tool launches.
            </p>
          </div>
        ) : (
          <>
            <p className={styles.signupLabel}>
              Sign up to be notified when we launch:
            </p>
            <form
              className={styles.form}
              onSubmit={handleSubmit}
              noValidate
            >
              <div className={styles.inputGroup}>
                <label htmlFor="notify-email" className={styles.srOnly}>
                  Email address
                </label>
                <input
                  id="notify-email"
                  type="email"
                  className={styles.emailInput}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby={error ? 'email-error' : undefined}
                  aria-invalid={error ? 'true' : undefined}
                  required
                />
                <button type="submit" className={styles.submitButton}>
                  Notify Me
                </button>
              </div>
              {error && (
                <p id="email-error" className={styles.error} role="alert">
                  {error}
                </p>
              )}
            </form>
          </>
        )}

        {/* Back link */}
        <a href="/" className={styles.backLink}>
          &larr; Return to Homepage
        </a>
      </div>
    </main>
  )
}
