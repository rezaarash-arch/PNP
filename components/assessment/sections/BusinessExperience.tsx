'use client'

import { RadioCardGroup } from '@/components/assessment/inputs/RadioCardGroup'
import { RangeSlider } from '@/components/assessment/inputs/RangeSlider'
import { SearchableDropdown } from '@/components/assessment/inputs/SearchableDropdown'

interface SectionProps {
  answers: Record<string, any>
  onUpdate: (field: string, value: any) => void
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const REVENUE_OPTIONS = [
  { value: 'under-100k', label: 'Under $100K' },
  { value: '100k-500k', label: '$100K - $500K' },
  { value: '500k-1m', label: '$500K - $1M' },
  { value: '1m-5m', label: '$1M - $5M' },
  { value: '5m-plus', label: '$5M+' },
]

const INDUSTRY_OPTIONS = [
  { value: 'agriculture', label: 'Agriculture & Agri-food' },
  { value: 'construction', label: 'Construction' },
  { value: 'education', label: 'Education & Training' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'finance', label: 'Finance & Insurance' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'healthcare', label: 'Healthcare & Life Sciences' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'it-tech', label: 'Information Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'mining', label: 'Mining & Natural Resources' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'real-estate', label: 'Real Estate & Property' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'transportation', label: 'Transportation & Logistics' },
  { value: 'other', label: 'Other' },
]

export function BusinessExperience({ answers, onUpdate }: SectionProps) {
  const isOwner = answers.hasOwnedBusiness === 'yes'

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
        Business Experience
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body, 'Nunito', sans-serif)",
          fontSize: '0.95rem',
          color: 'var(--color-gray, #93a0a9)',
          marginBottom: 'var(--space-lg, 2rem)',
        }}
      >
        Your business ownership and management background.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 2rem)' }}>
        <RadioCardGroup
          name="hasOwnedBusiness"
          options={YES_NO_OPTIONS}
          value={answers.hasOwnedBusiness ?? ''}
          onChange={(v) => onUpdate('hasOwnedBusiness', v)}
          label="Do you currently own or have you owned a business?"
        />

        {isOwner && (
          <>
            <RangeSlider
              min={0}
              max={30}
              step={1}
              value={answers.yearsOfOwnership ?? 0}
              onChange={(v) => onUpdate('yearsOfOwnership', v)}
              label="Years of business ownership"
              formatValue={(v) => `${v} ${v === 1 ? 'year' : 'years'}`}
            />

            <RangeSlider
              min={0}
              max={100}
              step={5}
              value={answers.ownershipPercentage ?? 50}
              onChange={(v) => onUpdate('ownershipPercentage', v)}
              label="Ownership percentage"
              formatValue={(v) => `${v}%`}
            />

            <RangeSlider
              min={0}
              max={100}
              step={1}
              value={answers.numberOfEmployees ?? 0}
              onChange={(v) => onUpdate('numberOfEmployees', v)}
              label="Number of employees"
              formatValue={(v) => `${v} employees`}
            />
          </>
        )}

        {answers.hasOwnedBusiness === 'no' && (
          <RangeSlider
            min={0}
            max={30}
            step={1}
            value={answers.seniorManagementYears ?? 0}
            onChange={(v) => onUpdate('seniorManagementYears', v)}
            label="Years of senior management experience"
            formatValue={(v) => `${v} ${v === 1 ? 'year' : 'years'}`}
          />
        )}

        <SearchableDropdown
          options={INDUSTRY_OPTIONS}
          value={answers.businessSector ?? ''}
          onChange={(v) => onUpdate('businessSector', v)}
          label="Primary business sector"
          placeholder="Select industry..."
        />

        <RadioCardGroup
          name="annualRevenue"
          options={REVENUE_OPTIONS}
          value={answers.annualRevenue ?? ''}
          onChange={(v) => onUpdate('annualRevenue', v)}
          label="Annual business revenue (CAD)"
        />

        {isOwner && (
          <RadioCardGroup
            name="operatesInCanada"
            options={YES_NO_OPTIONS}
            value={answers.operatesInCanada ?? ''}
            onChange={(v) => onUpdate('operatesInCanada', v)}
            label="Do you currently operate a business in Canada?"
          />
        )}
      </div>
    </section>
  )
}
