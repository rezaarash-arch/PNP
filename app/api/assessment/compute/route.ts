import { NextRequest, NextResponse } from 'next/server'
import { UserProfileSchema } from '@/lib/validation/schemas'
import { evaluateAllPrograms } from '@/lib/scoring/evaluator'
import type { DrawDataMap } from '@/lib/scoring/evaluator'
import { getDrawsForAllPrograms } from '@/lib/db/draws'
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

    // Fetch real draw data from Supabase
    let drawData: DrawDataMap = {}
    try {
      const drawMap = await getDrawsForAllPrograms()
      for (const [programId, draws] of drawMap) {
        // Filter to draws with valid min_score and invitations_issued,
        // since the probability module requires non-nullable numbers
        drawData[programId] = draws
          .filter((d) => d.min_score !== null && d.invitations_issued !== null)
          .map((d) => ({
            draw_date: d.draw_date,
            min_score: d.min_score as number,
            invitations_issued: d.invitations_issued as number,
          }))
      }
    } catch (drawErr) {
      // If Supabase is unavailable, proceed with empty draw data
      // Probability estimates will be based on eligibility alone
      console.warn('Failed to fetch draw data, proceeding without:', drawErr)
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
