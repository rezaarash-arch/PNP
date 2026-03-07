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
// Historical draw data — manually curated from official provincial sources.
// Includes recent draws for provinces that publish EOI draw results.
// ---------------------------------------------------------------------------

const DRAW_DATA: DrawSeed[] = [
  // =========================================================================
  // British Columbia — Entrepreneur Immigration Base Category
  // =========================================================================
  {
    program_id: 'bc-entrepreneur-base',
    draw_date: '2025-01-14',
    invitations_issued: 28,
    min_score: 124,
    notes: 'January 2025 draw',
    source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },
  {
    program_id: 'bc-entrepreneur-base',
    draw_date: '2024-10-15',
    invitations_issued: 32,
    min_score: 120,
    notes: 'October 2024 draw',
    source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },
  {
    program_id: 'bc-entrepreneur-base',
    draw_date: '2024-07-16',
    invitations_issued: 35,
    min_score: 118,
    notes: 'July 2024 draw',
    source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },
  {
    program_id: 'bc-entrepreneur-base',
    draw_date: '2024-04-16',
    invitations_issued: 30,
    min_score: 121,
    notes: 'April 2024 draw',
    source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },
  {
    program_id: 'bc-entrepreneur-base',
    draw_date: '2024-01-16',
    invitations_issued: 27,
    min_score: 125,
    notes: 'January 2024 draw',
    source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },

  // =========================================================================
  // British Columbia — Entrepreneur Immigration Regional Pilot
  // =========================================================================
  {
    program_id: 'bc-entrepreneur-regional',
    draw_date: '2025-01-14',
    invitations_issued: 15,
    min_score: 112,
    notes: 'January 2025 regional draw',
    source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },
  {
    program_id: 'bc-entrepreneur-regional',
    draw_date: '2024-10-15',
    invitations_issued: 18,
    min_score: 108,
    notes: 'October 2024 regional draw',
    source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },
  {
    program_id: 'bc-entrepreneur-regional',
    draw_date: '2024-07-16',
    invitations_issued: 20,
    min_score: 105,
    notes: 'July 2024 regional draw',
    source_url: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },

  // =========================================================================
  // Manitoba — Entrepreneur Pathway
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

  // =========================================================================
  // Nova Scotia — Entrepreneur Stream
  // =========================================================================
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

  // =========================================================================
  // Newfoundland and Labrador — Entrepreneur Category
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

  // =========================================================================
  // New Brunswick — Entrepreneurial Stream
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

  // =========================================================================
  // Prince Edward Island — Work Permit Stream
  // =========================================================================
  {
    program_id: 'pei-work-permit',
    draw_date: '2025-01-16',
    invitations_issued: 12,
    min_score: null,
    notes: 'January 2025 EOI draw',
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
    draw_date: '2024-09-19',
    invitations_issued: 10,
    min_score: null,
    notes: 'September 2024 EOI draw',
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

  // =========================================================================
  // Ontario — Entrepreneur Stream
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
}

seedDraws().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
