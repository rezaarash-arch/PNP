'use client'

import { useState, useRef, useCallback, useEffect, useId } from 'react'

interface SearchableDropdownProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  label,
  placeholder = 'Search...',
}: SearchableDropdownProps) {
  const id = useId()
  const listboxId = `${id}-listbox`
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)
  const filteredOptions = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const displayValue = isOpen ? query : selectedOption?.label ?? ''

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setQuery('')
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
      setQuery('')
      setActiveIndex(-1)
      inputRef.current?.blur()
    },
    [onChange]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value)
      setActiveIndex(-1)
      if (!isOpen) setIsOpen(true)
    },
    [isOpen]
  )

  const handleFocus = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setActiveIndex(-1)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setIsOpen(true)
          e.preventDefault()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
            handleSelect(filteredOptions[activeIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setQuery('')
          setActiveIndex(-1)
          break
      }
    },
    [isOpen, filteredOptions, activeIndex, handleSelect]
  )

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
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
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-label={label}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: '100%',
            padding: 'var(--space-sm, 0.5rem) var(--space-md, 1rem)',
            paddingRight: '2.5rem',
            border: `2px solid ${isOpen ? 'var(--color-cyan, #0099cc)' : '#e5e7eb'}`,
            borderRadius: 'var(--radius-md, 6px)',
            fontFamily: "var(--font-body, 'Nunito', sans-serif)",
            fontSize: '1rem',
            color: 'var(--color-navy, #000)',
            outline: 'none',
            minHeight: '44px',
            background: 'var(--color-white, #fff)',
            transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`,
            transition: 'transform 0.15s',
            pointerEvents: 'none',
            fontSize: '0.8rem',
            color: 'var(--color-gray, #93a0a9)',
          }}
        >
          &#9660;
        </span>
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            border: '1px solid #e5e7eb',
            borderRadius: 'var(--radius-md, 6px)',
            background: 'var(--color-white, #fff)',
            boxShadow: 'var(--shadow-card-hover)',
            zIndex: 10,
            marginTop: '4px',
          }}
        >
          {filteredOptions.length === 0 ? (
            <li
              style={{
                padding: 'var(--space-sm, 0.5rem) var(--space-md, 1rem)',
                color: 'var(--color-gray, #93a0a9)',
                fontSize: '0.9rem',
              }}
            >
              No results found
            </li>
          ) : (
            filteredOptions.map((option, index) => {
              const isActive = index === activeIndex
              const isSelected = option.value === value

              return (
                <li
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(option.value)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  style={{
                    padding: 'var(--space-sm, 0.5rem) var(--space-md, 1rem)',
                    cursor: 'pointer',
                    background: isActive
                      ? 'rgba(0, 153, 204, 0.1)'
                      : 'transparent',
                    color: isSelected
                      ? 'var(--color-cyan, #0099cc)'
                      : 'var(--color-navy, #000)',
                    fontWeight: isSelected ? 600 : 400,
                    fontFamily: "var(--font-body, 'Nunito', sans-serif)",
                    fontSize: '0.95rem',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {option.label}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
