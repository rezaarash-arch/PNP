'use client'

import { RadioCardGroup } from '@/components/assessment/inputs/RadioCardGroup'
import { RangeSlider } from '@/components/assessment/inputs/RangeSlider'
import { Tooltip } from '@/components/assessment/inputs/Tooltip'

interface SectionProps {
  answers: Record<string, any>
  onUpdate: (field: string, value: any) => void
}

const LANGUAGE_TEST_OPTIONS = [
  { value: 'ielts', label: 'IELTS', description: 'International English Language Testing System' },
  { value: 'celpip', label: 'CELPIP', description: 'Canadian English Language Proficiency Index Program' },
  { value: 'tef', label: 'TEF', description: "Test d'evaluation de francais" },
  { value: 'tcf', label: 'TCF', description: 'Test de connaissance du francais' },
  { value: 'none', label: 'None', description: 'I have not taken a language test' },
]

const PROFICIENCY_OPTIONS = [
  { value: 'basic', label: 'Basic', description: 'Can understand and use simple phrases' },
  { value: 'intermediate', label: 'Intermediate', description: 'Can handle most everyday situations' },
  { value: 'advanced', label: 'Advanced', description: 'Can express ideas fluently and spontaneously' },
  { value: 'fluent', label: 'Fluent', description: 'Near-native command of the language' },
]

export function Language({ answers, onUpdate }: SectionProps) {
  const hasTest = answers.languageTest && answers.languageTest !== 'none'
  const hasFrenchTest = answers.languageTest === 'tef' || answers.languageTest === 'tcf'

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
        Language Proficiency
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body, 'Nunito', sans-serif)",
          fontSize: '0.95rem',
          color: 'var(--color-gray, #93a0a9)',
          marginBottom: 'var(--space-lg, 2rem)',
        }}
      >
        Your English and French language abilities are key factors in Canadian immigration.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 2rem)' }}>
        <RadioCardGroup
          name="languageTest"
          options={LANGUAGE_TEST_OPTIONS}
          value={answers.languageTest ?? ''}
          onChange={(v) => onUpdate('languageTest', v)}
          label="Have you taken a recognized language test?"
        />

        {hasTest && (
          <div>
            <Tooltip content="The Canadian Language Benchmark (CLB) is the national standard for measuring English and French language proficiency. CLB 5 is generally the minimum for immigration; CLB 7+ is competitive.">
              <span
                style={{
                  fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-navy, #000)',
                }}
              >
                CLB English equivalent level
              </span>
            </Tooltip>
            <div style={{ marginTop: 'var(--space-sm, 0.5rem)' }}>
              <RangeSlider
                min={1}
                max={12}
                step={1}
                value={answers.clbEnglish ?? 5}
                onChange={(v) => onUpdate('clbEnglish', v)}
                label="CLB English level"
                formatValue={(v) => `CLB ${v}`}
              />
            </div>
          </div>
        )}

        {answers.languageTest === 'none' && (
          <RadioCardGroup
            name="selfAssessedEnglish"
            options={PROFICIENCY_OPTIONS}
            value={answers.selfAssessedEnglish ?? ''}
            onChange={(v) => onUpdate('selfAssessedEnglish', v)}
            label="Self-assessed English proficiency"
          />
        )}

        {hasFrenchTest && (
          <div>
            <Tooltip content="The Canadian Language Benchmark (CLB) for French measures your ability in reading, writing, listening, and speaking. Higher levels improve your eligibility for Francophone immigration streams.">
              <span
                style={{
                  fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-navy, #000)',
                }}
              >
                CLB French equivalent level
              </span>
            </Tooltip>
            <div style={{ marginTop: 'var(--space-sm, 0.5rem)' }}>
              <RangeSlider
                min={1}
                max={12}
                step={1}
                value={answers.clbFrench ?? 5}
                onChange={(v) => onUpdate('clbFrench', v)}
                label="CLB French level"
                formatValue={(v) => `CLB ${v}`}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
