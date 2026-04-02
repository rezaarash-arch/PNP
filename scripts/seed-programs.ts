/**
 * Seed script: Inserts all 21 PNP entrepreneur programs and their v1 rules
 * into the Supabase database.
 *
 * Usage: npx tsx scripts/seed-programs.ts
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
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
// Program metadata for all 21 programs
// ---------------------------------------------------------------------------

interface ProgramMeta {
  provinceCode: string
  provinceName: string
  streamName: string
  streamSlug: string
  category: 'main' | 'regional' | 'graduate' | 'farm' | 'strategic'
  status: 'active' | 'paused' | 'closed' | 'redesigning'
  statusNote: string | null
  eoiType: 'points_ranked' | 'eligibility_only'
  hasPointsGrid: boolean
  officialUrl: string
  drawPageUrl: string | null
}

const PROGRAM_METADATA: Record<string, ProgramMeta> = {
  'ab-farm': {
    provinceCode: 'AB',
    provinceName: 'Alberta',
    streamName: 'Alberta Advantage Immigration Program — Farm Stream',
    streamSlug: 'ab-farm',
    category: 'farm',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl: 'https://www.alberta.ca/aaip-farm-stream',
    drawPageUrl: null,
  },
  'ab-foreign-graduate': {
    provinceCode: 'AB',
    provinceName: 'Alberta',
    streamName: 'Alberta Advantage Immigration Program — Foreign Graduate Entrepreneur Stream',
    streamSlug: 'ab-foreign-graduate',
    category: 'graduate',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl: 'https://www.alberta.ca/aaip-foreign-graduate-entrepreneur-stream',
    drawPageUrl: null,
  },
  'ab-graduate-entrepreneur': {
    provinceCode: 'AB',
    provinceName: 'Alberta',
    streamName: 'Alberta Advantage Immigration Program — Graduate Entrepreneur Stream',
    streamSlug: 'ab-graduate-entrepreneur',
    category: 'graduate',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl: 'https://www.alberta.ca/aaip-graduate-entrepreneur-stream',
    drawPageUrl: null,
  },
  'ab-rural-entrepreneur': {
    provinceCode: 'AB',
    provinceName: 'Alberta',
    streamName: 'Alberta Advantage Immigration Program — Rural Entrepreneur Stream',
    streamSlug: 'ab-rural-entrepreneur',
    category: 'regional',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl: 'https://www.alberta.ca/aaip-rural-entrepreneur-stream',
    drawPageUrl: null,
  },
  'bc-entrepreneur-base': {
    provinceCode: 'BC',
    provinceName: 'British Columbia',
    streamName: 'BC PNP Entrepreneur Immigration — Base Category',
    streamSlug: 'bc-entrepreneur-base',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration',
    drawPageUrl: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },
  'bc-entrepreneur-regional': {
    provinceCode: 'BC',
    provinceName: 'British Columbia',
    streamName: 'BC PNP Entrepreneur Immigration — Regional Pilot',
    streamSlug: 'bc-entrepreneur-regional',
    category: 'regional',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl:
      'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/regional-pilot',
    drawPageUrl: 'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/ei-draws',
  },
  'bc-entrepreneur-strategic': {
    provinceCode: 'BC',
    provinceName: 'British Columbia',
    streamName: 'BC PNP Entrepreneur Immigration — Strategic Projects',
    streamSlug: 'bc-entrepreneur-strategic',
    category: 'strategic',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl:
      'https://www.welcomebc.ca/immigrate-to-b-c/entrepreneur-immigration/strategic-projects',
    drawPageUrl: null,
  },
  'mb-entrepreneur': {
    provinceCode: 'MB',
    provinceName: 'Manitoba',
    streamName: 'Manitoba Provincial Nominee Program — Entrepreneur Pathway',
    streamSlug: 'mb-entrepreneur',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/',
    drawPageUrl:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/entrepreneur-pathway/eoi-draws/',
  },
  'mb-farm-investor': {
    provinceCode: 'MB',
    provinceName: 'Manitoba',
    streamName: 'Manitoba Provincial Nominee Program — Farm Investor Pathway',
    streamSlug: 'mb-farm-investor',
    category: 'farm',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl:
      'https://immigratemanitoba.com/immigrate-to-manitoba/business-investor/farm-investor-pathway/',
    drawPageUrl: null,
  },
  'nb-entrepreneurial': {
    provinceCode: 'NB',
    provinceName: 'New Brunswick',
    streamName: 'New Brunswick Provincial Nominee Program — Entrepreneurial Stream',
    streamSlug: 'nb-entrepreneurial',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/EntrepreneurialStream.html',
    drawPageUrl: null,
  },
  'nb-post-grad': {
    provinceCode: 'NB',
    provinceName: 'New Brunswick',
    streamName:
      'New Brunswick Provincial Nominee Program — Post-Graduate Entrepreneurial Stream',
    streamSlug: 'nb-post-grad',
    category: 'graduate',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl:
      'https://www.welcomenb.ca/content/wel-bien/en/immigration/content/HowToImmigrate/NBProvincialNomineeProgram/PostGraduateEntrepreneurialStream.html',
    drawPageUrl: null,
  },
  'nl-entrepreneur': {
    provinceCode: 'NL',
    provinceName: 'Newfoundland and Labrador',
    streamName:
      'Newfoundland and Labrador Provincial Nominee Program — Entrepreneur Category',
    streamSlug: 'nl-entrepreneur',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl: 'https://www.gov.nl.ca/immigration/immigrating-to-newfoundland-and-labrador/provincial-nominee-program/entrepreneur/',
    drawPageUrl: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },
  'nl-graduate-entrepreneur': {
    provinceCode: 'NL',
    provinceName: 'Newfoundland and Labrador',
    streamName:
      'Newfoundland and Labrador Provincial Nominee Program — International Graduate Entrepreneur Category',
    streamSlug: 'nl-graduate-entrepreneur',
    category: 'graduate',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl:
      'https://www.gov.nl.ca/immigration/immigrating-to-newfoundland-and-labrador/provincial-nominee-program/international-graduate-entrepreneur/',
    drawPageUrl: 'https://www.gov.nl.ca/immigration/eoi-draws/',
  },
  'ns-entrepreneur': {
    provinceCode: 'NS',
    provinceName: 'Nova Scotia',
    streamName: 'Nova Scotia Nominee Program — Entrepreneur Stream',
    streamSlug: 'ns-entrepreneur',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl:
      'https://novascotiaimmigration.com/move-here/entrepreneur/',
    drawPageUrl: 'https://novascotiaimmigration.com/move-here/entrepreneur/',
  },
  'ns-graduate-entrepreneur': {
    provinceCode: 'NS',
    provinceName: 'Nova Scotia',
    streamName: 'Nova Scotia Nominee Program — International Graduate Entrepreneur Stream',
    streamSlug: 'ns-graduate-entrepreneur',
    category: 'graduate',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl:
      'https://novascotiaimmigration.com/move-here/international-graduate-entrepreneur/',
    drawPageUrl: 'https://novascotiaimmigration.com/move-here/international-graduate-entrepreneur/',
  },
  'nwt-business': {
    provinceCode: 'NT',
    provinceName: 'Northwest Territories',
    streamName: 'Northwest Territories Nominee Program — Business Stream',
    streamSlug: 'nwt-business',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl:
      'https://www.immigratenwt.ca/business-stream',
    drawPageUrl: null,
  },
  'on-entrepreneur': {
    provinceCode: 'ON',
    provinceName: 'Ontario',
    streamName: 'Ontario Immigrant Nominee Program — Entrepreneur Stream',
    streamSlug: 'on-entrepreneur',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl:
      'https://www.ontario.ca/page/oinp-entrepreneur-stream',
    drawPageUrl: 'https://www.ontario.ca/page/oinp-entrepreneur-stream',
  },
  'pei-work-permit': {
    provinceCode: 'PE',
    provinceName: 'Prince Edward Island',
    streamName: 'PEI Provincial Nominee Program — Work Permit Stream',
    streamSlug: 'pei-work-permit',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'points_ranked',
    hasPointsGrid: true,
    officialUrl: 'https://www.princeedwardisland.ca/en/information/office-of-immigration/pei-pnp-business-impact-category-work-permit-stream',
    drawPageUrl: 'https://www.princeedwardisland.ca/en/information/office-of-immigration/expression-of-interest-draws',
  },
  'sk-entrepreneur': {
    provinceCode: 'SK',
    provinceName: 'Saskatchewan',
    streamName: 'Saskatchewan Immigrant Nominee Program — Entrepreneur Category',
    streamSlug: 'sk-entrepreneur',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl:
      'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/immigrating-to-saskatchewan/saskatchewan-immigrant-nominee-program/applicants-with-entrepreneur-experience/entrepreneur',
    drawPageUrl: null,
  },
  'sk-graduate-entrepreneur': {
    provinceCode: 'SK',
    provinceName: 'Saskatchewan',
    streamName:
      'Saskatchewan Immigrant Nominee Program — Graduate Entrepreneur Category',
    streamSlug: 'sk-graduate-entrepreneur',
    category: 'graduate',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl:
      'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/immigrating-to-saskatchewan/saskatchewan-immigrant-nominee-program/applicants-with-entrepreneur-experience/graduate-entrepreneur',
    drawPageUrl: null,
  },
  'yk-business-nominee': {
    provinceCode: 'YT',
    provinceName: 'Yukon',
    streamName: 'Yukon Nominee Program — Business Nominee',
    streamSlug: 'yk-business-nominee',
    category: 'main',
    status: 'active',
    statusNote: null,
    eoiType: 'eligibility_only',
    hasPointsGrid: false,
    officialUrl: 'https://yukon.ca/en/doing-business/business-and-immigration/apply-yukon-nominee-program-business',
    drawPageUrl: null,
  },
}

// ---------------------------------------------------------------------------
// Main seed logic
// ---------------------------------------------------------------------------

async function seedPrograms(): Promise<void> {
  const rulesDir = join(__dirname, '..', 'lib', 'data', 'rules')

  // Read all rule JSON files
  const ruleFiles = readdirSync(rulesDir).filter(
    (f) => f.endsWith('.json') && !f.includes('.test.')
  )

  console.log(`Found ${ruleFiles.length} rule files in ${rulesDir}`)

  let insertedPrograms = 0
  let insertedRules = 0

  for (const file of ruleFiles) {
    const programId = file.replace('.json', '')
    const meta = PROGRAM_METADATA[programId]

    if (!meta) {
      console.warn(`  SKIP: No metadata defined for "${programId}"`)
      continue
    }

    // Read the rule JSON
    const rulesJson = JSON.parse(readFileSync(join(rulesDir, file), 'utf-8'))

    // Insert program row
    const { error: progError } = await supabase.from('programs').upsert(
      {
        id: programId,
        province_code: meta.provinceCode,
        province_name: meta.provinceName,
        stream_name: meta.streamName,
        stream_slug: meta.streamSlug,
        category: meta.category,
        status: meta.status,
        status_note: meta.statusNote,
        eoi_type: meta.eoiType,
        has_points_grid: meta.hasPointsGrid,
        official_url: meta.officialUrl,
        draw_page_url: meta.drawPageUrl,
      },
      { onConflict: 'id' }
    )

    if (progError) {
      console.error(`  ERROR inserting program "${programId}": ${progError.message}`)
      continue
    }

    insertedPrograms++
    console.log(`  + program: ${programId}`)

    // Insert v1 rules
    const { error: rulesError } = await supabase.from('program_rules').upsert(
      {
        program_id: programId,
        version: 1,
        rules: rulesJson,
        effective_from: new Date().toISOString(),
        effective_until: null,
        change_summary: 'Initial rule definition',
      },
      { onConflict: 'program_id,version' }
    )

    if (rulesError) {
      console.error(`  ERROR inserting rules for "${programId}": ${rulesError.message}`)
      continue
    }

    insertedRules++
    console.log(`    + rules v1`)
  }

  console.log(
    `\nDone. Inserted ${insertedPrograms} programs and ${insertedRules} rule versions.`
  )
}

seedPrograms().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
