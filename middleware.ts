import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

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

export const config = {
  matcher: '/admin/:path*',
}
