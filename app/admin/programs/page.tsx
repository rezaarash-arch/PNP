'use client'

import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Types — mirrors ProgramInfo from the programs API
// ---------------------------------------------------------------------------

interface ProgramInfo {
  id: string
  provinceCode: string
  provinceName: string
  streamName: string
  category: string
  status: 'active' | 'paused' | 'closed' | 'redesigning'
  eoiType: string
  hasPointsGrid: boolean
}

// ---------------------------------------------------------------------------
// Static rule imports — all 21 program rule files
// ---------------------------------------------------------------------------

import bcBase from '@/lib/data/rules/bc-entrepreneur-base.json'
import bcRegional from '@/lib/data/rules/bc-entrepreneur-regional.json'
import bcStrategic from '@/lib/data/rules/bc-entrepreneur-strategic.json'
import abRural from '@/lib/data/rules/ab-rural-entrepreneur.json'
import abGrad from '@/lib/data/rules/ab-graduate-entrepreneur.json'
import abForeign from '@/lib/data/rules/ab-foreign-graduate.json'
import abFarm from '@/lib/data/rules/ab-farm.json'
import skEntr from '@/lib/data/rules/sk-entrepreneur.json'
import skGrad from '@/lib/data/rules/sk-graduate-entrepreneur.json'
import mbEntr from '@/lib/data/rules/mb-entrepreneur.json'
import mbFarm from '@/lib/data/rules/mb-farm-investor.json'
import onEntr from '@/lib/data/rules/on-entrepreneur.json'
import nbEntr from '@/lib/data/rules/nb-entrepreneurial.json'
import nbPost from '@/lib/data/rules/nb-post-grad.json'
import nsEntr from '@/lib/data/rules/ns-entrepreneur.json'
import nsGrad from '@/lib/data/rules/ns-graduate-entrepreneur.json'
import pei from '@/lib/data/rules/pei-work-permit.json'
import nlEntr from '@/lib/data/rules/nl-entrepreneur.json'
import nlGrad from '@/lib/data/rules/nl-graduate-entrepreneur.json'
import nwt from '@/lib/data/rules/nwt-business.json'
import yk from '@/lib/data/rules/yk-business-nominee.json'

const RULES_MAP: Record<string, unknown> = {
  'bc-entrepreneur-base': bcBase,
  'bc-entrepreneur-regional': bcRegional,
  'bc-entrepreneur-strategic': bcStrategic,
  'ab-rural-entrepreneur': abRural,
  'ab-graduate-entrepreneur': abGrad,
  'ab-foreign-graduate': abForeign,
  'ab-farm': abFarm,
  'sk-entrepreneur': skEntr,
  'sk-graduate-entrepreneur': skGrad,
  'mb-entrepreneur': mbEntr,
  'mb-farm-investor': mbFarm,
  'on-entrepreneur': onEntr,
  'nb-entrepreneurial': nbEntr,
  'nb-post-grad': nbPost,
  'ns-entrepreneur': nsEntr,
  'ns-graduate-entrepreneur': nsGrad,
  'pei-work-permit': pei,
  'nl-entrepreneur': nlEntr,
  'nl-graduate-entrepreneur': nlGrad,
  'nwt-business': nwt,
  'yk-business-nominee': yk,
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const headingStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 24 }

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
  verticalAlign: 'top',
}

const clickableRow: React.CSSProperties = {
  cursor: 'pointer',
}

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { bg: string; fg: string }> = {
    active: { bg: '#d4edda', fg: '#155724' },
    closed: { bg: '#f8d7da', fg: '#721c24' },
    redesigning: { bg: '#fff3cd', fg: '#856404' },
    paused: { bg: '#e2e3e5', fg: '#383d41' },
  }
  const c = colors[status] ?? { bg: '#e2e3e5', fg: '#383d41' }
  return { ...badgeBase, backgroundColor: c.bg, color: c.fg }
}

const jsonViewerStyle: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  borderRadius: 4,
  padding: 16,
  margin: '8px 0 16px',
  maxHeight: 400,
  overflow: 'auto',
  fontFamily: 'monospace',
  fontSize: 12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/programs')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: ProgramInfo[] = await res.json()
        setPrograms(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load programs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      <h1 style={headingStyle}>Programs</h1>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
        {programs.length} programs registered. Click a row to view its rules JSON.
      </p>

      {loading && <p style={{ color: '#888' }}>Loading programs...</p>}
      {error && <p style={{ color: '#dc3545' }}>Error: {error}</p>}

      {!loading && !error && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Province</th>
              <th style={thStyle}>Stream Name</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Points Grid</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <>
                <tr
                  key={p.id}
                  style={clickableRow}
                  onClick={() => toggleExpand(p.id)}
                  title="Click to expand rules"
                >
                  <td style={tdStyle}>
                    <code>{p.id}</code>
                  </td>
                  <td style={tdStyle}>{p.provinceName} ({p.provinceCode})</td>
                  <td style={tdStyle}>{p.streamName}</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(p.status)}>{p.status}</span>
                  </td>
                  <td style={tdStyle}>{p.hasPointsGrid ? 'Yes' : 'No'}</td>
                </tr>
                {expandedId === p.id && (
                  <tr key={`${p.id}-rules`}>
                    <td colSpan={5} style={{ padding: '0 12px' }}>
                      <div style={jsonViewerStyle}>
                        {RULES_MAP[p.id]
                          ? JSON.stringify(RULES_MAP[p.id], null, 2)
                          : 'No rules JSON available for this program.'}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
