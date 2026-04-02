'use client'

import { useState } from 'react'
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
  { value: 'tef', label: 'TEF', description: "Test d'évaluation de français" },
  { value: 'tcf', label: 'TCF', description: 'Test de connaissance du français' },
  { value: 'none', label: 'None', description: 'I have not taken a language test yet' },
]

const PROFICIENCY_OPTIONS = [
  { value: 'basic', label: 'Basic', description: 'Can understand and use simple phrases' },
  { value: 'intermediate', label: 'Intermediate', description: 'Can handle most everyday situations' },
  { value: 'advanced', label: 'Advanced', description: 'Can express ideas fluently and spontaneously' },
  { value: 'fluent', label: 'Fluent', description: 'Near-native command of the language' },
]

const CLB_CONVERSION_DATA = {
  ielts: {
    title: 'IELTS to CLB Conversion',
    rows: [
      { clb: '10+', listening: '8.5+', reading: '8.0+', writing: '7.5+', speaking: '7.5+' },
      { clb: '9', listening: '8.0', reading: '7.0', writing: '7.0', speaking: '7.0' },
      { clb: '8', listening: '7.5', reading: '6.5', writing: '6.5', speaking: '6.5' },
      { clb: '7', listening: '6.0', reading: '6.0', writing: '6.0', speaking: '6.0' },
      { clb: '6', listening: '5.5', reading: '5.0', writing: '5.5', speaking: '5.5' },
      { clb: '5', listening: '5.0', reading: '4.0', writing: '5.0', speaking: '5.0' },
      { clb: '4', listening: '4.5', reading: '3.5', writing: '4.0', speaking: '4.0' },
    ],
  },
  celpip: {
    title: 'CELPIP to CLB Conversion',
    rows: [
      { clb: '10+', listening: '10+', reading: '10+', writing: '10+', speaking: '10+' },
      { clb: '9', listening: '9', reading: '9', writing: '9', speaking: '9' },
      { clb: '8', listening: '8', reading: '8', writing: '8', speaking: '8' },
      { clb: '7', listening: '7', reading: '7', writing: '7', speaking: '7' },
      { clb: '6', listening: '6', reading: '6', writing: '6', speaking: '6' },
      { clb: '5', listening: '5', reading: '5', writing: '5', speaking: '5' },
      { clb: '4', listening: '4', reading: '4', writing: '4', speaking: '4' },
    ],
  },
  tef: {
    title: 'TEF to CLB Conversion (NCLC)',
    rows: [
      { clb: '10+', listening: '316+', reading: '263+', writing: '393+', speaking: '393+' },
      { clb: '9', listening: '298–315', reading: '248–262', writing: '371–392', speaking: '371–392' },
      { clb: '8', listening: '280–297', reading: '233–247', writing: '349–370', speaking: '349–370' },
      { clb: '7', listening: '249–279', reading: '207–232', writing: '310–348', speaking: '310–348' },
      { clb: '6', listening: '217–248', reading: '181–206', writing: '271–309', speaking: '271–309' },
      { clb: '5', listening: '181–216', reading: '151–180', writing: '226–270', speaking: '226–270' },
    ],
  },
  tcf: {
    title: 'TCF to CLB Conversion (NCLC)',
    rows: [
      { clb: '10+', listening: '549+', reading: '549+', writing: '16+', speaking: '16+' },
      { clb: '9', listening: '523–548', reading: '524–548', writing: '14–15', speaking: '14–15' },
      { clb: '8', listening: '503–522', reading: '499–523', writing: '12–13', speaking: '12–13' },
      { clb: '7', listening: '458–502', reading: '453–498', writing: '10–11', speaking: '10–11' },
      { clb: '6', listening: '398–457', reading: '406–452', writing: '7–9', speaking: '7–9' },
      { clb: '5', listening: '369–397', reading: '375–405', writing: '6', speaking: '6' },
    ],
  },
}

function CLBConversionTable({ testType }: { testType: string }) {
  const data = CLB_CONVERSION_DATA[testType as keyof typeof CLB_CONVERSION_DATA]
  if (!data) return null

  const cellStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: '0.8rem',
    borderBottom: '1px solid #e2e8f0',
    textAlign: 'center',
  }
  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    background: '#f1f5f9',
    color: '#334155',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        marginTop: '0.75rem',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
        }}
      >
        {data.title}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>CLB</th>
              <th style={headerStyle}>Listening</th>
              <th style={headerStyle}>Reading</th>
              <th style={headerStyle}>Writing</th>
              <th style={headerStyle}>Speaking</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.clb}>
                <td style={{ ...cellStyle, fontWeight: 700, color: '#6366f1' }}>{row.clb}</td>
                <td style={cellStyle}>{row.listening}</td>
                <td style={cellStyle}>{row.reading}</td>
                <td style={cellStyle}>{row.writing}</td>
                <td style={cellStyle}>{row.speaking}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Language({ answers, onUpdate }: SectionProps) {
  const [showTable, setShowTable] = useState(false)
  const hasTest = answers.languageTest && answers.languageTest !== 'none'
  const hasEnglishTest = answers.languageTest === 'ielts' || answers.languageTest === 'celpip'
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
          label="Have you taken or are you planning to take a recognized language test?"
        />

        {hasEnglishTest && (
          <div>
            <Tooltip content="The Canadian Language Benchmark (CLB) is the national standard for measuring English language proficiency. CLB 5 is generally the minimum for immigration; CLB 7+ is competitive.">
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
            <button
              type="button"
              onClick={() => setShowTable((p) => !p)}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#6366f1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              {showTable ? 'Hide' : 'Show'} CLB conversion table
            </button>
            {showTable && <CLBConversionTable testType={answers.languageTest} />}
          </div>
        )}

        {hasFrenchTest && (
          <div>
            <Tooltip content="The Canadian Language Benchmark (CLB/NCLC) for French measures your ability in reading, writing, listening, and speaking. Higher levels improve your eligibility for Francophone immigration streams.">
              <span
                style={{
                  fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-navy, #000)',
                }}
              >
                CLB French equivalent level (NCLC)
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
                formatValue={(v) => `NCLC ${v}`}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowTable((p) => !p)}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#6366f1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              {showTable ? 'Hide' : 'Show'} CLB conversion table
            </button>
            {showTable && <CLBConversionTable testType={answers.languageTest} />}
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
      </div>
    </section>
  )
}
