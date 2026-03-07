import { createClient } from '@supabase/supabase-js'

/**
 * Public Supabase client — uses the anon key.
 * Safe for browser / server-side read operations governed by RLS.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Admin Supabase client — uses the service role key.
 * Bypasses RLS. Use only in server-side contexts (API routes, scripts).
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
