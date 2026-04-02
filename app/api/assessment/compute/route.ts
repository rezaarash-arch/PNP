import { NextRequest, NextResponse } from 'next/server'
import { UserProfileSchema } from '@/lib/validation/schemas'
import { evaluateAllPrograms } from '@/lib/scoring/evaluator'
import type { DrawDataMap } from '@/lib/scoring/evaluator'
import { getDrawsForAllPrograms } from '@/lib/db/draws'
import { FALLBACK_DRAW_DATA } from '@/lib/data/draws-fallback'
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

    // Fetch real draw data from Supabase, fall back to static data if empty
    let drawData: DrawDataMap = {}
    try {
      const drawMap = await getDrawsForAllPrograms()
      for (const [programId, draws] of drawMap) {
        // Filter to draws with valid min_score and invitations_issued,
        // since the probability module requires non-nullable numbers
        const filtered = draws
          .filter((d) => d.min_score !== null && d.invitations_issued !== null)
          .map((d) => ({
            draw_date: d.draw_date,
            min_score: d.min_score as number,
            invitations_issued: d.invitations_issued as number,
          }))
        if (filtered.length > 0) {
          drawData[programId] = filtered
        }
      }
    } catch (drawErr) {
      console.warn('Failed to fetch draw data from Supabase:', drawErr)
    }

    // If Supabase returned no data (empty DB or error), use static fallback
    if (Object.keys(drawData).length === 0) {
      drawData = FALLBACK_DRAW_DATA
    }

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
