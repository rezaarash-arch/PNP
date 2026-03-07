'use client'

import { useState, useRef, useEffect, useCallback, useId, type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId()
  const tooltipId = `${id}-tooltip`
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <span
      ref={containerRef}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-xs, 0.25rem)',
        position: 'relative',
      }}
    >
      <span>{children}</span>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          minWidth: '44px',
          minHeight: '44px',
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--color-cyan, #0099cc)',
          fontSize: '1rem',
          lineHeight: 1,
          borderRadius: '50%',
          position: 'relative',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <text
            x="8"
            y="12"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            fontWeight="bold"
            fontFamily="serif"
          >
            i
          </text>
        </svg>
        <span
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
        >
          More information
        </span>
      </button>

      {isOpen && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: 'var(--space-sm, 0.5rem) var(--space-md, 1rem)',
            background: 'var(--color-navy, #000)',
            color: 'var(--color-white, #fff)',
            fontSize: '0.85rem',
            fontFamily: "var(--font-body, 'Nunito', sans-serif)",
            borderRadius: 'var(--radius-md, 6px)',
            boxShadow: 'var(--shadow-card-hover)',
            whiteSpace: 'normal',
            minWidth: '160px',
            maxWidth: '280px',
            zIndex: 20,
            lineHeight: 1.4,
          }}
        >
          {content}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '8px',
              height: '8px',
              background: 'var(--color-navy, #000)',
            }}
          />
        </span>
      )}
    </span>
  )
}
