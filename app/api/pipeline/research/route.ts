import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/client'
import { insertDraw } from '@/lib/db/draws'
import type { DrawInsert } from '@/lib/db/types'
import { researchProgram } from '@/lib/ai/research'

const ALL_PROGRAM_IDS = [
  'bc-entrepreneur-base', 'bc-entrepreneur-regional', 'bc-entrepreneur-strategic',
  'ab-rural-entrepreneur', 'ab-graduate-entrepreneur', 'ab-foreign-graduate', 'ab-farm',
  'sk-entrepreneur', 'sk-graduate-entrepreneur',
  'mb-entrepreneur', 'mb-farm-investor',
  'on-entrepreneur',
  'nb-entrepreneurial', 'nb-post-grad',
  'ns-entrepreneur', 'ns-graduate-entrepreneur',
  'pei-work-permit',
  'nl-entrepreneur', 'nl-graduate-entrepreneur',
  'nwt-business',
  'yk-business-nominee',
] as const

const BATCH_SIZE = 5

/**
 * POST /api/pipeline/research
 *
 * Biweekly AI research agent. Runs on the 1st and 15th of each month.
 * Uses Claude to research PNP program updates, auto-upserts draws,
 * and queues rule/status changes for human review.
 */
export async function POST(request: NextRequest) {
  // 1. Validate authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Log pipeline run start
  const runId = await logPipelineStart()

  const summary: {
    researched: number
    drawsInserted: number
    changesQueued: number
    failures: string[]
  } = {
    researched: 0,
    drawsInserted: 0,
    changesQueued: 0,
    failures: [],
  }

  try {
    // 3. Process programs in batches of 5
    for (let i = 0; i < ALL_PROGRAM_IDS.length; i += BATCH_SIZE) {
      const batch = ALL_PROGRAM_IDS.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map(async (programId) => {
          // Get last draw date from Supabase
          const { data: lastDraw } = await supabaseAdmin
            .from('draws')
            .select('draw_date')
            .eq('program_id', programId)
            .order('draw_date', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Get current rules
          const { data: currentRules } = await supabaseAdmin
            .from('program_rules')
            .select('rules')
            .eq('program_id', programId)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()

          const research = await researchProgram(programId, {
            currentRules: currentRules?.rules ?? {},
            lastDrawDate: lastDraw?.draw_date ?? null,
          })

          if (!research) {
            return { programId, status: 'no_results' as const }
          }

          // Tiered trust: auto-upsert draws
          let drawCount = 0
          for (const draw of research.draws) {
            try {
              const drawInsert: DrawInsert = {
                program_id: programId,
                draw_date: draw.draw_date,
                min_score: draw.min_score,
                invitations_issued: draw.invitations_issued,
                median_score: null,
                max_score: null,
                source_url: null,
                notes: 'Auto-inserted by AI research agent',
              }
              await insertDraw(drawInsert)
              drawCount++
            } catch (err) {
              console.error(`Failed to insert draw for ${programId}:`, err)
            }
          }

          // Tiered trust: queue rule changes for human review
          let queued = 0
          for (const change of research.ruleChanges) {
            try {
              await supabaseAdmin.from('review_queue').insert({
                program_id: programId,
                change_type: 'rules',
                old_value: { field: change.field, value: change.oldValue },
                new_value: { field: change.field, value: change.newValue },
                diff_summary: `AI research detected rule change: ${change.field} (${change.oldValue} -> ${change.newValue}). Source: ${change.source}`,
                status: 'pending',
              })
              queued++
            } catch (err) {
              console.error(`Failed to queue rule change for ${programId}:`, err)
            }
          }

          // Queue status changes for human review
          for (const change of research.statusChanges) {
            try {
              await supabaseAdmin.from('review_queue').insert({
                program_id: programId,
                change_type: 'status',
                new_value: { status: change.newStatus, reason: change.reason },
                diff_summary: `AI research detected status change to "${change.newStatus}". Reason: ${change.reason}. Source: ${change.source}`,
                status: 'pending',
              })
              queued++
            } catch (err) {
              console.error(`Failed to queue status change for ${programId}:`, err)
            }
          }

          return { programId, status: 'ok' as const, drawCount, queued }
        })
      )

      // Aggregate results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const val = result.value
          summary.researched++
          if (val.status === 'ok') {
            summary.drawsInserted += val.drawCount
            summary.changesQueued += val.queued
          }
        } else {
          summary.failures.push(result.reason?.message ?? 'Unknown error')
        }
      }
    }

    // 4. Log pipeline completion
    const status = summary.failures.length > 0 ? 'partial' : 'success'
    await logPipelineComplete(runId, status, summary)

    return NextResponse.json({
      status,
      ...summary,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('Research pipeline error:', errorMessage)

    await logPipelineComplete(runId, 'failed', summary)

    return NextResponse.json(
      { status: 'failed', error: errorMessage, ...summary },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

async function logPipelineStart(): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from('pipeline_runs')
      .insert({
        province_code: 'all',
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
  summary: { researched: number; drawsInserted: number; changesQueued: number; failures: string[] }
): Promise<void> {
  if (runId === 'unknown') return

  try {
    await supabaseAdmin
      .from('pipeline_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        draws_changed: summary.drawsInserted > 0,
        rules_changed: summary.changesQueued > 0,
        errors: summary.failures.length > 0
          ? summary.failures.map((msg) => ({ message: msg, url: '' }))
          : null,
      })
      .eq('id', runId)
  } catch {
    console.error('Failed to log pipeline completion')
  }
}
