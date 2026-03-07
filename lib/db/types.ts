/** Row types matching the SQL schema in supabase/migrations/001_initial_schema.sql */

export interface Program {
  id: string
  province_code: string
  province_name: string
  stream_name: string
  stream_slug: string
  category: 'main' | 'regional' | 'graduate' | 'farm' | 'strategic'
  status: 'active' | 'paused' | 'closed' | 'redesigning'
  status_note: string | null
  status_changed_at: string | null
  eoi_type: string
  has_points_grid: boolean
  official_url: string
  draw_page_url: string | null
  last_verified_at: string
  created_at: string
  updated_at: string
}

export interface ProgramRule {
  id: string
  program_id: string
  version: number
  rules: Record<string, unknown>
  effective_from: string
  effective_until: string | null
  change_summary: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Draw {
  id: string
  program_id: string
  draw_date: string
  invitations_issued: number | null
  min_score: number | null
  median_score: number | null
  max_score: number | null
  notes: string | null
  source_url: string | null
  scraped_at: string
}

export interface PipelineRun {
  id: string
  province_code: string
  started_at: string
  completed_at: string | null
  status: 'running' | 'success' | 'partial' | 'failed'
  rules_hash: string | null
  draws_hash: string | null
  rules_changed: boolean
  draws_changed: boolean
  errors: Record<string, unknown> | null
  created_at: string
}

export interface ReviewQueueItem {
  id: string
  program_id: string
  change_type: 'rules' | 'status' | 'new_program'
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  diff_summary: string | null
  status: 'pending' | 'approved' | 'rejected' | 'auto_applied'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Assessment {
  id: string
  session_token: string
  email: string | null
  answers: Record<string, unknown>
  results: Record<string, unknown> | null
  rules_snapshot_ids: Record<string, unknown> | null
  completed_at: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

/** A program joined with its current (active) rules */
export interface ProgramWithRules extends Program {
  current_rules: ProgramRule | null
}

/** Insert types (omit server-generated fields) */

export type DrawInsert = Omit<Draw, 'id' | 'scraped_at'> & {
  scraped_at?: string
}

export type AssessmentInsert = Pick<Assessment, 'session_token' | 'answers' | 'expires_at'> & {
  email?: string | null
}

export type AssessmentUpdate = Partial<
  Pick<Assessment, 'answers' | 'results' | 'rules_snapshot_ids' | 'completed_at' | 'email'>
>
