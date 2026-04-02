'use client'

import { RadioCardGroup } from '@/components/assessment/inputs/RadioCardGroup'
import { RangeSlider } from '@/components/assessment/inputs/RangeSlider'

interface SectionProps {
  answers: Record<string, any>
  onUpdate: (field: string, value: any) => void
}

const PROVINCE_OPTIONS = [
  { value: 'no-preference', label: 'No Preference / Open to All', description: 'I\'m open to any province or territory' },
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

        <div>
          <RangeSlider
            min={0}
            max={50}
            step={1}
            value={answers.plannedEmployees ?? 1}
            onChange={(v) => onUpdate('plannedEmployees', v)}
            label="Planned number of Canadian employees"
            formatValue={(v) => `${v} ${v === 1 ? 'employee' : 'employees'}`}
          />
          <div
            style={{
              marginTop: '0.75rem',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '12px 16px',
              fontSize: '0.8rem',
              color: '#475569',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#1e293b' }}>Typical requirements by province:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
              <li>Most provinces require at least <strong>1 full-time Canadian employee</strong></li>
              <li>BC and Ontario may expect <strong>2–3 employees</strong> for higher-tier programs</li>
              <li>Creating more jobs generally strengthens your application</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
