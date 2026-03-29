'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DisclaimerBanner } from '@/components/assessment/shared'
import { transformAnswersToProfile } from '@/lib/validation/transform'

/* ------------------------------------------------------------------
 * Lookup maps used to display human-readable labels for coded values
 * ----------------------------------------------------------------*/

const COUNTRY_LABELS: Record<string, string> = {
  IN: 'India', CN: 'China', PH: 'Philippines', NG: 'Nigeria', PK: 'Pakistan',
  US: 'United States', GB: 'United Kingdom', FR: 'France', BR: 'Brazil',
  IR: 'Iran', KR: 'South Korea', SY: 'Syria', MX: 'Mexico', EG: 'Egypt',
  LK: 'Sri Lanka', BD: 'Bangladesh', VN: 'Vietnam', CO: 'Colombia',
  UA: 'Ukraine', IQ: 'Iraq', AF: 'Afghanistan', JP: 'Japan', DE: 'Germany',
  SA: 'Saudi Arabia', AE: 'United Arab Emirates', HK: 'Hong Kong',
  TR: 'Turkey', LB: 'Lebanon', ET: 'Ethiopia', KE: 'Kenya', CA: 'Canada',
  OTHER: 'Other',
}

const PROVINCE_LABELS: Record<string, string> = {
  BC: 'British Columbia', AB: 'Alberta', SK: 'Saskatchewan', MB: 'Manitoba',
  ON: 'Ontario', NB: 'New Brunswick', NS: 'Nova Scotia',
  PEI: 'Prince Edward Island', NL: 'Newfoundland and Labrador',
  NWT: 'Northwest Territories', YK: 'Yukon',
}

const EDUCATION_LABELS: Record<string, string> = {
  'high-school': 'High School',
  '2-year-diploma': '2-year Diploma',
  '3-year-degree': '3-year Degree',
  bachelors: "Bachelor's Degree",
  masters: "Master's Degree",
  phd: 'PhD / Doctorate',
}

const LANGUAGE_TEST_LABELS: Record<string, string> = {
  ielts: 'IELTS', celpip: 'CELPIP', tef: 'TEF', tcf: 'TCF', none: 'None',
}

const REVENUE_LABELS: Record<string, string> = {
  'under-100k': 'Under $100K',
  '100k-500k': '$100K - $500K',
  '500k-1m': '$500K - $1M',
  '1m-5m': '$1M - $5M',
  '5m-plus': '$5M+',
}

const INDUSTRY_LABELS: Record<string, string> = {
  agriculture: 'Agriculture & Agri-food', construction: 'Construction',
  education: 'Education & Training', energy: 'Energy & Utilities',
  finance: 'Finance & Insurance', 'food-beverage': 'Food & Beverage',
  healthcare: 'Healthcare & Life Sciences', hospitality: 'Hospitality & Tourism',
  'it-tech': 'Information Technology', manufacturing: 'Manufacturing',
  mining: 'Mining & Natural Resources',
  'professional-services': 'Professional Services',
  'real-estate': 'Real Estate & Property', retail: 'Retail & E-commerce',
  transportation: 'Transportation & Logistics', other: 'Other',
}

const LOCATION_LABELS: Record<string, string> = {
  'major-city': 'Major City', 'smaller-city': 'Smaller City / Town',
  rural: 'Rural / Remote', flexible: 'Flexible',
}

const PROOF_OF_FUNDS_LABELS: Record<string, string> = {
  yes: 'Yes', 'in-process': 'In Process', no: 'No',
}

const YES_NO: Record<string, string> = { yes: 'Yes', no: 'No' }

const PROFICIENCY_LABELS: Record<string, string> = {
  basic: 'Basic', intermediate: 'Intermediate',
  advanced: 'Advanced', fluent: 'Fluent',
}

/* ------------------------------------------------------------------
 * Section definitions — drives the review rendering
 * ----------------------------------------------------------------*/

interface ReviewField {
  key: string
  label: string
  format?: (value: unknown) => string
}

interface ReviewSection {
  title: string
  /** Step index (0-based) — used for the Edit button */
  stepIndex: number
  fields: ReviewField[]
}

function fmt(value: unknown, map?: Record<string, string>): string {
  if (value === undefined || value === null || value === '') return '—'
  if (map) return map[String(value)] ?? String(value)
  return String(value)
}

function fmtCurrency(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  return `$${Number(value).toLocaleString('en-CA')} CAD`
}

const SECTIONS: ReviewSection[] = [
  {
    title: 'Personal Info',
    stepIndex: 0,
    fields: [
      { key: 'age', label: 'Age', format: (v) => (v ? `${v} years` : '—') },
      { key: 'citizenshipCountry', label: 'Citizenship', format: (v) => fmt(v, COUNTRY_LABELS) },
      { key: 'residenceCountry', label: 'Residence', format: (v) => fmt(v, COUNTRY_LABELS) },
      { key: 'maritalStatus', label: 'Marital Status', format: (v) => fmt(v, { single: 'Single', married: 'Married', 'common-law': 'Common-law' }) },
      { key: 'spouseAccompanying', label: 'Spouse Accompanying', format: (v) => fmt(v, YES_NO) },
    ],
  },
  {
    title: 'Language',
    stepIndex: 1,
    fields: [
      { key: 'languageTest', label: 'Language Test', format: (v) => fmt(v, LANGUAGE_TEST_LABELS) },
      { key: 'clbEnglish', label: 'CLB English Level', format: (v) => (v ? `CLB ${v}` : '—') },
      { key: 'selfAssessedEnglish', label: 'Self-assessed English', format: (v) => fmt(v, PROFICIENCY_LABELS) },
      { key: 'clbFrench', label: 'CLB French Level', format: (v) => (v ? `CLB ${v}` : '—') },
    ],
  },
  {
    title: 'Education',
    stepIndex: 2,
    fields: [
      { key: 'educationLevel', label: 'Highest Education', format: (v) => fmt(v, EDUCATION_LABELS) },
      { key: 'educationCountry', label: 'Credential Country', format: (v) => fmt(v, COUNTRY_LABELS) },
      { key: 'hasCanadianDegree', label: 'Canadian Degree', format: (v) => fmt(v, YES_NO) },
      { key: 'canadianDegreeProvince', label: 'Canadian Institution Province', format: (v) => fmt(v, PROVINCE_LABELS) },
      { key: 'canadianDegreeYears', label: 'Canadian Program Length', format: (v) => (v ? `${v} year${Number(v) === 1 ? '' : 's'}` : '—') },
      { key: 'hasECA', label: 'Has ECA', format: (v) => fmt(v, YES_NO) },
    ],
  },
  {
    title: 'Business Experience',
    stepIndex: 3,
    fields: [
      { key: 'hasOwnedBusiness', label: 'Owned a Business', format: (v) => fmt(v, YES_NO) },
      { key: 'yearsOfOwnership', label: 'Years of Ownership', format: (v) => (v !== undefined && v !== null ? `${v} year${Number(v) === 1 ? '' : 's'}` : '—') },
      { key: 'ownershipPercentage', label: 'Ownership %', format: (v) => (v !== undefined && v !== null ? `${v}%` : '—') },
      { key: 'numberOfEmployees', label: 'Number of Employees', format: (v) => (v !== undefined && v !== null ? `${v}` : '—') },
      { key: 'seniorManagementYears', label: 'Senior Management Years', format: (v) => (v !== undefined && v !== null ? `${v} year${Number(v) === 1 ? '' : 's'}` : '—') },
      { key: 'businessSector', label: 'Business Sector', format: (v) => fmt(v, INDUSTRY_LABELS) },
      { key: 'annualRevenue', label: 'Annual Revenue', format: (v) => fmt(v, REVENUE_LABELS) },
      { key: 'operatesInCanada', label: 'Operates in Canada', format: (v) => fmt(v, YES_NO) },
    ],
  },
  {
    title: 'Financial Profile',
    stepIndex: 4,
    fields: [
      { key: 'netWorth', label: 'Net Worth', format: fmtCurrency },
      { key: 'liquidAssets', label: 'Liquid Assets', format: fmtCurrency },
      { key: 'investmentAmount', label: 'Planned Investment', format: fmtCurrency },
      { key: 'proofOfFunds', label: 'Proof of Funds', format: (v) => fmt(v, PROOF_OF_FUNDS_LABELS) },
    ],
  },
  {
    title: 'Canada Connection',
    stepIndex: 5,
    fields: [
      { key: 'hasVisitedCanada', label: 'Visited Canada', format: (v) => fmt(v, YES_NO) },
      { key: 'visitedProvince', label: 'Province Visited', format: (v) => fmt(v, PROVINCE_LABELS) },
      { key: 'visitDurationDays', label: 'Visit Duration', format: (v) => (v ? `${v} day${Number(v) === 1 ? '' : 's'}` : '—') },
      { key: 'hasCommunityReferral', label: 'Community Referral', format: (v) => fmt(v, YES_NO) },
      { key: 'referralProvince', label: 'Referral Province', format: (v) => fmt(v, PROVINCE_LABELS) },
      { key: 'hasFamilyInCanada', label: 'Family in Canada', format: (v) => fmt(v, YES_NO) },
      { key: 'familyProvince', label: 'Family Province', format: (v) => fmt(v, PROVINCE_LABELS) },
    ],
  },
  {
    title: 'Business Intent',
    stepIndex: 6,
    fields: [
      { key: 'interestedProvince', label: 'Interested Province', format: (v) => fmt(v, PROVINCE_LABELS) },
      { key: 'locationPreference', label: 'Location Preference', format: (v) => fmt(v, LOCATION_LABELS) },
      { key: 'plannedEmployees', label: 'Planned Employees', format: (v) => (v !== undefined && v !== null ? `${v}` : '—') },
      { key: 'hasPGWP', label: 'Holds PGWP', format: (v) => fmt(v, YES_NO) },
    ],
  },
]

/* ------------------------------------------------------------------
 * Page component
 * ----------------------------------------------------------------*/

export default function ReviewPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('assessmentAnswers')
    if (stored) {
      setAnswers(JSON.parse(stored))
      setHydrated(true)
    } else {
      router.push('/assessment/questionnaire')
    }
  }, [router])

  const handleSubmit = async () => {
    if (!consent) return
    setLoading(true)
    try {
      const profile = transformAnswersToProfile(answers)
      const response = await fetch('/api/assessment/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data.results)) {
        console.error('Compute API error:', data)
        alert('Something went wrong computing your results. Please try again.')
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

  const handleEdit = (stepIndex: number) => {
    // Store which step to navigate to so the questionnaire can resume at that section
    sessionStorage.setItem('assessmentEditStep', String(stepIndex))
    router.push('/assessment/questionnaire')
  }

  /** Filter out fields whose value is empty / undefined */
  const visibleFields = (fields: ReviewField[]) =>
    fields.filter((f) => {
      const v = answers[f.key]
      return v !== undefined && v !== null && v !== ''
    })

  if (!hydrated) {
    return (
      <main style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-gray, #93a0a9)' }}>Loading...</p>
      </main>
    )
  }

  return (
    <main
      style={{
        padding: '2rem 1rem',
        maxWidth: '800px',
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
        Review Your Answers
      </h1>
      <p
        style={{
          fontSize: '0.95rem',
          color: 'var(--color-gray, #93a0a9)',
          marginBottom: '2rem',
        }}
      >
        Please confirm your responses before we calculate your program
        eligibility scores.
      </p>

      {/* Answer sections */}
      {SECTIONS.map((section) => {
        const fields = visibleFields(section.fields)
        if (fields.length === 0) return null

        return (
          <div
            key={section.title}
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.1))',
              padding: '1.25rem 1.5rem',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--color-navy, #000)',
                  margin: 0,
                }}
              >
                {section.title}
              </h2>
              <button
                type="button"
                onClick={() => handleEdit(section.stepIndex)}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-cyan, #0099cc)',
                  color: 'var(--color-cyan, #0099cc)',
                  borderRadius: 'var(--radius-md, 6px)',
                  padding: '0.3rem 0.75rem',
                  cursor: 'pointer',
                  fontFamily: "var(--font-body, 'Nunito', sans-serif)",
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Edit
              </button>
            </div>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {fields.map((field) => (
                <li
                  key={field.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '0.9rem',
                  }}
                >
                  <span style={{ color: 'var(--color-gray, #93a0a9)' }}>
                    {field.label}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--color-navy, #000)',
                      textAlign: 'right',
                    }}
                  >
                    {field.format
                      ? field.format(answers[field.key])
                      : String(answers[field.key])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {/* Consent checkbox */}
      <label
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          padding: '1.25rem 0',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{
            marginTop: '0.2rem',
            width: '18px',
            height: '18px',
            accentColor: 'var(--color-cyan, #0099cc)',
            flexShrink: 0,
          }}
        />
        <span style={{ color: 'var(--color-navy, #000)' }}>
          I understand that this assessment provides estimates based on publicly
          available program information and does not constitute legal immigration
          advice. I consent to having my responses processed to generate
          eligibility scores.
        </span>
      </label>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!consent || loading}
        style={{
          display: 'block',
          width: '100%',
          padding: '0.875rem 2rem',
          backgroundColor:
            consent && !loading
              ? 'var(--color-cyan, #0099cc)'
              : '#ccc',
          color: '#fff',
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontWeight: 700,
          fontSize: '1.05rem',
          border: 'none',
          borderRadius: 'var(--radius-lg, 12px)',
          cursor: consent && !loading ? 'pointer' : 'not-allowed',
          marginBottom: '1.5rem',
          transition: 'background-color 0.2s ease',
        }}
      >
        {loading ? 'Calculating...' : 'Get My Results'}
      </button>

      <DisclaimerBanner variant="inline" />
    </main>
  )
}
