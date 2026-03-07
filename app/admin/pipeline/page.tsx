'use client'

import { useEffect, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewItem {
  id: string
  programName: string
  changeType: string
  diffSummary: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface PipelineRun {
  id: string
  date: string
  province: string
  status: 'success' | 'failed' | 'partial'
  rulesChanged: number
  drawsChanged: number
}

// ---------------------------------------------------------------------------
// Mock pipeline runs — will come from Supabase later
// ---------------------------------------------------------------------------

const MOCK_PIPELINE_RUNS: PipelineRun[] = [
  { id: 'run-1', date: '2026-03-07', province: 'BC', status: 'success', rulesChanged: 2, drawsChanged: 1 },
  { id: 'run-2', date: '2026-03-06', province: 'AB', status: 'success', rulesChanged: 0, drawsChanged: 3 },
  { id: 'run-3', date: '2026-03-05', province: 'ON', status: 'failed', rulesChanged: 0, drawsChanged: 0 },
  { id: 'run-4', date: '2026-03-04', province: 'MB', status: 'success', rulesChanged: 1, drawsChanged: 0 },
  { id: 'run-5', date: '2026-03-03', province: 'NS', status: 'partial', rulesChanged: 1, drawsChanged: 2 },
]

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const headingStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 24 }
const sectionHeading: React.CSSProperties = { fontSize: 18, fontWeight: 600, margin: '32px 0 12px' }

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '2px solid #e0e0e0',
  fontWeight: 600,
  color: '#555',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
}

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
}

function statusBadge(status: string): React.CSSProperties {
  const colors: Record<string, { bg: string; fg: string }> = {
    pending: { bg: '#fff3cd', fg: '#856404' },
    approved: { bg: '#d4edda', fg: '#155724' },
    rejected: { bg: '#f8d7da', fg: '#721c24' },
    success: { bg: '#d4edda', fg: '#155724' },
    failed: { bg: '#f8d7da', fg: '#721c24' },
    partial: { bg: '#fff3cd', fg: '#856404' },
  }
  const c = colors[status] ?? { bg: '#e2e3e5', fg: '#383d41' }
  return { ...badgeBase, backgroundColor: c.bg, color: c.fg }
}

const btnBase: React.CSSProperties = {
  padding: '4px 12px',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  marginRight: 6,
}

const approveBtnStyle: React.CSSProperties = { ...btnBase, backgroundColor: '#28a745', color: '#fff' }
const rejectBtnStyle: React.CSSProperties = { ...btnBase, backgroundColor: '#dc3545', color: '#fff' }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionInFlight, setActionInFlight] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/review-queue')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: ReviewItem[] = await res.json()
      setReviewItems(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionInFlight(id)
    try {
      const res = await fetch('/api/admin/review-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionInFlight(null)
    }
  }

  return (
    <div>
      <h1 style={headingStyle}>Pipeline &amp; Review Queue</h1>

      {/* ---- Review Queue ---- */}
      <h2 style={sectionHeading}>Pending Reviews</h2>

      {loading && <p style={{ color: '#888' }}>Loading review queue...</p>}
      {error && <p style={{ color: '#dc3545' }}>Error: {error}</p>}

      {!loading && !error && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Program</th>
              <th style={thStyle}>Change Type</th>
              <th style={thStyle}>Diff Summary</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviewItems.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={6}>
                  No review items found.
                </td>
              </tr>
            )}
            {reviewItems.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{item.programName}</td>
                <td style={tdStyle}>{item.changeType.replace(/_/g, ' ')}</td>
                <td style={tdStyle}>{item.diffSummary}</td>
                <td style={tdStyle}>
                  <span style={statusBadge(item.status)}>{item.status}</span>
                </td>
                <td style={tdStyle}>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  {item.status === 'pending' ? (
                    <>
                      <button
                        style={approveBtnStyle}
                        disabled={actionInFlight === item.id}
                        onClick={() => handleAction(item.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        style={rejectBtnStyle}
                        disabled={actionInFlight === item.id}
                        onClick={() => handleAction(item.id, 'reject')}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#888', fontSize: 13 }}>--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ---- Pipeline Runs ---- */}
      <h2 style={sectionHeading}>Recent Pipeline Runs</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Province</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Rules Changed</th>
            <th style={thStyle}>Draws Changed</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_PIPELINE_RUNS.map((run) => (
            <tr key={run.id}>
              <td style={tdStyle}>{run.date}</td>
              <td style={tdStyle}>{run.province}</td>
              <td style={tdStyle}>
                <span style={statusBadge(run.status)}>{run.status}</span>
              </td>
              <td style={tdStyle}>{run.rulesChanged}</td>
              <td style={tdStyle}>{run.drawsChanged}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
