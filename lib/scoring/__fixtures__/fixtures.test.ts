import { describe, it, expect } from 'vitest'
import { UserProfileSchema } from '@/lib/validation/schemas'
import strongCandidate from './strong-candidate.json'
import minimalCandidate from './minimal-candidate.json'
import graduateCandidate from './graduate-candidate.json'
import highNetWorthLowExp from './high-net-worth-low-exp.json'
import ineligibleAll from './ineligible-all.json'

const fixtures = {
  strongCandidate,
  minimalCandidate,
  graduateCandidate,
  highNetWorthLowExp,
  ineligibleAll,
}

describe('Test fixtures', () => {
  Object.entries(fixtures).forEach(([name, fixture]) => {
    it(`${name} passes UserProfile validation`, () => {
      expect(() => UserProfileSchema.parse(fixture)).not.toThrow()
    })
  })
})
