/**
 * In-memory token bucket rate limiter for Edge Runtime.
 *
 * Each route pattern can have its own limit (max tokens) and refill window.
 * Clients are identified by IP address extracted from request headers.
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxTokens: number
  /** Window duration in milliseconds during which tokens refill */
  windowMs: number
}

interface Bucket {
  tokens: number
  lastRefill: number
}

/**
 * Interval (in ms) between automatic cleanups of expired entries.
 * Buckets that have been idle for longer than their window are purged.
 */
const CLEANUP_INTERVAL_MS = 60_000

export class RateLimiter {
  private buckets = new Map<string, Bucket>()
  private routes: Map<string, RateLimitConfig>
  private lastCleanup: number

  constructor(routes: Record<string, RateLimitConfig>, now?: number) {
    this.routes = new Map(Object.entries(routes))
    this.lastCleanup = now ?? Date.now()
  }

  /**
   * Find the matching rate-limit config for a given pathname.
   * Returns undefined if no configured route matches.
   */
  getConfigForPath(pathname: string): RateLimitConfig | undefined {
    for (const [pattern, config] of this.routes) {
      if (pathname === pattern || pathname.startsWith(pattern + '/')) {
        return config
      }
    }
    return undefined
  }

  /**
   * Attempt to consume a token for the given key + route.
   *
   * @returns An object indicating whether the request is allowed, the number
   *          of remaining tokens, and when the bucket resets (epoch ms).
   */
  check(
    key: string,
    config: RateLimitConfig,
    now: number = Date.now(),
  ): { allowed: boolean; remaining: number; resetAt: number } {
    this.maybeCleanup(now)

    const bucketKey = `${key}:${config.maxTokens}:${config.windowMs}`
    let bucket = this.buckets.get(bucketKey)

    if (!bucket) {
      bucket = { tokens: config.maxTokens, lastRefill: now }
      this.buckets.set(bucketKey, bucket)
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill
    if (elapsed >= config.windowMs) {
      // Full window has passed — reset the bucket
      bucket.tokens = config.maxTokens
      bucket.lastRefill = now
    }

    const resetAt = bucket.lastRefill + config.windowMs

    if (bucket.tokens > 0) {
      bucket.tokens -= 1
      return { allowed: true, remaining: bucket.tokens, resetAt }
    }

    return { allowed: false, remaining: 0, resetAt }
  }

  /**
   * Purge stale buckets to prevent unbounded memory growth.
   * Runs at most once every CLEANUP_INTERVAL_MS.
   */
  private maybeCleanup(now: number): void {
    if (now - this.lastCleanup < CLEANUP_INTERVAL_MS) return
    this.lastCleanup = now

    for (const [key, bucket] of this.buckets) {
      // Parse windowMs from the composite key (key:maxTokens:windowMs)
      const parts = key.split(':')
      const windowMs = parseInt(parts[parts.length - 1], 10)
      if (now - bucket.lastRefill > windowMs) {
        this.buckets.delete(key)
      }
    }
  }

  /** Visible for testing: current number of tracked buckets */
  get size(): number {
    return this.buckets.size
  }
}

/**
 * Extract a client identifier from request headers.
 * Prefers x-forwarded-for, then x-real-ip, falling back to 'anonymous'.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; use the first (client) one
    return forwarded.split(',')[0].trim()
  }
  return headers.get('x-real-ip') || 'anonymous'
}

/** Pre-configured rate limits for assessment API routes */
export const ASSESSMENT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/assessment/compute': { maxTokens: 10, windowMs: 60_000 },
  '/api/assessment/save': { maxTokens: 5, windowMs: 60_000 },
  '/api/assessment/pdf': { maxTokens: 3, windowMs: 60_000 },
  '/api/assessment/analyze': { maxTokens: 3, windowMs: 60_000 },
  '/api/assessment/report/pdf': { maxTokens: 3, windowMs: 60_000 },
}

/** Singleton rate limiter instance for the middleware */
export const assessmentRateLimiter = new RateLimiter(ASSESSMENT_RATE_LIMITS)
