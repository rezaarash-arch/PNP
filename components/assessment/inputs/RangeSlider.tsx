'use client'

import { useId, useCallback, useState, useEffect } from 'react'

interface RangeSliderProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  label: string
  unit?: string
  formatValue?: (value: number) => string
}

export function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  label,
  unit,
  formatValue,
}: RangeSliderProps) {
  const id = useId()
  const displayValue = formatValue ? formatValue(value) : String(value)
  const percentage = ((value - min) / (max - min)) * 100

  // Local state for the text input — allows free typing without immediate clamping
  const [draft, setDraft] = useState(String(value))
  const [isFocused, setIsFocused] = useState(false)

  // Sync draft when value changes externally (e.g. from the slider)
  useEffect(() => {
    if (!isFocused) {
      setDraft(String(value))
    }
  }, [value, isFocused])

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value))
    },
    [onChange]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow free typing — only store the raw numeric string
      const raw = e.target.value.replace(/[^0-9]/g, '')
      setDraft(raw)
    },
    []
  )

  const handleInputBlur = useCallback(() => {
    setIsFocused(false)
    const num = Number(draft)
    if (!isNaN(num) && draft !== '') {
      const clamped = Math.min(max, Math.max(min, num))
      onChange(clamped)
      setDraft(String(clamped))
    } else {
      // Revert to current value if input is empty or invalid
      setDraft(String(value))
    }
  }, [draft, min, max, onChange, value])

  const handleInputFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      // Select all text on focus for easy replacement
      e.target.select()
    },
    []
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        ;(e.target as HTMLInputElement).blur()
      }
    },
    []
  )

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 'var(--space-sm, 0.5rem)',
        }}
      >
        <label
          htmlFor={id}
          style={{
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--color-navy, #000)',
          }}
        >
          {label}
        </label>
        <output
          htmlFor={id}
          style={{
            fontFamily: "var(--font-body, 'Nunito', sans-serif)",
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--color-cyan, #0099cc)',
          }}
        >
          {displayValue}
        </output>
      </div>

      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
        style={{
          width: '100%',
          height: '6px',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: `linear-gradient(to right, var(--color-cyan, #0099cc) ${percentage}%, #e5e7eb ${percentage}%)`,
          borderRadius: '3px',
          outline: 'none',
          cursor: 'pointer',
          minHeight: '44px',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-xs, 0.25rem)',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-gray, #93a0a9)',
          }}
        >
          {formatValue ? formatValue(min) : min}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <label
            htmlFor={`${id}-direct`}
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-gray, #93a0a9)',
            }}
          >
            or type:
          </label>
          <input
            type="text"
            id={`${id}-direct`}
            inputMode="numeric"
            value={draft}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            aria-label={`${label} direct entry`}
            style={{
              width: '60px',
              padding: '4px 8px',
              border: '1px solid #e5e7eb',
              borderRadius: 'var(--radius-sm, 4px)',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontFamily: "var(--font-body, 'Nunito', sans-serif)",
            }}
          />
          {unit && (
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-gray, #93a0a9)',
              }}
            >
              {unit}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-gray, #93a0a9)',
          }}
        >
          {formatValue ? formatValue(max) : max}
        </span>
      </div>
    </div>
  )
}
