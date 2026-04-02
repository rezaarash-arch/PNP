import { describe, it, expect } from 'vitest'
import {
  RateLimiter,
  getClientIp,
  ASSESSMENT_RATE_LIMITS,
} from './rate-limiter'

describe('RateLimiter', () => {
  const defaultConfig = { maxTokens: 3, windowMs: 60_000 }

  it('allows requests within the limit', () => {
    const limiter = new RateLimiter({ '/api/test': defaultConfig })
    const config = limiter.getConfigForPath('/api/test')!

    const r1 = limiter.check('user1', config, 1000)
    const r2 = limiter.check('user1', config, 1001)
    const r3 = limiter.check('user1', config, 1002)

    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests exceeding the limit', () => {
    const limiter = new RateLimiter({ '/api/test': defaultConfig })
    const config = limiter.getConfigForPath('/api/test')!

    // Exhaust all tokens
    limiter.check('user1', config, 1000)
    limiter.check('user1', config, 1001)
    limiter.check('user1', config, 1002)

    // 4th request should be blocked
    const r4 = limiter.check('user1', config, 1003)
    expect(r4.allowed).toBe(false)
    expect(r4.remaining).toBe(0)
  })

  it('refills tokens after the window passes', () => {
    const limiter = new RateLimiter({ '/api/test': defaultConfig })
    const config = limiter.getConfigForPath('/api/test')!
    const startTime = 1000

    // Exhaust all tokens
    limiter.check('user1', config, startTime)
    limiter.check('user1', config, startTime + 1)
    limiter.check('user1', config, startTime + 2)

    // Blocked within window
    const blocked = limiter.check('user1', config, startTime + 30_000)
    expect(blocked.allowed).toBe(false)

    // After full window has passed, tokens should refill
    const afterWindow = limiter.check('user1', config, startTime + 60_001)
    expect(afterWindow.allowed).toBe(true)
    expect(afterWindow.remaining).toBe(2) // 3 max - 1 consumed
  })

  it('tracks different clients independently', () => {
    const limiter = new RateLimiter({ '/api/test': defaultConfig })
    const config = limiter.getConfigForPath('/api/test')!

    // Exhaust user1's tokens
    limiter.check('user1', config, 1000)
    limiter.check('user1', config, 1001)
    limiter.check('user1', config, 1002)

    const user1Blocked = limiter.check('user1', config, 1003)
    expect(user1Blocked.allowed).toBe(false)

    // user2 should still have tokens
    const user2OK = limiter.check('user2', config, 1003)
    expect(user2OK.allowed).toBe(true)
    expect(user2OK.remaining).toBe(2)
  })

  it('applies different limits per route', () => {
    const limiter = new RateLimiter({
      '/api/assessment/compute': { maxTokens: 10, windowMs: 60_000 },
      '/api/assessment/save': { maxTokens: 5, windowMs: 60_000 },
      '/api/assessment/pdf': { maxTokens: 3, windowMs: 60_000 },
    })

    const computeConfig = limiter.getConfigForPath('/api/assessment/compute')!
    const saveConfig = limiter.getConfigForPath('/api/assessment/save')!
    const pdfConfig = limiter.getConfigForPath('/api/assessment/pdf')!

    expect(computeConfig.maxTokens).toBe(10)
    expect(saveConfig.maxTokens).toBe(5)
    expect(pdfConfig.maxTokens).toBe(3)
  })

  it('returns undefined for unmatched routes', () => {
    const limiter = new RateLimiter({ '/api/test': defaultConfig })
    expect(limiter.getConfigForPath('/api/other')).toBeUndefined()
    expect(limiter.getConfigForPath('/unrelated')).toBeUndefined()
  })

  it('matches sub-paths of configured routes', () => {
    const limiter = new RateLimiter({ '/api/test': defaultConfig })
    expect(limiter.getConfigForPath('/api/test')).toBeDefined()
    expect(limiter.getConfigForPath('/api/test/sub')).toBeDefined()
  })

  it('returns correct resetAt timestamp', () => {
    const limiter = new RateLimiter({ '/api/test': defaultConfig })
    const config = limiter.getConfigForPath('/api/test')!
    const startTime = 100_000

    const result = limiter.check('user1', config, startTime)
    expect(result.resetAt).toBe(startTime + defaultConfig.windowMs)
  })

  it('cleans up stale buckets during periodic cleanup', () => {
    // Pass initial time 0 so the cleanup timer aligns with our test timestamps
    const limiter = new RateLimiter({ '/api/test': defaultConfig }, 0)
    const config = limiter.getConfigForPath('/api/test')!

    // Create a bucket at t=0
    limiter.check('user1', config, 0)
    expect(limiter.size).toBe(1)

    // Trigger cleanup — entry should be stale after windowMs
    // Cleanup runs every 60_000ms, and our window is 60_000ms
    // So at t=120_001 the cleanup timer fires and the bucket is older than windowMs
    limiter.check('user2', config, 120_001)
    // user1's bucket should have been cleaned up, only user2 remains
    expect(limiter.size).toBe(1)
  })

  it('handles the 429 response flow end-to-end for /api/assessment/pdf (3 req/min)', () => {
    const limiter = new RateLimiter(ASSESSMENT_RATE_LIMITS)
    const config = limiter.getConfigForPath('/api/assessment/pdf')!
    const now = Date.now()

    // 3 requests should succeed
    expect(limiter.check('client', config, now).allowed).toBe(true)
    expect(limiter.check('client', config, now + 1).allowed).toBe(true)
    expect(limiter.check('client', config, now + 2).allowed).toBe(true)

    // 4th should fail
    expect(limiter.check('client', config, now + 3).allowed).toBe(false)

    // After window, should succeed again
    expect(limiter.check('client', config, now + 60_001).allowed).toBe(true)
  })
})

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4' })
    expect(getClientIp(headers)).toBe('1.2.3.4')
  })

  it('uses the first IP when x-forwarded-for contains multiple', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12',
    })
    expect(getClientIp(headers)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '10.0.0.1' })
    expect(getClientIp(headers)).toBe('10.0.0.1')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '10.0.0.1',
    })
    expect(getClientIp(headers)).toBe('1.2.3.4')
  })

  it('returns anonymous when no IP headers present', () => {
    const headers = new Headers({})
    expect(getClientIp(headers)).toBe('anonymous')
  })
})
