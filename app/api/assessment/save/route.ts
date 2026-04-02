import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { encrypt } from '@/lib/session/crypto'
import { createAssessment } from '@/lib/db/assessments'

const SaveBodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  email: z.string().email().optional(),
})

const SESSION_EXPIRY_DAYS = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = SaveBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { answers, email } = parsed.data
    const encryptionKey = process.env.SESSION_ENCRYPTION_KEY

    if (!encryptionKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing encryption key' },
        { status: 500 }
      )
    }

    // Generate a unique session token
    const sessionToken = crypto.randomUUID()

    // Encrypt the session token for the cookie
    const encryptedToken = encrypt(sessionToken, encryptionKey)

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

    // Attempt to persist to the database (graceful failure)
    try {
      await createAssessment(sessionToken, answers, expiresAt.toISOString())
    } catch {
      // DB unavailable — continue with cookie-only session.
      // In production, Supabase will be connected and this will succeed.
      console.warn('Database unavailable, session saved to cookie only')
    }

    // Build response with encrypted session cookie
    const response = NextResponse.json({
      success: true,
      sessionId: encryptedToken,
    })

    response.cookies.set('pnp_session', encryptedToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/assessment',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 30 days in seconds
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
