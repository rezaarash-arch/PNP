'use client'

import { RadioCardGroup } from '@/components/assessment/inputs/RadioCardGroup'
import { CurrencyInput } from '@/components/assessment/inputs/CurrencyInput'
import { Tooltip } from '@/components/assessment/inputs/Tooltip'

interface SectionProps {
  answers: Record<string, any>
  onUpdate: (field: string, value: any) => void
}

const PROOF_OF_FUNDS_OPTIONS = [
  { value: 'yes', label: 'Yes', description: 'I have verified documentation ready' },
  { value: 'in-process', label: 'In Process', description: 'Currently gathering documentation' },
  { value: 'no', label: 'No', description: 'I have not started this process' },
]

export function FinancialProfile({ answers, onUpdate }: SectionProps) {
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
        Financial Profile
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body, 'Nunito', sans-serif)",
          fontSize: '0.95rem',
          color: 'var(--color-gray, #93a0a9)',
          marginBottom: 'var(--space-lg, 2rem)',
        }}
      >
        Your financial capacity is a critical factor for business immigration programs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 2rem)' }}>
        <div>
          <Tooltip content="Net worth is the total value of all your assets (cash, property, investments, business equity) minus your liabilities (debts, loans, mortgages). Most PNP entrepreneur programs require a minimum net worth, typically between $300,000 and $600,000 CAD.">
            <span
              style={{
                fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--color-navy, #000)',
              }}
            >
              Estimated personal net worth (CAD)
            </span>
          </Tooltip>
          <div style={{ marginTop: 'var(--space-sm, 0.5rem)' }}>
            <CurrencyInput
              value={answers.netWorth ?? null}
              onChange={(v) => onUpdate('netWorth', v)}
              label="Personal net worth in CAD"
              placeholder="e.g. 500,000"
              min={0}
            />
          </div>
        </div>

        <CurrencyInput
          value={answers.liquidAssets ?? null}
          onChange={(v) => onUpdate('liquidAssets', v)}
          label="Liquid assets available (CAD)"
          placeholder="e.g. 200,000"
          min={0}
        />

        <CurrencyInput
          value={answers.investmentAmount ?? null}
          onChange={(v) => onUpdate('investmentAmount', v)}
          label="How much are you willing to invest in a Canadian business? (CAD)"
          placeholder="e.g. 150,000"
          min={0}
        />

        <RadioCardGroup
          name="proofOfFunds"
          options={PROOF_OF_FUNDS_OPTIONS}
          value={answers.proofOfFunds ?? ''}
          onChange={(v) => onUpdate('proofOfFunds', v)}
          label="Can you provide verified proof of funds?"
        />
      </div>
    </section>
  )
}
