'use client'

import { RadioCardGroup } from '@/components/assessment/inputs/RadioCardGroup'
import { RangeSlider } from '@/components/assessment/inputs/RangeSlider'
import { SearchableDropdown } from '@/components/assessment/inputs/SearchableDropdown'

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

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function CanadaConnection({ answers, onUpdate }: SectionProps) {
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
        Canada Connection
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body, 'Nunito', sans-serif)",
          fontSize: '0.95rem',
          color: 'var(--color-gray, #93a0a9)',
          marginBottom: 'var(--space-lg, 2rem)',
        }}
      >
        Your existing ties to Canada can strengthen your application.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 2rem)' }}>
        <RadioCardGroup
          name="hasVisitedCanada"
          options={YES_NO_OPTIONS}
          value={answers.hasVisitedCanada ?? ''}
          onChange={(v) => onUpdate('hasVisitedCanada', v)}
          label="Have you visited any Canadian province for business research?"
        />

        {answers.hasVisitedCanada === 'yes' && (
          <>
            <SearchableDropdown
              options={PROVINCES}
              value={answers.visitedProvince ?? ''}
              onChange={(v) => onUpdate('visitedProvince', v)}
              label="Which province did you visit?"
              placeholder="Select province..."
            />

            <RangeSlider
              min={1}
              max={180}
              step={1}
              value={answers.visitDurationDays ?? 7}
              onChange={(v) => onUpdate('visitDurationDays', v)}
              label="Duration of visit"
              formatValue={(v) => `${v} ${v === 1 ? 'day' : 'days'}`}
            />
          </>
        )}

        <RadioCardGroup
          name="hasCommunityReferral"
          options={YES_NO_OPTIONS}
          value={answers.hasCommunityReferral ?? ''}
          onChange={(v) => onUpdate('hasCommunityReferral', v)}
          label="Do you have a community referral letter?"
        />

        {answers.hasCommunityReferral === 'yes' && (
          <SearchableDropdown
            options={PROVINCES}
            value={answers.referralProvince ?? ''}
            onChange={(v) => onUpdate('referralProvince', v)}
            label="From which community/province?"
            placeholder="Select province..."
          />
        )}

        <RadioCardGroup
          name="hasFamilyInCanada"
          options={YES_NO_OPTIONS}
          value={answers.hasFamilyInCanada ?? ''}
          onChange={(v) => onUpdate('hasFamilyInCanada', v)}
          label="Do you have family in Canada?"
        />

        {answers.hasFamilyInCanada === 'yes' && (
          <SearchableDropdown
            options={PROVINCES}
            value={answers.familyProvince ?? ''}
            onChange={(v) => onUpdate('familyProvince', v)}
            label="Which province does your family live in?"
            placeholder="Select province..."
          />
        )}
      </div>
    </section>
  )
}
