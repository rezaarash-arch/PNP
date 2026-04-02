import { supabaseAdmin } from './client'
import type { Assessment, AssessmentInsert, AssessmentUpdate } from './types'

/**
 * Create a new assessment session.
 * Uses the admin client so the insert is not blocked by RLS.
 */
export async function createAssessment(
  sessionToken: string,
  answers: Record<string, unknown>,
  expiresAt: string
): Promise<Assessment> {
  const insert: AssessmentInsert = {
    session_token: sessionToken,
    answers,
    expires_at: expiresAt,
  }

  const { data, error } = await supabaseAdmin
    .from('assessments')
    .insert(insert)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create assessment: ${error.message}`)
  }

  return data as Assessment
}

/**
 * Load an assessment by its session token.
 * Uses the admin client for reliable access regardless of RLS headers.
 */
export async function getAssessmentByToken(sessionToken: string): Promise<Assessment | null> {
  const { data, error } = await supabaseAdmin
    .from('assessments')
    .select('*')
    .eq('session_token', sessionToken)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found
      return null
    }
    throw new Error(`Failed to fetch assessment by token: ${error.message}`)
  }

  return data as Assessment
}

/**
 * Update an assessment's answers, results, or completion state.
 * Matches on session_token for idempotent updates.
 */
export async function updateAssessment(
  sessionToken: string,
  updates: AssessmentUpdate
): Promise<Assessment> {
  const { data, error } = await supabaseAdmin
    .from('assessments')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('session_token', sessionToken)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update assessment: ${error.message}`)
  }

  return data as Assessment
}

/**
 * Delete all assessments that have passed their expires_at timestamp.
 * Returns the count of deleted rows.
 */
export async function deleteExpiredAssessments(): Promise<number> {
  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('assessments')
    .delete()
    .lt('expires_at', now)
    .select('id')

  if (error) {
    throw new Error(`Failed to delete expired assessments: ${error.message}`)
  }

  return data?.length ?? 0
}
