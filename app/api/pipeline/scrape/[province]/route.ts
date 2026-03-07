import { NextRequest, NextResponse } from 'next/server'
import { BCScraper } from '@/lib/pipeline/scrapers/bc'
import { BaseScraper } from '@/lib/pipeline/scrapers/base'
import { normalizeRules, normalizeDraws } from '@/lib/pipeline/normalizer'
import { computeContentHash, hasChanged } from '@/lib/pipeline/changeDetector'
import { supabaseAdmin } from '@/lib/db/client'
import { insertDraw } from '@/lib/db/draws'
import type { DrawInsert } from '@/lib/db/types'

/** Map of supported province codes to their scraper constructors. */
const scraperRegistry: Record<string, () => BaseScraper> = {
  bc: () => new BCScraper(),
  // Future scrapers:
  // ab: () => new ABScraper(),
  // mb: () => new MBScraper(),
  // nb: () => new NBScraper(),
  // ns: () => new NSScraper(),
  // nl: () => new NLScraper(),
  // pe: () => new PEScraper(),
  // nt: () => new NTScraper(),
  // yt: () => new YTScraper(),
}

/**
 * POST /api/pipeline/scrape/[province]
 *
 * Triggered by Vercel Cron or manual invocation.
 * Runs the scraper for the given province, detects changes via SHA-256,
 * auto-applies draw changes, and queues rule changes for admin review.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ province: string }> }
) {
  // 1. Validate authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get province from URL params
  const { province } = await params
  const provinceCode = province.toLowerCase()

  // 3. Get the appropriate scraper
  const createScraper = scraperRegistry[provinceCode]
  if (!createScraper) {
    return NextResponse.json(
      {
        error: `No scraper registered for province: ${provinceCode}`,
        available: Object.keys(scraperRegistry),
      },
      { status: 404 }
    )
  }

  // 4. Log the pipeline run start
  const runId = await logPipelineStart(provinceCode)

  try {
    // 5. Run the scraper
    const scraper = createScraper()
    const result = await scraper.run()

    // 6. Normalize the data
    const normalizedRules = normalizeRules(result.rules)
    const normalizedDraws = normalizeDraws(result.draws)

    // 7. Compute hashes
    const rulesHash = computeContentHash(normalizedRules)
    const drawsHash = computeContentHash(normalizedDraws)

    // 8. Get previous run hashes for comparison
    const previousRun = await getLastSuccessfulRun(provinceCode)
    const rulesChanged = previousRun
      ? hasChanged(rulesHash, previousRun.rules_hash ?? '')
      : true
    const drawsChanged = previousRun
      ? hasChanged(drawsHash, previousRun.draws_hash ?? '')
      : true

    // 9. Auto-apply draw changes
    let drawsInserted = 0
    if (drawsChanged) {
      drawsInserted = await applyDrawChanges(normalizedDraws, provinceCode)
    }

    // 10. Queue rule changes for admin review
    let rulesQueued = false
    if (rulesChanged) {
      rulesQueued = await queueRuleChanges(
        normalizedRules,
        provinceCode,
        previousRun?.rules_hash ?? null
      )
    }

    // 11. Log pipeline completion
    const status = result.errors.length > 0 ? 'partial' : 'success'
    await logPipelineComplete(runId, status, rulesHash, drawsHash, rulesChanged, drawsChanged, result.errors)

    // 12. Return summary
    return NextResponse.json({
      province: provinceCode,
      status,
      scrapedAt: result.scrapedAt,
      rulesChanged,
      drawsChanged,
      drawsInserted,
      rulesQueued,
      errors: result.errors,
      hashes: { rules: rulesHash, draws: drawsHash },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Pipeline error for ${provinceCode}:`, errorMessage)

    await logPipelineComplete(runId, 'failed', null, null, false, false, [
      { message: errorMessage, url: '' },
    ])

    return NextResponse.json(
      {
        province: provinceCode,
        status: 'failed',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

async function logPipelineStart(provinceCode: string): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from('pipeline_runs')
      .insert({
        province_code: provinceCode,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to log pipeline start:', error.message)
      return 'unknown'
    }
    return data.id
  } catch {
    console.error('Failed to log pipeline start')
    return 'unknown'
  }
}

async function logPipelineComplete(
  runId: string,
  status: 'success' | 'partial' | 'failed',
  rulesHash: string | null,
  drawsHash: string | null,
  rulesChanged: boolean,
  drawsChanged: boolean,
  errors: { message: string; url: string }[]
): Promise<void> {
  if (runId === 'unknown') return

  try {
    await supabaseAdmin
      .from('pipeline_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        rules_hash: rulesHash,
        draws_hash: drawsHash,
        rules_changed: rulesChanged,
        draws_changed: drawsChanged,
        errors: errors.length > 0 ? errors : null,
      })
      .eq('id', runId)
  } catch {
    console.error('Failed to log pipeline completion')
  }
}

async function getLastSuccessfulRun(
  provinceCode: string
): Promise<{ rules_hash: string | null; draws_hash: string | null } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('pipeline_runs')
      .select('rules_hash, draws_hash')
      .eq('province_code', provinceCode)
      .in('status', ['success', 'partial'])
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

async function applyDrawChanges(
  draws: ReturnType<typeof normalizeDraws>,
  provinceCode: string
): Promise<number> {
  let inserted = 0

  for (const draw of draws) {
    if (!draw.draw_date || !draw.program) continue

    try {
      // Look up program_id from the programs table
      const { data: program } = await supabaseAdmin
        .from('programs')
        .select('id')
        .eq('province_code', provinceCode)
        .limit(1)
        .maybeSingle()

      if (!program) {
        console.warn(`No program found for province ${provinceCode}, skipping draw insert`)
        continue
      }

      const drawInsert: DrawInsert = {
        program_id: program.id,
        draw_date: draw.draw_date,
        invitations_issued: draw.invitations_issued,
        min_score: draw.min_score,
        source_url: draw.source_url || null,
        notes: draw.category,
      }

      await insertDraw(drawInsert)
      inserted++
    } catch (err) {
      console.error(`Failed to insert draw for ${provinceCode}:`, err)
    }
  }

  return inserted
}

async function queueRuleChanges(
  rules: ReturnType<typeof normalizeRules>,
  provinceCode: string,
  _previousHash: string | null
): Promise<boolean> {
  try {
    // Look up program_id
    const { data: program } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('province_code', provinceCode)
      .limit(1)
      .maybeSingle()

    if (!program) {
      console.warn(`No program found for province ${provinceCode}, skipping rule queue`)
      return false
    }

    const { error } = await supabaseAdmin.from('review_queue').insert({
      program_id: program.id,
      change_type: 'rules',
      new_value: { rules },
      diff_summary: `Automated scraper detected rule changes for ${provinceCode.toUpperCase()}`,
      status: 'pending',
    })

    if (error) {
      console.error('Failed to queue rule changes:', error.message)
      return false
    }

    return true
  } catch {
    console.error('Failed to queue rule changes')
    return false
  }
}
