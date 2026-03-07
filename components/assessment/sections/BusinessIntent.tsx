'use client'

import { RadioCardGroup } from '@/components/assessment/inputs/RadioCardGroup'
import { RangeSlider } from '@/components/assessment/inputs/RangeSlider'
import { Tooltip } from '@/components/assessment/inputs/Tooltip'

interface SectionProps {
  answers: Record<string, any>
  onUpdate: (field: string, value: any) => void
}

const PROVINCE_OPTIONS = [
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

const LOCATION_PREFERENCE_OPTIONS = [
  { value: 'major-city', label: 'Major City', description: 'Toronto, Vancouver, Montreal, Calgary, etc.' },
  { value: 'smaller-city', label: 'Smaller City / Town', description: 'Regional centres and mid-sized communities' },
  { value: 'rural', label: 'Rural / Remote', description: 'Small towns and rural communities' },
  { value: 'flexible', label: 'Flexible', description: 'Open to any location' },
]

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function BusinessIntent({ answers, onUpdate }: SectionProps) {
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
        Business Intent
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body, 'Nunito', sans-serif)",
          fontSize: '0.95rem',
          color: 'var(--color-gray, #93a0a9)',
          marginBottom: 'var(--space-lg, 2rem)',
        }}
      >
        Your plans for establishing a business in Canada.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 2rem)' }}>
        <RadioCardGroup
          name="interestedProvinces"
          options={PROVINCE_OPTIONS}
          value={answers.interestedProvince ?? ''}
          onChange={(v) => onUpdate('interestedProvince', v)}
          label="Which province interests you most?"
        />

        <RadioCardGroup
          name="locationPreference"
          options={LOCATION_PREFERENCE_OPTIONS}
          value={answers.locationPreference ?? ''}
          onChange={(v) => onUpdate('locationPreference', v)}
          label="Location preference"
        />

        <RangeSlider
          min={0}
          max={50}
          step={1}
          value={answers.plannedEmployees ?? 1}
          onChange={(v) => onUpdate('plannedEmployees', v)}
          label="Planned number of Canadian employees"
          formatValue={(v) => `${v} ${v === 1 ? 'employee' : 'employees'}`}
        />

        <div>
          <Tooltip content="A Post-Graduation Work Permit (PGWP) is issued to international students who have graduated from an eligible Canadian institution. Holding a PGWP can give you Canadian work experience and strengthen your immigration profile.">
            <span
              style={{
                fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--color-navy, #000)',
              }}
            >
              Do you hold a PGWP (Post-Graduation Work Permit)?
            </span>
          </Tooltip>
          <div style={{ marginTop: 'var(--space-sm, 0.5rem)' }}>
            <RadioCardGroup
              name="hasPGWP"
              options={YES_NO_OPTIONS}
              value={answers.hasPGWP ?? ''}
              onChange={(v) => onUpdate('hasPGWP', v)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
