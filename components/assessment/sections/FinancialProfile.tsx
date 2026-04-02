'use client'

import { useState, useMemo } from 'react'
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

const INVESTMENT_REQUIREMENTS = [
  { province: 'British Columbia', minInvestment: '$200,000', minNetWorth: '$600,000' },
  { province: 'Ontario', minInvestment: '$200,000–$600,000', minNetWorth: '$800,000' },
  { province: 'Alberta', minInvestment: '$100,000–$200,000', minNetWorth: '$300,000' },
  { province: 'Saskatchewan', minInvestment: '$200,000–$300,000', minNetWorth: '$500,000' },
  { province: 'Manitoba', minInvestment: '$150,000–$250,000', minNetWorth: '$350,000–$500,000' },
  { province: 'New Brunswick', minInvestment: '$150,000', minNetWorth: '$300,000' },
  { province: 'Nova Scotia', minInvestment: '$150,000', minNetWorth: '$600,000' },
  { province: 'PEI', minInvestment: '$150,000', minNetWorth: '$600,000' },
  { province: 'Yukon', minInvestment: '$150,000', minNetWorth: '$300,000' },
  { province: 'NWT', minInvestment: '$150,000', minNetWorth: '$300,000' },
]

const CURRENCY_RATES: Record<string, number> = {
  USD: 1.36,
  EUR: 1.49,
  GBP: 1.72,
  INR: 0.016,
  CNY: 0.19,
  AED: 0.37,
  AUD: 0.89,
  SGD: 1.02,
  HKD: 0.17,
  PHP: 0.024,
}

function CurrencyConverter() {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')

  const cadAmount = useMemo(() => {
    const num = parseFloat(amount.replace(/,/g, ''))
    if (isNaN(num)) return null
    return Math.round(num * CURRENCY_RATES[currency])
  }, [amount, currency])

  return (
    <div
      style={{
        background: '#f8fafc',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '14px 16px',
        marginTop: '0.75rem',
      }}
    >
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
        Quick Currency Converter (approximate)
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          style={{
            flex: '1 1 120px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.9rem',
            minWidth: 0,
          }}
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.9rem',
            background: '#fff',
          }}
        >
          {Object.keys(CURRENCY_RATES).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.9rem', color: '#64748b', whiteSpace: 'nowrap' }}>
          ≈{' '}
          <strong style={{ color: '#059669' }}>
            {cadAmount !== null ? `$${cadAmount.toLocaleString()} CAD` : '—'}
          </strong>
        </span>
      </div>
      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>
        Rates are approximate and for reference only. Actual rates may vary.
      </div>
    </div>
  )
}

function InvestmentRequirementsTable() {
  const cellStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '0.8rem',
    borderBottom: '1px solid #e2e8f0',
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
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
        }}
      >
        Provincial Investment Requirements (CAD)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>Province</th>
              <th style={headerStyle}>Min. Investment</th>
              <th style={headerStyle}>Min. Net Worth</th>
            </tr>
          </thead>
          <tbody>
            {INVESTMENT_REQUIREMENTS.map((row) => (
              <tr key={row.province}>
                <td style={{ ...cellStyle, fontWeight: 600, color: '#1e293b' }}>{row.province}</td>
                <td style={cellStyle}>{row.minInvestment}</td>
                <td style={cellStyle}>{row.minNetWorth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function FinancialProfile({ answers, onUpdate }: SectionProps) {
  const [showRequirements, setShowRequirements] = useState(false)
  const [showConverter, setShowConverter] = useState(false)

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
          <div style={{ display: 'flex', gap: '12px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowConverter((p) => !p)}
              style={{
                background: showConverter ? '#059669' : '#f1f5f9',
                color: showConverter ? '#fff' : '#334155',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showConverter ? '✓ ' : ''}Currency Converter
            </button>
            <button
              type="button"
              onClick={() => setShowRequirements((p) => !p)}
              style={{
                background: showRequirements ? '#059669' : '#f1f5f9',
                color: showRequirements ? '#fff' : '#334155',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showRequirements ? '✓ ' : ''}Provincial Requirements
            </button>
          </div>
          {showConverter && <CurrencyConverter />}
          {showRequirements && <InvestmentRequirementsTable />}
        </div>

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

        <div>
          <Tooltip content="Liquid assets are funds you can access quickly — bank accounts, savings, stocks, mutual funds, and other easily convertible investments. This does NOT include real estate, business equity, or retirement accounts with withdrawal penalties.">
            <span
              style={{
                fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--color-navy, #000)',
              }}
            >
              Liquid assets available (CAD)
            </span>
          </Tooltip>
          <p
            style={{
              fontSize: '0.8rem',
              color: '#64748b',
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Cash, savings, stocks, and easily convertible investments — excludes real estate and business equity.
          </p>
          <div style={{ marginTop: 'var(--space-sm, 0.5rem)' }}>
            <CurrencyInput
              value={answers.liquidAssets ?? null}
              onChange={(v) => onUpdate('liquidAssets', v)}
              label="Liquid assets in CAD"
              placeholder="e.g. 200,000"
              min={0}
            />
          </div>
        </div>

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
