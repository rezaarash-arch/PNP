/**
 * Smoke test: exercises the scoring engine with all fixture profiles
 * to verify end-to-end integration of rules, engine, and evaluator.
 *
 * Run: npx tsx scripts/smoke-test.ts
 */

import { evaluateAllPrograms } from '../lib/scoring/evaluator'

// Import all fixtures
import strongCandidate from '../lib/scoring/__fixtures__/strong-candidate.json'
import minimalCandidate from '../lib/scoring/__fixtures__/minimal-candidate.json'
import graduateCandidate from '../lib/scoring/__fixtures__/graduate-candidate.json'
import highNetWorthLowExp from '../lib/scoring/__fixtures__/high-net-worth-low-exp.json'
import ineligibleAll from '../lib/scoring/__fixtures__/ineligible-all.json'

import type { UserProfile } from '../lib/types/assessment'

const fixtures: Record<string, UserProfile> = {
  'strong-candidate': strongCandidate as unknown as UserProfile,
  'minimal-candidate': minimalCandidate as unknown as UserProfile,
  'graduate-candidate': graduateCandidate as unknown as UserProfile,
  'high-net-worth-low-exp': highNetWorthLowExp as unknown as UserProfile,
  'ineligible-all': ineligibleAll as unknown as UserProfile,
}

const EXPECTED_PROGRAM_COUNT = 21

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`)
    passed++
  } else {
    console.error(`  FAIL: ${message}`)
    failed++
  }
}

console.log('\nPNP Assessment Tool -- Smoke Test')
console.log('='.repeat(50))

// Test 1: Evaluate all fixtures through the full pipeline
for (const [name, profile] of Object.entries(fixtures)) {
  console.log(`\nTesting fixture: ${name}`)

  try {
    const results = evaluateAllPrograms(profile, {})

    assert(
      results.length === EXPECTED_PROGRAM_COUNT,
      `Returns ${EXPECTED_PROGRAM_COUNT} program results (got ${results.length})`
    )

    assert(
      results.every(r => r.programId && typeof r.programId === 'string'),
      'Every result has a valid programId'
    )

    assert(
      results.every(r => r.eligibility !== undefined),
      'Every result has eligibility data'
    )

    assert(
      results.every(r => r.probability !== undefined),
      'Every result has probability data'
    )

    assert(
      results.every(r => r.probability.percent >= 0 && r.probability.percent <= 100),
      'All probability percentages are 0-100'
    )

    assert(
      results.every(r => ['strong', 'competitive', 'moderate', 'low', 'unlikely', 'ineligible'].includes(r.probability.tier)),
      'All probability tiers are valid'
    )

    // Specific fixture assertions
    if (name === 'ineligible-all') {
      const allIneligible = results.every(r => r.eligibility.eligible === false)
      assert(allIneligible, 'Ineligible candidate fails ALL programs')
    }

    if (name === 'strong-candidate') {
      const eligibleCount = results.filter(r => r.eligibility.eligible === true).length
      assert(eligibleCount >= 5, `Strong candidate is eligible for ${eligibleCount} programs (expected >=5)`)
    }

    // Check results are sorted by probability descending
    let sorted = true
    for (let i = 1; i < results.length; i++) {
      if (results[i].probability.percent > results[i - 1].probability.percent) {
        sorted = false
        break
      }
    }
    assert(sorted, 'Results are sorted by probability descending')

  } catch (error) {
    console.error(`  FAIL EXCEPTION: ${error}`)
    failed++
  }
}

// Test 2: Verify specific program IDs exist
console.log('\nVerifying program registry')
const allResults = evaluateAllPrograms(fixtures['strong-candidate'], {})
const programIds = allResults.map(r => r.programId)

const expectedPrograms = [
  'bc-entrepreneur-base',
  'bc-entrepreneur-regional',
  'bc-entrepreneur-strategic',
  'ab-rural-entrepreneur',
  'ab-graduate-entrepreneur',
  'ab-foreign-graduate',
  'ab-farm',
  'sk-entrepreneur',
  'sk-graduate-entrepreneur',
  'mb-entrepreneur',
  'mb-farm-investor',
  'on-entrepreneur',
  'nb-entrepreneurial',
  'nb-post-grad',
  'ns-entrepreneur',
  'ns-graduate-entrepreneur',
  'pei-work-permit',
  'nl-entrepreneur',
  'nl-graduate-entrepreneur',
  'nwt-business',
  'yk-business-nominee',
]

for (const id of expectedPrograms) {
  assert(programIds.includes(id), `Program "${id}" exists in results`)
}

// Summary
console.log('\n' + '='.repeat(50))
console.log(`\nSmoke Test Summary: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('\nSMOKE TEST FAILED')
  process.exit(1)
} else {
  console.log('\nALL SMOKE TESTS PASSED')
}
