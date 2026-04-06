import { NextRequest, NextResponse } from 'next/server'
import { UserProfileSchema } from '@/lib/validation/schemas'
import { analyzeProfile } from '@/lib/ai/analyze'
import type { UserProfile } from '@/lib/types/assessment'
import type { ProgramResult } from '@/lib/types/results'

interface AnalyzeRequestBody {
  profile: unknown
  results: ProgramResult[]
}

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

  // Validate body shape has profile and results
  if (
    !body ||
    typeof body !== 'object' ||
    !('profile' in body) ||
    !('results' in body) ||
    !Array.isArray((body as AnalyzeRequestBody).results)
  ) {
    return NextResponse.json(
      { error: 'Request body must include "profile" and a "results" array' },
      { status: 400 }
    )
  }

  const { profile: rawProfile, results } = body as AnalyzeRequestBody

  if (results.length === 0) {
    return NextResponse.json(
      { error: 'Results array must not be empty' },
      { status: 400 }
    )
  }

  // Validate profile using Zod schema
  const parseResult = UserProfileSchema.safeParse(rawProfile)

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
    const analysis = await analyzeProfile(profile, results)

    if (analysis === null) {
      const hasKey = Boolean(process.env.ANTHROPIC_API_KEY)
      const keyPrefix = process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? 'NOT_SET'
      return NextResponse.json(
        { error: `AI analysis failed. Key present: ${hasKey}, prefix: ${keyPrefix}` },
        { status: 503 }
      )
    }

    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('Analyze endpoint error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
