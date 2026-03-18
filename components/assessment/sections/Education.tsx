'use client'

import { RadioCardGroup } from '@/components/assessment/inputs/RadioCardGroup'
import { RangeSlider } from '@/components/assessment/inputs/RangeSlider'
import { SearchableDropdown } from '@/components/assessment/inputs/SearchableDropdown'
import { Tooltip } from '@/components/assessment/inputs/Tooltip'
import { COUNTRIES } from '@/lib/data/countries'

interface SectionProps {
  answers: Record<string, any>
  onUpdate: (field: string, value: any) => void
}

const PROVINCES = [
  { value: 'BC', label: 'British Columbia' },
  { value: 'AB', label: 'Alberta' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'ON', label: 'Ontario' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'PEI', label: 'Prince Edward Island' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NWT', label: 'Northwest Territories' },
  { value: 'YK', label: 'Yukon' },
]

const EDUCATION_LEVELS = [
  { value: 'high-school', label: 'High School' },
  { value: '2-year-diploma', label: '2-year Diploma' },
  { value: '3-year-degree', label: '3-year Degree' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD / Doctorate' },
]

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function Education({ answers, onUpdate }: SectionProps) {
  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-navy, #1a1a2e)',
          marginBottom: 'var(--space-xs, 0.25rem)',
        }}
      >
        Education
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body, 'Nunito', sans-serif)",
          fontSize: '0.95rem',
          color: 'var(--color-gray, #93a0a9)',
          marginBottom: 'var(--space-lg, 2rem)',
        }}
      >
        Your educational background and credentials.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 2rem)' }}>
        <RadioCardGroup
          name="educationLevel"
          options={EDUCATION_LEVELS}
          value={answers.educationLevel ?? ''}
          onChange={(v) => onUpdate('educationLevel', v)}
          label="Highest level of education"
        />

        <SearchableDropdown
          options={COUNTRIES}
          value={answers.educationCountry ?? ''}
          onChange={(v) => onUpdate('educationCountry', v)}
          label="Country where credential was obtained"
          placeholder="Select country..."
        />

        <RadioCardGroup
          name="hasCanadianDegree"
          options={YES_NO_OPTIONS}
          value={answers.hasCanadianDegree ?? ''}
          onChange={(v) => onUpdate('hasCanadianDegree', v)}
          label="Do you have a Canadian degree or diploma?"
        />

        {answers.hasCanadianDegree === 'yes' && (
          <>
            <SearchableDropdown
              options={PROVINCES}
              value={answers.canadianDegreeProvince ?? ''}
              onChange={(v) => onUpdate('canadianDegreeProvince', v)}
              label="Province of Canadian institution"
              placeholder="Select province..."
            />

            <RangeSlider
              min={1}
              max={8}
              step={1}
              value={answers.canadianDegreeYears ?? 2}
              onChange={(v) => onUpdate('canadianDegreeYears', v)}
              label="Length of Canadian program (years)"
              formatValue={(v) => `${v} ${v === 1 ? 'year' : 'years'}`}
            />
          </>
        )}

        {answers.educationCountry && answers.educationCountry !== 'CA' && (
          <div>
            <Tooltip content="An Educational Credential Assessment (ECA) verifies that your foreign degree, diploma, or certificate is valid and equivalent to a Canadian credential. It is required for most immigration programs.">
              <span
                style={{
                  fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-navy, #000)',
                }}
              >
                Do you have an ECA (Educational Credential Assessment)?
              </span>
            </Tooltip>
            <div style={{ marginTop: 'var(--space-sm, 0.5rem)' }}>
              <RadioCardGroup
                name="hasECA"
                options={YES_NO_OPTIONS}
                value={answers.hasECA ?? ''}
                onChange={(v) => onUpdate('hasECA', v)}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
