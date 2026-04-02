import { NextResponse, NextRequest } from 'next/server'
import {
  assessmentRateLimiter,
  getClientIp,
} from './lib/middleware/rate-limiter'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Rate limiting for assessment API routes ---
  const rateLimitConfig = assessmentRateLimiter.getConfigForPath(pathname)
  if (rateLimitConfig) {
    const clientIp = getClientIp(request.headers)
    const { allowed, remaining, resetAt } = assessmentRateLimiter.check(
      clientIp,
      rateLimitConfig,
    )

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitConfig.maxTokens),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          },
        },
      )
    }

    // Attach rate-limit headers to successful responses
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(rateLimitConfig.maxTokens))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
    return response
  }

  // --- Basic auth for /admin routes ---
  if (pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Basic ')) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
      })
    }

    const credentials = atob(authHeader.split(' ')[1])
    const [, password] = credentials.split(':')

    if (password !== process.env.ADMIN_PASSWORD) {
      return new NextResponse('Invalid credentials', { status: 401 })
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/assessment/:path*'],
}
