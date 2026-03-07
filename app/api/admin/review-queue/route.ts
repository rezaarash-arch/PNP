import { NextResponse, NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Review-queue API — placeholder until Supabase is wired up.
// GET  → returns pending review items
// POST → approve / reject an item
// ---------------------------------------------------------------------------

export interface ReviewItem {
  id: string
  programName: string
  changeType: 'eligibility_update' | 'scoring_update' | 'new_program' | 'status_change'
  diffSummary: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

// In-memory store — reset on server restart.  Will be replaced by Supabase.
const reviewItems: ReviewItem[] = [
  {
    id: 'rev-001',
    programName: 'BC PNP Entrepreneur — Base Category',
    changeType: 'scoring_update',
    diffSummary: 'Updated net-worth scoring tier from $1M to $1.2M for max points',
    status: 'pending',
    createdAt: '2026-03-05T14:30:00Z',
  },
  {
    id: 'rev-002',
    programName: 'Alberta AAIP — Rural Entrepreneur',
    changeType: 'eligibility_update',
    diffSummary: 'Raised minimum CLB requirement from 4 to 5',
    status: 'pending',
    createdAt: '2026-03-06T09:15:00Z',
  },
  {
    id: 'rev-003',
    programName: 'Ontario OINP — Entrepreneur Stream',
    changeType: 'status_change',
    diffSummary: 'Status changed from redesigning → active',
    status: 'pending',
    createdAt: '2026-03-06T16:45:00Z',
  },
]

export async function GET() {
  return NextResponse.json(reviewItems)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body as { id: string; action: 'approve' | 'reject' }

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request — id and action (approve|reject) required' },
        { status: 400 },
      )
    }

    const item = reviewItems.find((r) => r.id === id)
    if (!item) {
      return NextResponse.json({ error: 'Review item not found' }, { status: 404 })
    }

    item.status = action === 'approve' ? 'approved' : 'rejected'
    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
