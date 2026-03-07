import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RadioCardGroup } from './RadioCardGroup'
import { CurrencyInput } from './CurrencyInput'
import { Tooltip } from './Tooltip'

describe('RadioCardGroup', () => {
  it('renders all options', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
      { value: 'c', label: 'Option C' },
    ]
    render(<RadioCardGroup name="test" options={options} value="" onChange={() => {}} />)
    expect(screen.getByText('Option A')).toBeDefined()
    expect(screen.getByText('Option B')).toBeDefined()
    expect(screen.getByText('Option C')).toBeDefined()
  })

  it('marks selected option', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ]
    render(<RadioCardGroup name="test" options={options} value="a" onChange={() => {}} />)
    const radioA = screen.getByLabelText('Option A')
    expect((radioA as HTMLInputElement).checked).toBe(true)
  })

  it('calls onChange when option clicked', () => {
    const onChange = vi.fn()
    const options = [{ value: 'a', label: 'Option A' }]
    render(<RadioCardGroup name="test" options={options} value="" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Option A'))
    expect(onChange).toHaveBeenCalledWith('a')
  })
})

describe('CurrencyInput', () => {
  it('formats value with dollar sign and commas', () => {
    render(<CurrencyInput value={1500000} onChange={() => {}} label="Net Worth" />)
    const input = screen.getByLabelText('Net Worth')
    expect((input as HTMLInputElement).value).toContain('1,500,000')
  })
})

describe('Tooltip', () => {
  it('renders trigger and shows content on click', () => {
    render(<Tooltip content="This is help text">What is CLB?</Tooltip>)
    expect(screen.getByText('What is CLB?')).toBeDefined()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('This is help text')).toBeDefined()
  })
})
