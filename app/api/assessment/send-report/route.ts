import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { IntelligenceReport } from '@/lib/pdf/intelligence-report'
import { sendReportEmail } from '@/lib/email/send-report'
import { buildReportEmailHtml } from '@/lib/email/templates/report-email'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/db/client'
import type { AIAnalysis } from '@/lib/ai/types'
import type { ProgramResult } from '@/lib/types/results'

/* ------------------------------------------------------------------ */
/*  Program display names (same as results page)                       */
/* ------------------------------------------------------------------ */
const PROGRAM_DISPLAY: Record<string, { province: string; stream: string }> = {
  'bc-entrepreneur-base': { province: 'British Columbia', stream: 'Entrepreneur Base' },
  'bc-entrepreneur-regional': { province: 'British Columbia', stream: 'Entrepreneur Regional' },
  'bc-entrepreneur-strategic': { province: 'British Columbia', stream: 'Entrepreneur Strategic' },
  'ab-rural-entrepreneur': { province: 'Alberta', stream: 'Rural Entrepreneur' },
  'ab-graduate-entrepreneur': { province: 'Alberta', stream: 'Graduate Entrepreneur' },
  'ab-foreign-graduate': { province: 'Alberta', stream: 'Foreign Graduate' },
  'ab-farm': { province: 'Alberta', stream: 'Farm Stream' },
  'sk-entrepreneur': { province: 'Saskatchewan', stream: 'Entrepreneur' },
  'sk-graduate-entrepreneur': { province: 'Saskatchewan', stream: 'Graduate Entrepreneur' },
  'mb-entrepreneur': { province: 'Manitoba', stream: 'Entrepreneur' },
  'mb-farm-investor': { province: 'Manitoba', stream: 'Farm Investor' },
  'on-entrepreneur': { province: 'Ontario', stream: 'Entrepreneur' },
  'nb-entrepreneurial': { province: 'New Brunswick', stream: 'Business Immigration' },
  'nb-post-grad': { province: 'New Brunswick', stream: 'Post-Graduate' },
  'ns-entrepreneur': { province: 'Nova Scotia', stream: 'Entrepreneur' },
  'ns-graduate-entrepreneur': { province: 'Nova Scotia', stream: 'Graduate Entrepreneur' },
  'pei-work-permit': { province: 'Prince Edward Island', stream: 'Work Permit' },
  'nl-entrepreneur': { province: 'Newfoundland & Labrador', stream: 'Entrepreneur' },
  'nl-graduate-entrepreneur': { province: 'Newfoundland & Labrador', stream: 'Graduate Entrepreneur' },
  'nwt-business': { province: 'Northwest Territories', stream: 'Business' },
  'yk-business-nominee': { province: 'Yukon', stream: 'Business Nominee' },
}

function displayName(id: string): { province: string; stream: string } {
  const known = PROGRAM_DISPLAY[id]
  if (known) return known
  const parts = id.split('-')
  return {
    province: (parts[0] ?? id).toUpperCase(),
    stream: parts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'General',
  }
}

/* ------------------------------------------------------------------ */
/*  Request body types                                                 */
/* ------------------------------------------------------------------ */
interface SendReportRequest {
  contactInfo: {
    fullName: string
    email: string
    phone: string
    marketingConsent: boolean
  }
  analysis: AIAnalysis
  results: ProgramResult[]
  answers?: Record<string, unknown>
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  // Basic validation
  const req = body as SendReportRequest
  if (
    !req?.contactInfo?.email ||
    !req?.contactInfo?.fullName ||
    !req?.analysis ||
    !Array.isArray(req?.results) ||
    req.results.length === 0
  ) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    )
  }

  try {
    // 1. Generate PDF
    const generatedAt = new Date().toISOString().split('T')[0]
    const origin = request.nextUrl.origin
    const headerImage = `${origin}/letterhead-header.png`
    const footerImage = `${origin}/letterhead-footer.png`

    const element = React.createElement(IntelligenceReport, {
      analysis: req.analysis,
      results: req.results,
      generatedAt,
      headerImage,
      footerImage,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = Buffer.from(await renderToBuffer(element as any))
    const pdfFilename = `genesislink-business-immigration-report-${generatedAt}.pdf`

    // 2. Build email content
    const eligibleResults = req.results.filter(
      (r) => r.eligibility.eligible && r.meta.status === 'active'
    )
    const sortedEligible = [...eligibleResults].sort(
      (a, b) => b.probability.percent - a.probability.percent
    )
    const topMatch = sortedEligible[0]
      ? (() => {
          const d = displayName(sortedEligible[0].programId)
          return { province: d.province, stream: d.stream, probability: sortedEligible[0].probability.percent }
        })()
      : null

    const top3 = sortedEligible.slice(0, 3).map((r) => {
      const d = displayName(r.programId)
      return { province: d.province, stream: d.stream, probability: r.probability.percent }
    })

    const htmlBody = buildReportEmailHtml({
      candidateName: req.contactInfo.fullName,
      eligibleCount: eligibleResults.length,
      totalPrograms: req.results.length,
      topMatch,
      top3Programs: top3,
      executiveSummary: req.analysis.executiveSummary,
      bookingUrl: 'https://genesislink.ca/book',
    })

    // 3. Send email
    const emailResult = await sendReportEmail({
      to: req.contactInfo.email,
      candidateName: req.contactInfo.fullName,
      htmlBody,
      pdfBuffer,
      pdfFilename,
    })

    if (!emailResult.success) {
      console.error('[send-report] Email failed:', emailResult.error)
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      )
    }

    // 4. Save lead to Supabase (non-blocking)
    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('assessments').insert({
          session_token: crypto.randomUUID(),
          email: req.contactInfo.email,
          full_name: req.contactInfo.fullName,
          phone: req.contactInfo.phone,
          marketing_consent: req.contactInfo.marketingConsent,
          answers: req.answers ?? {},
          results: {
            results: req.results,
            analysis: req.analysis,
          },
          completed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
      } catch (dbErr) {
        console.warn('[send-report] Lead save failed (non-critical):', dbErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[send-report] Error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
