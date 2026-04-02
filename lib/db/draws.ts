import { supabase, supabaseAdmin, isSupabaseConfigured } from './client'
import type { Draw, DrawInsert } from './types'

/**
 * Fetch all draws for a specific program, sorted by draw_date descending.
 */
export async function getDrawsByProgram(programId: string): Promise<Draw[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .eq('program_id', programId)
    .order('draw_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch draws for ${programId}: ${error.message}`)
  }

  return (data ?? []) as Draw[]
}

/**
 * Fetch all draws grouped by program ID.
 * Returns a map of programId to its draws sorted by date descending.
 */
export async function getDrawsForAllPrograms(): Promise<Map<string, Draw[]>> {
  if (!isSupabaseConfigured) return new Map()

  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch all draws: ${error.message}`)
  }

  const drawMap = new Map<string, Draw[]>()

  if (data) {
    for (const draw of data as Draw[]) {
      const existing = drawMap.get(draw.program_id)
      if (existing) {
        existing.push(draw)
      } else {
        drawMap.set(draw.program_id, [draw])
      }
    }
  }

  return drawMap
}

/**
 * Upsert a draw record. Uses the (program_id, draw_date) unique constraint
 * to update existing records or insert new ones.
 * Requires the admin client (service role) to bypass RLS.
 */
export async function insertDraw(draw: DrawInsert): Promise<Draw> {
  const { data, error } = await supabaseAdmin
    .from('draws')
    .upsert(draw, { onConflict: 'program_id,draw_date' })
    .select()
    .single()

  if (error) {
    throw new Error(
      `Failed to upsert draw for ${draw.program_id} on ${draw.draw_date}: ${error.message}`
    )
  }

  return data as Draw
}
