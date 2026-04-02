'use client'

import { useId } from 'react'

interface RadioCardGroupProps {
  name: string
  options: { value: string; label: string; description?: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
}

export function RadioCardGroup({
  name,
  options,
  value,
  onChange,
  label,
}: RadioCardGroupProps) {
  const groupId = useId()

  return (
    <fieldset
      style={{ border: 'none', margin: 0, padding: 0 }}
      role="radiogroup"
      aria-label={label || name}
    >
      {label && (
        <legend
          style={{
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: 'var(--space-sm, 0.5rem)',
            color: 'var(--color-navy, #000)',
          }}
        >
          {label}
        </legend>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
          gap: 'var(--space-md, 1rem)',
        }}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`
          const isSelected = value === option.value

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-sm, 0.5rem)',
                padding: 'var(--space-md, 1rem)',
                border: `2px solid ${isSelected ? 'var(--color-cyan, #0099cc)' : '#e5e7eb'}`,
                borderRadius: 'var(--radius-lg, 12px)',
                cursor: 'pointer',
                background: isSelected ? 'rgba(0, 153, 204, 0.05)' : 'var(--color-white, #fff)',
                boxShadow: 'var(--shadow-card)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                minHeight: '44px',
                position: 'relative',
              }}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  borderWidth: 0,
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? 'var(--color-cyan, #0099cc)' : '#d1d5db'}`,
                  background: isSelected ? 'var(--color-cyan, #0099cc)' : 'transparent',
                  marginTop: '2px',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-body, 'Nunito', sans-serif)",
                    fontSize: '0.95rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: 'var(--color-navy, #000)',
                  }}
                >
                  {option.label}
                </span>
                {option.description && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'var(--color-gray, #93a0a9)',
                      marginTop: 'var(--space-xs, 0.25rem)',
                    }}
                  >
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
