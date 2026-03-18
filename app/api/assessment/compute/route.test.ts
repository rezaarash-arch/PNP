import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import strongCandidate from '@/lib/scoring/__fixtures__/strong-candidate.json'

// Mock the Supabase draws module so it doesn't require real env vars
vi.mock('@/lib/db/draws', () => ({
  getDrawsForAllPrograms: vi.fn().mockResolvedValue(new Map()),
}))

// Import AFTER mocking
const { POST } = await import('./route')

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/assessment/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/assessment/compute', () => {
  it('returns JSON with results array and meta for each program', async () => {
    const req = createRequest(strongCandidate)
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('results')
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBeGreaterThan(0)

    // Each result has required fields including meta
    for (const result of data.results) {
      expect(result).toHaveProperty('programId')
      expect(result).toHaveProperty('meta')
      expect(result.meta).toHaveProperty('status')
      expect(result.meta).toHaveProperty('officialUrl')
      expect(result).toHaveProperty('eligibility')
      expect(result).toHaveProperty('probability')
      expect(result).toHaveProperty('sensitivity')
    }
  })

  it('sorts results with eligible+active first, then eligible+inactive, then ineligible', async () => {
    const req = createRequest(strongCandidate)
    const res = await POST(req)
    const data = await res.json()

    // Three-tier sort: eligible+active → eligible+inactive → ineligible
    let lastTier = -1
    for (const result of data.results) {
      const isEligible = result.eligibility.eligible
      const isActive = result.meta.status === 'active'
      const tier = !isEligible ? 2 : isActive ? 0 : 1

      expect(tier).toBeGreaterThanOrEqual(lastTier)
      lastTier = tier
    }
  })

  it('returns meta with timestamp, programCount, and disclaimers', async () => {
    const req = createRequest(strongCandidate)
    const res = await POST(req)
    const data = await res.json()

    expect(data).toHaveProperty('meta')
    expect(data.meta).toHaveProperty('timestamp')
    expect(data.meta).toHaveProperty('programCount')
    expect(data.meta).toHaveProperty('disclaimers')
    expect(typeof data.meta.timestamp).toBe('string')
    expect(data.meta.programCount).toBe(data.results.length)
    expect(Array.isArray(data.meta.disclaimers)).toBe(true)
    expect(data.meta.disclaimers.length).toBeGreaterThan(0)
  })

  it('returns 400 for invalid body', async () => {
    const req = createRequest({ age: 'not-a-number' })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 for empty body', async () => {
    const req = createRequest({})
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 for missing required fields', async () => {
    const partial = { age: 30, citizenshipCountry: 'CA' }
    const req = createRequest(partial)
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 500 for unparseable JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/assessment/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json at all {{{',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
