import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const DUMMY_URL = 'https://placeholder.supabase.co'
const DUMMY_KEY = 'placeholder'

/**
 * Public Supabase client — uses the anon key.
 * Returns a no-op client if env vars are missing (allows build without Supabase).
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || DUMMY_URL,
  supabaseAnonKey || DUMMY_KEY
)

/**
 * Admin Supabase client — uses the service role key.
 * Returns a no-op client if env vars are missing (allows build without Supabase).
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || DUMMY_URL,
  supabaseServiceKey || DUMMY_KEY
)

/** Whether Supabase is properly configured */
export const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey))
