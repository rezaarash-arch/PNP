'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { transformAnswersToProfile } from '@/lib/validation/transform'

export default function ContactPage() {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('assessmentAnswers')
    if (stored) {
      setAnswers(JSON.parse(stored))
      setHydrated(true)
    } else {
      router.push('/assessment/questionnaire')
    }
  }, [router])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required'
    if (!email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address'
    }
    if (confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      errs.confirmEmail = 'Email addresses do not match'
    }
    if (!phone.trim()) {
      errs.phone = 'Phone number is required'
    } else if (phone.replace(/[\s\-\(\)\+]/g, '').length < 7) {
      errs.phone = 'Please enter a valid phone number'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // Store contact info
      const contactInfo = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        marketingConsent,
      }
      sessionStorage.setItem('contactInfo', JSON.stringify(contactInfo))

      // Run the compute engine
      const profile = transformAnswersToProfile(answers)
      const response = await fetch('/api/assessment/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const text = await response.text()
      let data: Record<string, unknown>
      try {
        data = JSON.parse(text) as Record<string, unknown>
      } catch {
        console.error('Compute API returned non-JSON:', text.slice(0, 500))
        alert('Something went wrong (non-JSON response). Please try again.')
        return
      }
      if (!response.ok || !Array.isArray(data.results)) {
        console.error('Compute API error:', response.status, data)
        alert(`Something went wrong (${response.status}). Please try again.`)
        return
      }

      sessionStorage.setItem('assessmentResults', JSON.stringify(data))
      sessionStorage.setItem('assessmentProfile', JSON.stringify(profile))

      // Persist summary to localStorage for the dashboard
      try {
        const topPrograms = (data.results as Array<{ programId: string; eligibility: { eligible: boolean; score?: number; maxScore?: number }; probability: { percent: number } }>)
          .filter((r) => r.eligibility.eligible)
          .sort((a, b) => b.probability.percent - a.probability.percent)
          .slice(0, 3)
          .map((r) => r.programId)

        const entry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          name: fullName.trim(),
          email: email.trim(),
          topPrograms,
          totalEligible: (data.results as Array<{ eligibility: { eligible: boolean } }>).filter((r) => r.eligibility.eligible).length,
          totalPrograms: (data.results as Array<unknown>).length,
        }
        const history = JSON.parse(localStorage.getItem('assessmentHistory') ?? '[]')
        history.unshift(entry)
        localStorage.setItem('assessmentHistory', JSON.stringify(history.slice(0, 20)))
      } catch {
        // localStorage unavailable — skip silently
      }

      router.push('/assessment/results')
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
        padding: '2rem 1rem',
        maxWidth: '520px',
        margin: '0 auto',
        fontFamily: "var(--font-body, 'Nunito', sans-serif)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontSize: '1.75rem',
          fontWeight: 800,
          color: 'var(--color-navy, #000)',
          marginBottom: '0.5rem',
        }}
      >
        Almost There!
      </h1>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#93a0a9',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}
      >
        Enter your contact details below so we can send you your personalized
        business immigration report.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Full Name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="fullName"
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-navy, #000)',
                marginBottom: '0.4rem',
              }}
            >
              Full Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Smith"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: `1px solid ${errors.fullName ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.fullName && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-navy, #000)',
                marginBottom: '0.4rem',
              }}
            >
              Email Address <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: `1px solid ${errors.email ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.email && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Confirm Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="confirmEmail"
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-navy, #000)',
                marginBottom: '0.4rem',
              }}
            >
              Confirm Email <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Re-enter your email address"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: `1px solid ${errors.confirmEmail ? '#dc2626' : confirmEmail && confirmEmail.toLowerCase() === email.toLowerCase() ? '#16a34a' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.confirmEmail && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                {errors.confirmEmail}
              </p>
            )}
            {!errors.confirmEmail && confirmEmail && confirmEmail.toLowerCase() === email.toLowerCase() && (
              <p style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                ✓ Emails match
              </p>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="phone"
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-navy, #000)',
                marginBottom: '0.4rem',
              }}
            >
              Phone Number <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (416) 555-0123"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: `1px solid ${errors.phone ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.phone && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Marketing Consent */}
          <label
            style={{
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
              cursor: 'pointer',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: '#475569',
            }}
          >
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              style={{
                marginTop: '0.15rem',
                width: '16px',
                height: '16px',
                accentColor: 'var(--color-cyan, #0099cc)',
                flexShrink: 0,
              }}
            />
            <span>
              I would like to receive educational content, program updates, and
              promotional emails from GenesisLink. You can unsubscribe at any time.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.875rem 2rem',
            backgroundColor: loading ? '#ccc' : 'var(--color-cyan, #0099cc)',
            color: '#fff',
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontWeight: 700,
            fontSize: '1.05rem',
            border: 'none',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          {loading ? 'Processing...' : 'Generate My Report'}
        </button>
      </form>

      <p
        style={{
          fontSize: '0.8rem',
          color: '#94a3b8',
          textAlign: 'center',
          marginTop: '1rem',
          lineHeight: 1.5,
        }}
      >
        Your information is kept confidential and will only be used to deliver
        your assessment report.
      </p>
    </main>
  )
}
