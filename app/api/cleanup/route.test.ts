import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock deleteExpiredAssessments before importing the route
const mockDeleteExpired = vi.fn()
vi.mock('@/lib/db/assessments', () => ({
  deleteExpiredAssessments: (...args: unknown[]) => mockDeleteExpired(...args),
}))

import { POST } from './route'

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['authorization'] = authHeader
  }
  return new NextRequest('http://localhost:3000/api/cleanup', {
    method: 'POST',
    headers,
  })
}

describe('POST /api/cleanup', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-secret-123')
    mockDeleteExpired.mockReset()
  })

  it('returns 401 when authorization header is missing', async () => {
    const req = createRequest()
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 401 when authorization header has wrong token', async () => {
    const req = createRequest('Bearer wrong-secret')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 401 when CRON_SECRET env var is not set', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const req = createRequest('Bearer test-secret-123')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 200 with deleted count on successful cleanup', async () => {
    mockDeleteExpired.mockResolvedValue(5)

    const req = createRequest('Bearer test-secret-123')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.deleted).toBe(5)
    expect(data.timestamp).toBeDefined()
    expect(typeof data.timestamp).toBe('string')
    expect(mockDeleteExpired).toHaveBeenCalledOnce()
  })

  it('returns 200 with zero deleted when no expired assessments exist', async () => {
    mockDeleteExpired.mockResolvedValue(0)

    const req = createRequest('Bearer test-secret-123')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.deleted).toBe(0)
    expect(data.timestamp).toBeDefined()
  })

  it('returns 500 when deleteExpiredAssessments throws', async () => {
    mockDeleteExpired.mockRejectedValue(new Error('DB connection failed'))

    const req = createRequest('Bearer test-secret-123')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Cleanup failed')
    expect(data.details).toBe('DB connection failed')
  })
})
