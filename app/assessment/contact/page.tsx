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
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

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
      }
      sessionStorage.setItem('contactInfo', JSON.stringify(contactInfo))

      // Run the compute engine
      const profile = transformAnswersToProfile(answers)
      const response = await fetch('/api/assessment/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data.results)) {
        console.error('Compute API error:', data)
        alert('Something went wrong. Please try again.')
        return
      }

      sessionStorage.setItem('assessmentResults', JSON.stringify(data))
      sessionStorage.setItem('assessmentProfile', JSON.stringify(profile))
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
        intelligence report.
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

          {/* Phone */}
          <div>
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
