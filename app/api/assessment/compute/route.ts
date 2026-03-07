import { NextRequest, NextResponse } from 'next/server'
import { UserProfileSchema } from '@/lib/validation/schemas'
import { evaluateAllPrograms } from '@/lib/scoring/evaluator'
import type { UserProfile } from '@/lib/types/assessment'

const DISCLAIMER =
  'This assessment provides estimates only and does not constitute immigration advice. Actual program requirements and processing may differ. Consult a licensed immigration professional for personalized guidance.'

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 500 }
    )
  }

  const parseResult = UserProfileSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parseResult.error.flatten(),
      },
      { status: 400 }
    )
  }

  try {
    const profile = parseResult.data as UserProfile
    const drawData = {}
    const results = evaluateAllPrograms(profile, drawData)

    return NextResponse.json({
      results,
      meta: {
        timestamp: new Date().toISOString(),
        programCount: results.length,
        disclaimers: [DISCLAIMER],
      },
    })
  } catch (err) {
    console.error('Compute endpoint error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
