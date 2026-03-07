import { NextRequest, NextResponse } from 'next/server'
import { deleteExpiredAssessments } from '@/lib/db/assessments'

/**
 * POST /api/cleanup
 *
 * Triggered daily by Vercel Cron (3 AM UTC) to delete expired assessment data.
 * Required for PIPEDA (Canadian privacy law) compliance — personal data must not
 * be retained past the declared retention period stored in `expires_at`.
 */
export async function POST(request: NextRequest) {
  // 1. Validate authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Delete all assessments past their expiry
    const deleted = await deleteExpiredAssessments()

    const timestamp = new Date().toISOString()

    console.log(
      `[cleanup] Deleted ${deleted} expired assessment(s) at ${timestamp}`
    )

    // 3. Return summary
    return NextResponse.json({ deleted, timestamp })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[cleanup] Failed to delete expired assessments:', errorMessage)

    return NextResponse.json(
      { error: 'Cleanup failed', details: errorMessage },
      { status: 500 }
    )
  }
}
