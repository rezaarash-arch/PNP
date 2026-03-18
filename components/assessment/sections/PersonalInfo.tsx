'use client'

import { RadioCardGroup } from '@/components/assessment/inputs/RadioCardGroup'
import { RangeSlider } from '@/components/assessment/inputs/RangeSlider'
import { SearchableDropdown } from '@/components/assessment/inputs/SearchableDropdown'
import { COUNTRIES } from '@/lib/data/countries'

interface SectionProps {
  answers: Record<string, any>
  onUpdate: (field: string, value: any) => void
}

const MARITAL_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'common-law', label: 'Common-law' },
]

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function PersonalInfo({ answers, onUpdate }: SectionProps) {
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
        Personal Information
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body, 'Nunito', sans-serif)",
          fontSize: '0.95rem',
          color: 'var(--color-gray, #93a0a9)',
          marginBottom: 'var(--space-lg, 2rem)',
        }}
      >
        Basic details about you and your family status.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 2rem)' }}>
        <RangeSlider
          min={18}
          max={75}
          step={1}
          value={answers.age ?? 30}
          onChange={(v) => onUpdate('age', v)}
          label="Age"
          unit="years"
          formatValue={(v) => `${v} years`}
        />

        <SearchableDropdown
          options={COUNTRIES}
          value={answers.citizenshipCountry ?? ''}
          onChange={(v) => onUpdate('citizenshipCountry', v)}
          label="Country of citizenship"
          placeholder="Select your country..."
        />

        <SearchableDropdown
          options={COUNTRIES}
          value={answers.residenceCountry ?? ''}
          onChange={(v) => onUpdate('residenceCountry', v)}
          label="Country of current residence"
          placeholder="Select your country..."
        />

        <RadioCardGroup
          name="maritalStatus"
          options={MARITAL_OPTIONS}
          value={answers.maritalStatus ?? ''}
          onChange={(v) => onUpdate('maritalStatus', v)}
          label="Marital status"
        />

        {(answers.maritalStatus === 'married' || answers.maritalStatus === 'common-law') && (
          <RadioCardGroup
            name="spouseAccompanying"
            options={YES_NO_OPTIONS}
            value={answers.spouseAccompanying ?? ''}
            onChange={(v) => onUpdate('spouseAccompanying', v)}
            label="Does your spouse or common-law partner intend to accompany you to Canada?"
          />
        )}
      </div>
    </section>
  )
}
