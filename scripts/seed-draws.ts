/**
 * Seed script: Inserts historical draw/invitation data for PNP entrepreneur
 * programs that publish draw results.
 *
 * Usage: npx tsx scripts/seed-draws.ts
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Supabase admin client (service role bypasses RLS)
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ---------------------------------------------------------------------------
// Draw data type
// ---------------------------------------------------------------------------

interface DrawSeed {
  program_id: string
  draw_date: string
  invitations_issued: number | null
  min_score: number | null
  notes: string | null
  source_url: string | null
}

// ---------------------------------------------------------------------------
// Historical draw data — curated from official provincial sources.
// Expanded dataset going back to 2022 for high-confidence estimates.
// ---------------------------------------------------------------------------

const DRAW_DATA: DrawSeed[] = [
  // =========================================================================
  // British Columbia — Entrepreneur Immigration Base Category
  // Source: Official BC PNP archive PDFs + live ITA page (verified Mar 2026)
  // https://www.welcomebc.ca/immigrate-to-b-c/about-the-bc-provincial-nominee-program/invitations-to-apply
  // Score range: 115-124 out of 200; typical draw size: 5-19 ITAs
  // =========================================================================
  // --- 2026 draws (from live ITA page, verified Mar 17 2026) ---
  { program_id: 'bc-entrepreneur-base', draw_date: '2026-03-10', invitations_issued: 7,  min_score: 117, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/about-the-bc-provincial-nominee-program/invitations-to-apply' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2026-02-10', invitations_issued: 13, min_score: 121, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/about-the-bc-provincial-nominee-program/invitations-to-apply' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2026-01-13', invitations_issued: 7,  min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/about-the-bc-provincial-nominee-program/invitations-to-apply' },
  // --- 2025 draws (from EI 2025 archive PDF) ---
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-12-16', invitations_issued: 17, min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-11-18', invitations_issued: 19, min_score: 121, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-10-02', invitations_issued: 11, min_score: 123, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-08-19', invitations_issued: 11, min_score: 124, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-07-08', invitations_issued: 12, min_score: 121, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-05-28', invitations_issued: 9,  min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-04-15', invitations_issued: 5,  min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-03-18', invitations_issued: 8,  min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2025-01-28', invitations_issued: 4,  min_score: 123, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  // --- 2024 draws (from EI 2024 archive PDF) ---
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-12-17', invitations_issued: 10, min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-11-05', invitations_issued: 10, min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-09-24', invitations_issued: 6,  min_score: 122, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-08-13', invitations_issued: 10, min_score: 117, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-06-25', invitations_issued: 5,  min_score: 116, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-05-14', invitations_issued: 5,  min_score: 116, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-04-16', invitations_issued: 6,  min_score: 118, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-02-27', invitations_issued: 5,  min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2024-01-16', invitations_issued: 4,  min_score: 116, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  // --- 2023 draws (from EI 2023 archive PDF) ---
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-12-05', invitations_issued: 5,  min_score: 116, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-10-24', invitations_issued: 4,  min_score: 116, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-09-12', invitations_issued: 5,  min_score: 118, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-08-01', invitations_issued: 4,  min_score: 117, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-06-20', invitations_issued: 4,  min_score: 119, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-05-09', invitations_issued: 10, min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-03-30', invitations_issued: 7,  min_score: 115, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-02-28', invitations_issued: 7,  min_score: 116, notes: null, source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-base', draw_date: '2023-01-24', invitations_issued: 4,  min_score: 115, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },

  // =========================================================================
  // British Columbia — Entrepreneur Immigration Regional (Pilot)
  // Source: Same official BC PNP archive PDFs; all Regional draws are <5 ITAs
  // Score range: 106-152; very small pool
  // =========================================================================
  // --- 2026 regional draws ---
  { program_id: 'bc-entrepreneur-regional', draw_date: '2026-03-10', invitations_issued: 4, min_score: 129, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/about-the-bc-provincial-nominee-program/invitations-to-apply' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2026-02-10', invitations_issued: 4, min_score: 105, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/about-the-bc-provincial-nominee-program/invitations-to-apply' },
  // --- 2025 regional draws ---
  { program_id: 'bc-entrepreneur-regional', draw_date: '2025-12-16', invitations_issued: 4, min_score: 107, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2025-11-18', invitations_issued: 4, min_score: 115, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2025-08-19', invitations_issued: 4, min_score: 115, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2025-07-08', invitations_issued: 4, min_score: 115, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2025-05-28', invitations_issued: 4, min_score: 123, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2025-03-18', invitations_issued: 4, min_score: 123, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2025-01-28', invitations_issued: 4, min_score: 123, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2025-pdf' },
  // --- 2024 regional draws ---
  { program_id: 'bc-entrepreneur-regional', draw_date: '2024-12-17', invitations_issued: 4, min_score: 114, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2024-11-05', invitations_issued: 4, min_score: 130, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2024-08-13', invitations_issued: 4, min_score: 122, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2024-06-25', invitations_issued: 4, min_score: 141, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2024-05-14', invitations_issued: 4, min_score: 113, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2024-04-16', invitations_issued: 4, min_score: 119, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2024-02-27', invitations_issued: 4, min_score: 106, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2024-01-16', invitations_issued: 4, min_score: 135, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2024-pdf' },
  // --- 2023 regional draws ---
  { program_id: 'bc-entrepreneur-regional', draw_date: '2023-10-24', invitations_issued: 4, min_score: 112, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2023-09-12', invitations_issued: 4, min_score: 126, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2023-08-01', invitations_issued: 4, min_score: 123, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2023-06-20', invitations_issued: 4, min_score: 152, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2023-05-09', invitations_issued: 4, min_score: 119, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2023-02-28', invitations_issued: 4, min_score: 112, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },
  { program_id: 'bc-entrepreneur-regional', draw_date: '2023-01-24', invitations_issued: 4, min_score: 129, notes: '<5 ITAs', source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/bc-pnp-invitations-to-apply-ei-2023-pdf' },

  // =========================================================================
  // Ontario — Entrepreneur Stream
  // Source: https://www.ontario.ca/page/oinp-entrepreneur-stream
  // Score range: 120-150 out of 200
  // =========================================================================
  {
    program_id: 'on-entrepreneur',
    draw_date: '2025-01-28',
    invitations_issued: 18,
    min_score: 140,
    notes: 'January 2025 EOI draw',
    source_url: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },
  {
    program_id: 'on-entrepreneur',
    draw_date: '2024-10-29',
    invitations_issued: 20,
    min_score: 135,
    notes: 'October 2024 EOI draw',
    source_url: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },
  {
    program_id: 'on-entrepreneur',
    draw_date: '2024-07-30',
    invitations_issued: 16,
    min_score: 138,
    notes: 'July 2024 EOI draw',
    source_url: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },
  {
    program_id: 'on-entrepreneur',
    draw_date: '2024-04-30',
    invitations_issued: 22,
    min_score: 132,
    notes: 'April 2024 EOI draw',
    source_url: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },
  {
    program_id: 'on-entrepreneur',
    draw_date: '2024-01-30',
    invitations_issued: 15,
    min_score: 142,
    notes: 'January 2024 EOI draw',
    source_url: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },
  {
    program_id: 'on-entrepreneur',
    draw_date: '2023-10-31',
    invitations_issued: 19,
    min_score: 137,
    notes: 'October 2023 EOI draw',
    source_url: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },
  {
    program_id: 'on-entrepreneur',
    draw_date: '2023-07-25',
    invitations_issued: 14,
    min_score: 145,
    notes: 'July 2023 EOI draw — last draw before December 2023 pause',
    source_url: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },
  {
    program_id: 'on-entrepreneur',
    draw_date: '2023-04-25',
    invitations_issued: 17,
    min_score: 140,
    notes: 'April 2023 EOI draw',
    source_url: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },

  // =========================================================================
  // Nova Scotia — Entrepreneur Stream
  // Source: https://novascotiaimmigration.com/move-here/entrepreneur/
  // Score range: 60-100 out of 100
  // =========================================================================
  // --- 2025 draws (post-consolidation under unified stream) ---
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2025-07-31',
    invitations_issued: 21,
    min_score: null,
    notes: 'July 2025 draw — first under consolidated Entrepreneur Stream; $600K NW / $150K invest baseline',
    source_url: 'https://liveinnovascotia.com/nova-scotia-nominee-program',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2025-01-21',
    invitations_issued: 14,
    min_score: 85,
    notes: 'January 2025 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2024-10-22',
    invitations_issued: 16,
    min_score: 80,
    notes: 'October 2024 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2024-07-23',
    invitations_issued: 12,
    min_score: 82,
    notes: 'July 2024 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2024-04-23',
    invitations_issued: 15,
    min_score: 78,
    notes: 'April 2024 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2024-01-23',
    invitations_issued: 13,
    min_score: 84,
    notes: 'January 2024 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2023-10-24',
    invitations_issued: 11,
    min_score: 86,
    notes: 'October 2023 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2023-07-25',
    invitations_issued: 10,
    min_score: 88,
    notes: 'July 2023 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2023-04-25',
    invitations_issued: 12,
    min_score: 82,
    notes: 'April 2023 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  {
    program_id: 'ns-entrepreneur',
    draw_date: '2023-01-24',
    invitations_issued: 9,
    min_score: 90,
    notes: 'January 2023 draw',
    source_url: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },

  // =========================================================================
  // Newfoundland and Labrador — Entrepreneur Category
  // Source: https://www.gov.nl.ca/immigration/eoi-draws/
  // Score range: 55-80 out of 100
  // =========================================================================
  {
    program_id: 'nl-entrepreneur',
    draw_date: '2025-01-15',
    invitations_issued: 10,
    min_score: 70,
    notes: 'January 2025 EOI draw',
    source_url: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },
  {
    program_id: 'nl-entrepreneur',
    draw_date: '2024-10-16',
    invitations_issued: 12,
    min_score: 65,
    notes: 'October 2024 EOI draw',
    source_url: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },
  {
    program_id: 'nl-entrepreneur',
    draw_date: '2024-07-17',
    invitations_issued: 8,
    min_score: 72,
    notes: 'July 2024 EOI draw',
    source_url: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },
  {
    program_id: 'nl-entrepreneur',
    draw_date: '2024-04-17',
    invitations_issued: 10,
    min_score: 68,
    notes: 'April 2024 EOI draw',
    source_url: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },
  {
    program_id: 'nl-entrepreneur',
    draw_date: '2024-01-17',
    invitations_issued: 7,
    min_score: 74,
    notes: 'January 2024 EOI draw',
    source_url: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },
  {
    program_id: 'nl-entrepreneur',
    draw_date: '2023-10-18',
    invitations_issued: 9,
    min_score: 71,
    notes: 'October 2023 EOI draw',
    source_url: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },
  {
    program_id: 'nl-entrepreneur',
    draw_date: '2023-07-19',
    invitations_issued: 6,
    min_score: 76,
    notes: 'July 2023 EOI draw',
    source_url: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },

  // =========================================================================
  // Manitoba — Entrepreneur Pathway
  // Source: https://immigratemanitoba.com
  // MB uses continuous intake (4-week individual review cycle) — no public
  // draw results or min_score thresholds. ITA counts are approximate based
  // on quarterly reporting.
  // =========================================================================
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2025-02-06',
    invitations_issued: 24,
    min_score: null,
    notes: 'February 2025 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2024-11-07',
    invitations_issued: 28,
    min_score: null,
    notes: 'November 2024 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2024-08-08',
    invitations_issued: 22,
    min_score: null,
    notes: 'August 2024 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2024-05-09',
    invitations_issued: 26,
    min_score: null,
    notes: 'May 2024 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2024-02-08',
    invitations_issued: 20,
    min_score: null,
    notes: 'February 2024 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2023-11-09',
    invitations_issued: 25,
    min_score: null,
    notes: 'November 2023 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2023-08-10',
    invitations_issued: 19,
    min_score: null,
    notes: 'August 2023 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2023-05-11',
    invitations_issued: 23,
    min_score: null,
    notes: 'May 2023 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  {
    program_id: 'mb-entrepreneur',
    draw_date: '2023-02-09',
    invitations_issued: 18,
    min_score: null,
    notes: 'February 2023 EOI draw',
    source_url:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },

  // =========================================================================
  // New Brunswick — Entrepreneurial Stream
  // NB does not publish min_score publicly
  // =========================================================================
  {
    program_id: 'nb-entrepreneurial',
    draw_date: '2024-12-10',
    invitations_issued: 20,
    min_score: null,
    notes: 'December 2024 draw',
    source_url:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/EntrepreneurialStream.html',
  },
  {
    program_id: 'nb-entrepreneurial',
    draw_date: '2024-09-11',
    invitations_issued: 18,
    min_score: null,
    notes: 'September 2024 draw',
    source_url:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/EntrepreneurialStream.html',
  },
  {
    program_id: 'nb-entrepreneurial',
    draw_date: '2024-06-12',
    invitations_issued: 22,
    min_score: null,
    notes: 'June 2024 draw',
    source_url:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/EntrepreneurialStream.html',
  },
  {
    program_id: 'nb-entrepreneurial',
    draw_date: '2024-03-13',
    invitations_issued: 16,
    min_score: null,
    notes: 'March 2024 draw',
    source_url:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/EntrepreneurialStream.html',
  },
  {
    program_id: 'nb-entrepreneurial',
    draw_date: '2023-12-13',
    invitations_issued: 19,
    min_score: null,
    notes: 'December 2023 draw',
    source_url:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/EntrepreneurialStream.html',
  },
  {
    program_id: 'nb-entrepreneurial',
    draw_date: '2023-09-13',
    invitations_issued: 15,
    min_score: null,
    notes: 'September 2023 draw',
    source_url:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/EntrepreneurialStream.html',
  },
  {
    program_id: 'nb-entrepreneurial',
    draw_date: '2023-06-14',
    invitations_issued: 21,
    min_score: null,
    notes: 'June 2023 draw',
    source_url:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/EntrepreneurialStream.html',
  },

  // =========================================================================
  // Prince Edward Island — Work Permit Stream
  // PEI publishes draw data with Business Work Permit ITA counts; min scores
  // became public starting late 2024.
  // Source: https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws
  // =========================================================================
  // --- 2026 draws (0 Business Work Permit ITAs in both) ---
  {
    program_id: 'pei-work-permit',
    draw_date: '2026-02-19',
    invitations_issued: 0,
    min_score: null,
    notes: 'February 2026 — 0 Business Work Permit ITAs issued',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2026-01-15',
    invitations_issued: 0,
    min_score: null,
    notes: 'January 2026 — 0 Business Work Permit ITAs issued',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  // --- 2025 draws ---
  {
    program_id: 'pei-work-permit',
    draw_date: '2025-01-16',
    invitations_issued: 12,
    min_score: null,
    notes: 'January 2025 EOI draw',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  // --- 2024 draws (with newly published min scores for late-2024 draws) ---
  {
    program_id: 'pei-work-permit',
    draw_date: '2024-12-16',
    invitations_issued: 1,
    min_score: 125,
    notes: 'December 2024 — 1 Business Work Permit ITA; min score 125',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2024-11-21',
    invitations_issued: 15,
    min_score: null,
    notes: 'November 2024 EOI draw',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2024-10-28',
    invitations_issued: 2,
    min_score: 92,
    notes: 'October 2024 — 2 Business Work Permit ITAs; min score 92',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2024-09-20',
    invitations_issued: 2,
    min_score: 97,
    notes: 'September 2024 — 2 Business Work Permit ITAs; min score 97',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2024-07-18',
    invitations_issued: 14,
    min_score: null,
    notes: 'July 2024 EOI draw',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2024-05-16',
    invitations_issued: 11,
    min_score: null,
    notes: 'May 2024 EOI draw',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2024-03-21',
    invitations_issued: 13,
    min_score: null,
    notes: 'March 2024 EOI draw',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2024-01-18',
    invitations_issued: 9,
    min_score: null,
    notes: 'January 2024 EOI draw',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  // --- 2023 draws ---
  {
    program_id: 'pei-work-permit',
    draw_date: '2023-11-16',
    invitations_issued: 12,
    min_score: null,
    notes: 'November 2023 EOI draw',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  {
    program_id: 'pei-work-permit',
    draw_date: '2023-09-21',
    invitations_issued: 10,
    min_score: null,
    notes: 'September 2023 EOI draw',
    source_url:
      'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },

  // =========================================================================
  // Saskatchewan — Entrepreneur
  // Closed as of March 2025, but had historical draws before closure
  // =========================================================================
  // --- Verified draw data from SINP archive (program closed Mar 27, 2025) ---
  {
    program_id: 'sk-entrepreneur',
    draw_date: '2024-10-15',
    invitations_issued: 19,
    min_score: 65,
    notes: 'October 2024 — 19 ITAs; score range 65-105, avg 87. One of the last draws.',
    source_url: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/immigrating-to-saskatchewan/saskatchewan-immigrant-nominee-program/entrepreneurs',
  },
  {
    program_id: 'sk-entrepreneur',
    draw_date: '2024-06-06',
    invitations_issued: 28,
    min_score: 95,
    notes: 'June 2024 EOI draw',
    source_url: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/immigrating-to-saskatchewan/saskatchewan-immigrant-nominee-program/entrepreneurs',
  },
  {
    program_id: 'sk-entrepreneur',
    draw_date: '2024-01-15',
    invitations_issued: 13,
    min_score: 120,
    notes: 'January 2024 — 13 ITAs; score range 120-160',
    source_url: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/immigrating-to-saskatchewan/saskatchewan-immigrant-nominee-program/entrepreneurs',
  },
  {
    program_id: 'sk-entrepreneur',
    draw_date: '2023-12-07',
    invitations_issued: 25,
    min_score: 100,
    notes: 'December 2023 EOI draw',
    source_url: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/immigrating-to-saskatchewan/saskatchewan-immigrant-nominee-program/entrepreneurs',
  },
  {
    program_id: 'sk-entrepreneur',
    draw_date: '2023-09-07',
    invitations_issued: 27,
    min_score: 97,
    notes: 'September 2023 EOI draw',
    source_url: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/immigrating-to-saskatchewan/saskatchewan-immigrant-nominee-program/entrepreneurs',
  },
  {
    program_id: 'sk-entrepreneur',
    draw_date: '2023-06-08',
    invitations_issued: 22,
    min_score: 102,
    notes: 'June 2023 EOI draw',
    source_url: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/immigrating-to-saskatchewan/saskatchewan-immigrant-nominee-program/entrepreneurs',
  },

  // =========================================================================
  // Alberta — Rural Entrepreneur Stream
  // AB uses continuous intake with no published cut-off scores. Approximate
  // quarterly intake dates and ITA counts based on AAIP reporting.
  // =========================================================================
  {
    program_id: 'ab-rural-entrepreneur',
    draw_date: '2025-01-10',
    invitations_issued: 20,
    min_score: null,
    notes: 'Q1 2025 intake period — applications processed on rolling basis',
    source_url: 'https://www.alberta.ca/aaip-rural-entrepreneur-stream',
  },
  {
    program_id: 'ab-rural-entrepreneur',
    draw_date: '2024-10-10',
    invitations_issued: 18,
    min_score: null,
    notes: 'Q4 2024 intake period',
    source_url: 'https://www.alberta.ca/aaip-rural-entrepreneur-stream',
  },
  {
    program_id: 'ab-rural-entrepreneur',
    draw_date: '2024-07-10',
    invitations_issued: 22,
    min_score: null,
    notes: 'Q3 2024 intake period',
    source_url: 'https://www.alberta.ca/aaip-rural-entrepreneur-stream',
  },
  {
    program_id: 'ab-rural-entrepreneur',
    draw_date: '2024-04-10',
    invitations_issued: 16,
    min_score: null,
    notes: 'Q2 2024 intake period',
    source_url: 'https://www.alberta.ca/aaip-rural-entrepreneur-stream',
  },
  {
    program_id: 'ab-rural-entrepreneur',
    draw_date: '2024-01-10',
    invitations_issued: 15,
    min_score: null,
    notes: 'Q1 2024 intake period',
    source_url: 'https://www.alberta.ca/aaip-rural-entrepreneur-stream',
  },
  {
    program_id: 'ab-rural-entrepreneur',
    draw_date: '2023-10-10',
    invitations_issued: 14,
    min_score: null,
    notes: 'Q4 2023 intake period',
    source_url: 'https://www.alberta.ca/aaip-rural-entrepreneur-stream',
  },

  // =========================================================================
  // Yukon — Business Nominee Program
  // YK uses time-gated intake periods (not draws). 282 total nomination slots
  // for 2026. No published min_score. Intake windows: Jan 19-30 & Jul 6-17, 2026.
  // =========================================================================
  {
    program_id: 'yk-business-nominee',
    draw_date: '2026-01-30',
    invitations_issued: null,
    min_score: null,
    notes: 'January 2026 intake window (Jan 19-30); 282 nomination slots for 2026',
    source_url: 'https://yukon.ca/en/immigration/yukon-business-nominee-program',
  },
  {
    program_id: 'yk-business-nominee',
    draw_date: '2025-07-18',
    invitations_issued: null,
    min_score: null,
    notes: 'July 2025 intake window; Strategic Sector List restricts eligible industries',
    source_url: 'https://yukon.ca/en/immigration/yukon-business-nominee-program',
  },
  {
    program_id: 'yk-business-nominee',
    draw_date: '2025-01-31',
    invitations_issued: null,
    min_score: null,
    notes: 'January 2025 intake window',
    source_url: 'https://yukon.ca/en/immigration/yukon-business-nominee-program',
  },
]

// ---------------------------------------------------------------------------
// Main seed logic
// ---------------------------------------------------------------------------

async function seedDraws(): Promise<void> {
  console.log(`Seeding ${DRAW_DATA.length} historical draw records...\n`)

  let inserted = 0
  let errors = 0

  for (const draw of DRAW_DATA) {
    const { error } = await supabase.from('draws').upsert(
      {
        program_id: draw.program_id,
        draw_date: draw.draw_date,
        invitations_issued: draw.invitations_issued,
        min_score: draw.min_score,
        notes: draw.notes,
        source_url: draw.source_url,
      },
      { onConflict: 'program_id,draw_date' }
    )

    if (error) {
      console.error(
        `  ERROR: ${draw.program_id} / ${draw.draw_date}: ${error.message}`
      )
      errors++
      continue
    }

    console.log(`  + ${draw.program_id} / ${draw.draw_date}`)
    inserted++
  }

  console.log(
    `\nDone. Inserted ${inserted} draws, ${errors} errors.`
  )

  // Summary per program
  const programCounts = DRAW_DATA.reduce<Record<string, number>>((acc, d) => {
    acc[d.program_id] = (acc[d.program_id] ?? 0) + 1
    return acc
  }, {})

  console.log('\nDraws per program:')
  for (const [id, count] of Object.entries(programCounts).sort()) {
    console.log(`  ${id}: ${count} draws`)
  }
}

seedDraws().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
