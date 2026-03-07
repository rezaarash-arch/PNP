'use client'

import { useState, useCallback, useId } from 'react'

interface CurrencyInputProps {
  value: number | null
  onChange: (value: number | null) => void
  label: string
  placeholder?: string
  min?: number
  max?: number
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return ''
  return value.toLocaleString('en-US')
}

function parseCurrency(input: string): number | null {
  const cleaned = input.replace(/[^0-9.-]/g, '')
  if (cleaned === '' || cleaned === '-') return null
  const num = Number(cleaned)
  return isNaN(num) ? null : num
}

export function CurrencyInput({
  value,
  onChange,
  label,
  placeholder = '0',
  min,
  max,
}: CurrencyInputProps) {
  const id = useId()
  const [isFocused, setIsFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')

  const displayValue = isFocused
    ? rawInput
    : formatCurrency(value)

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    setRawInput(value !== null && value !== undefined ? String(value) : '')
  }, [value])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    let parsed = parseCurrency(rawInput)
    if (parsed !== null) {
      if (min !== undefined && parsed < min) parsed = min
      if (max !== undefined && parsed > max) parsed = max
    }
    onChange(parsed)
  }, [rawInput, onChange, min, max])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setRawInput(val)

      const parsed = parseCurrency(val)
      if (parsed !== null) {
        onChange(parsed)
      }
    },
    [onChange]
  )

  return (
    <div style={{ width: '100%' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--color-navy, #000)',
          marginBottom: 'var(--space-xs, 0.25rem)',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: `2px solid ${isFocused ? 'var(--color-cyan, #0099cc)' : '#e5e7eb'}`,
          borderRadius: 'var(--radius-md, 6px)',
          background: 'var(--color-white, #fff)',
          transition: 'border-color 0.15s',
          overflow: 'hidden',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 var(--space-sm, 0.5rem)',
            fontFamily: "var(--font-body, 'Nunito', sans-serif)",
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-gray, #93a0a9)',
            background: '#f3f4f6',
            alignSelf: 'stretch',
            minHeight: '44px',
          }}
        >
          $
        </span>
        <input
          type="text"
          id={id}
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label={label}
          style={{
            flex: 1,
            padding: 'var(--space-sm, 0.5rem) var(--space-md, 1rem)',
            border: 'none',
            outline: 'none',
            fontFamily: "var(--font-body, 'Nunito', sans-serif)",
            fontSize: '1rem',
            color: 'var(--color-navy, #000)',
            background: 'transparent',
            minHeight: '44px',
          }}
        />
      </div>
    </div>
  )
}
