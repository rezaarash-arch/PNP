import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session/crypto'
import { getAssessmentByToken } from '@/lib/db/assessments'

export async function GET(request: NextRequest) {
  try {
    const encryptedToken = request.cookies.get('pnp_session')?.value

    if (!encryptedToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 404 }
      )
    }

    const encryptionKey = process.env.SESSION_ENCRYPTION_KEY

    if (!encryptionKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing encryption key' },
        { status: 500 }
      )
    }

    // Decrypt the session token
    let sessionToken: string
    try {
      sessionToken = decrypt(encryptedToken, encryptionKey)
    } catch {
      return NextResponse.json(
        { error: 'Invalid or corrupted session' },
        { status: 400 }
      )
    }

    // Load assessment from the database (graceful failure)
    let assessment
    try {
      assessment = await getAssessmentByToken(sessionToken)
    } catch {
      // DB unavailable
      return NextResponse.json(
        { error: 'Database unavailable, please try again later' },
        { status: 503 }
      )
    }

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found or expired' },
        { status: 404 }
      )
    }

    // Check if the assessment has expired
    if (new Date(assessment.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Assessment session has expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      answers: assessment.answers,
      results: assessment.results,
      completedAt: assessment.completed_at,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
