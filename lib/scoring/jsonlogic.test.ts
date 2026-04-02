import { describe, it, expect } from 'vitest'
import { evaluateCondition } from './jsonlogic'

describe('evaluateCondition', () => {
  it('evaluates >= comparison correctly', () => {
    const condition = { '>=': [{ var: 'age' }, 21] }
    expect(evaluateCondition(condition, { age: 25 })).toBe(true)
    expect(evaluateCondition(condition, { age: 20 })).toBe(false)
    expect(evaluateCondition(condition, { age: 21 })).toBe(true)
  })

  it('evaluates OR conditions', () => {
    const condition = {
      or: [
        { '>=': [{ var: 'clbEnglish' }, 4] },
        { '>=': [{ var: 'clbFrench' }, 4] },
      ],
    }
    expect(evaluateCondition(condition, { clbEnglish: 5, clbFrench: null })).toBe(true)
    expect(evaluateCondition(condition, { clbEnglish: null, clbFrench: 6 })).toBe(true)
    expect(evaluateCondition(condition, { clbEnglish: 2, clbFrench: 2 })).toBe(false)
  })

  it('evaluates == comparison', () => {
    const condition = { '==': [{ var: 'intendedLocation' }, 'rural'] }
    expect(evaluateCondition(condition, { intendedLocation: 'rural' })).toBe(true)
    expect(evaluateCondition(condition, { intendedLocation: 'metro' })).toBe(false)
  })

  it('handles null variables safely — null never satisfies >=', () => {
    const condition = { '>=': [{ var: 'clbEnglish' }, 4] }
    expect(evaluateCondition(condition, { clbEnglish: null })).toBe(false)
  })

  it('handles null variables safely — null >= 0 should be false', () => {
    const condition = { '>=': [{ var: 'clbEnglish' }, 0] }
    expect(evaluateCondition(condition, { clbEnglish: null })).toBe(false)
  })

  it('evaluates boolean conditions', () => {
    const condition = { '==': [{ var: 'hasExploratoryVisit' }, true] }
    expect(evaluateCondition(condition, { hasExploratoryVisit: true })).toBe(true)
    expect(evaluateCondition(condition, { hasExploratoryVisit: false })).toBe(false)
  })

  it('evaluates AND conditions', () => {
    const condition = {
      and: [
        { '>=': [{ var: 'age' }, 21] },
        { '>=': [{ var: 'businessOwnershipYears' }, 3] },
      ],
    }
    expect(evaluateCondition(condition, { age: 30, businessOwnershipYears: 5 })).toBe(true)
    expect(evaluateCondition(condition, { age: 30, businessOwnershipYears: 1 })).toBe(false)
    expect(evaluateCondition(condition, { age: 18, businessOwnershipYears: 5 })).toBe(false)
  })

  it('handles missing variables gracefully', () => {
    const condition = { '>=': [{ var: 'nonExistentField' }, 4] }
    expect(evaluateCondition(condition, { age: 30 })).toBe(false)
  })
})
