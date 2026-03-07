import { describe, it, expect } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import strongCandidate from '@/lib/scoring/__fixtures__/strong-candidate.json'

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/assessment/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/assessment/compute', () => {
  it('returns JSON with results array sorted by probability', async () => {
    const req = createRequest(strongCandidate)
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('results')
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBeGreaterThan(0)

    // Each result has required fields
    for (const result of data.results) {
      expect(result).toHaveProperty('programId')
      expect(result).toHaveProperty('eligibility')
      expect(result).toHaveProperty('probability')
      expect(result).toHaveProperty('sensitivity')
    }

    // Results are sorted by probability descending
    for (let i = 1; i < data.results.length; i++) {
      expect(data.results[i].probability.percent).toBeLessThanOrEqual(
        data.results[i - 1].probability.percent
      )
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
