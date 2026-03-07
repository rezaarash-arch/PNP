import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Public program metadata — mirrors the canonical registry in the database.
// Since we don't have a live Supabase connection yet, this is maintained
// as an in-memory map derived from the seed data.
// ---------------------------------------------------------------------------

export interface ProgramInfo {
  id: string
  provinceCode: string
  provinceName: string
  streamName: string
  category: 'main' | 'regional' | 'graduate' | 'farm' | 'strategic'
  status: 'active' | 'paused' | 'closed' | 'redesigning'
  eoiType: 'points_ranked' | 'first_come' | 'intake_period' | 'none'
  hasPointsGrid: boolean
}

const PROGRAMS: ProgramInfo[] = [
  {
    id: 'bc-entrepreneur-base',
    provinceCode: 'BC',
    provinceName: 'British Columbia',
    streamName: 'BC PNP Entrepreneur Immigration — Base Category',
    category: 'main',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'bc-entrepreneur-regional',
    provinceCode: 'BC',
    provinceName: 'British Columbia',
    streamName: 'BC PNP Entrepreneur Immigration — Regional Pilot',
    category: 'regional',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'bc-entrepreneur-strategic',
    provinceCode: 'BC',
    provinceName: 'British Columbia',
    streamName: 'BC PNP Entrepreneur Immigration — Strategic Projects',
    category: 'strategic',
    status: 'active',
    eoiType: 'none',
    hasPointsGrid: false,
  },
  {
    id: 'ab-rural-entrepreneur',
    provinceCode: 'AB',
    provinceName: 'Alberta',
    streamName: 'Alberta Advantage Immigration Program — Rural Entrepreneur Stream',
    category: 'regional',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'ab-graduate-entrepreneur',
    provinceCode: 'AB',
    provinceName: 'Alberta',
    streamName: 'Alberta Advantage Immigration Program — Graduate Entrepreneur Stream',
    category: 'graduate',
    status: 'active',
    eoiType: 'none',
    hasPointsGrid: false,
  },
  {
    id: 'ab-foreign-graduate',
    provinceCode: 'AB',
    provinceName: 'Alberta',
    streamName: 'Alberta Advantage Immigration Program — Foreign Graduate Entrepreneur Stream',
    category: 'graduate',
    status: 'active',
    eoiType: 'none',
    hasPointsGrid: false,
  },
  {
    id: 'ab-farm',
    provinceCode: 'AB',
    provinceName: 'Alberta',
    streamName: 'Alberta Advantage Immigration Program — Farm Stream',
    category: 'farm',
    status: 'active',
    eoiType: 'none',
    hasPointsGrid: false,
  },
  {
    id: 'sk-entrepreneur',
    provinceCode: 'SK',
    provinceName: 'Saskatchewan',
    streamName: 'Saskatchewan Immigrant Nominee Program — Entrepreneur Category',
    category: 'main',
    status: 'closed',
    eoiType: 'none',
    hasPointsGrid: false,
  },
  {
    id: 'sk-graduate-entrepreneur',
    provinceCode: 'SK',
    provinceName: 'Saskatchewan',
    streamName: 'Saskatchewan Immigrant Nominee Program — Graduate Entrepreneur Category',
    category: 'graduate',
    status: 'closed',
    eoiType: 'none',
    hasPointsGrid: false,
  },
  {
    id: 'mb-entrepreneur',
    provinceCode: 'MB',
    provinceName: 'Manitoba',
    streamName: 'Manitoba Provincial Nominee Program — Entrepreneur Pathway',
    category: 'main',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'mb-farm-investor',
    provinceCode: 'MB',
    provinceName: 'Manitoba',
    streamName: 'Manitoba Provincial Nominee Program — Farm Investor Pathway',
    category: 'farm',
    status: 'active',
    eoiType: 'none',
    hasPointsGrid: false,
  },
  {
    id: 'on-entrepreneur',
    provinceCode: 'ON',
    provinceName: 'Ontario',
    streamName: 'Ontario Immigrant Nominee Program — Entrepreneur Stream',
    category: 'main',
    status: 'redesigning',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'nb-entrepreneurial',
    provinceCode: 'NB',
    provinceName: 'New Brunswick',
    streamName: 'New Brunswick Provincial Nominee Program — Entrepreneurial Stream',
    category: 'main',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'nb-post-grad',
    provinceCode: 'NB',
    provinceName: 'New Brunswick',
    streamName: 'New Brunswick Provincial Nominee Program — Post-Graduate Entrepreneurial Stream',
    category: 'graduate',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'ns-entrepreneur',
    provinceCode: 'NS',
    provinceName: 'Nova Scotia',
    streamName: 'Nova Scotia Nominee Program — Entrepreneur Stream',
    category: 'main',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'ns-graduate-entrepreneur',
    provinceCode: 'NS',
    provinceName: 'Nova Scotia',
    streamName: 'Nova Scotia Nominee Program — International Graduate Entrepreneur Stream',
    category: 'graduate',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'pei-work-permit',
    provinceCode: 'PE',
    provinceName: 'Prince Edward Island',
    streamName: 'PEI Provincial Nominee Program — Work Permit Stream',
    category: 'main',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'nl-entrepreneur',
    provinceCode: 'NL',
    provinceName: 'Newfoundland and Labrador',
    streamName: 'Newfoundland and Labrador Provincial Nominee Program — Entrepreneur Category',
    category: 'main',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'nl-graduate-entrepreneur',
    provinceCode: 'NL',
    provinceName: 'Newfoundland and Labrador',
    streamName:
      'Newfoundland and Labrador Provincial Nominee Program — International Graduate Entrepreneur Category',
    category: 'graduate',
    status: 'active',
    eoiType: 'points_ranked',
    hasPointsGrid: true,
  },
  {
    id: 'nwt-business',
    provinceCode: 'NT',
    provinceName: 'Northwest Territories',
    streamName: 'Northwest Territories Nominee Program — Business Stream',
    category: 'main',
    status: 'active',
    eoiType: 'none',
    hasPointsGrid: false,
  },
  {
    id: 'yk-business-nominee',
    provinceCode: 'YT',
    provinceName: 'Yukon',
    streamName: 'Yukon Nominee Program — Business Nominee',
    category: 'main',
    status: 'active',
    eoiType: 'none',
    hasPointsGrid: false,
  },
]

export async function GET() {
  return NextResponse.json(PROGRAMS, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
