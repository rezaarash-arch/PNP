import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { IntelligenceReport } from '@/lib/pdf/intelligence-report'
import type { AIAnalysis } from '@/lib/ai/types'
import type { ProgramResult } from '@/lib/types/results'

interface PdfRequestBody {
  analysis: AIAnalysis
  results: ProgramResult[]
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    )
  }

  // Basic shape validation
  if (
    !body ||
    typeof body !== 'object' ||
    !('analysis' in body) ||
    !('results' in body) ||
    !Array.isArray((body as PdfRequestBody).results) ||
    typeof (body as PdfRequestBody).analysis !== 'object'
  ) {
    return NextResponse.json(
      { error: 'Request body must include "analysis" object and "results" array' },
      { status: 400 }
    )
  }

  const { analysis, results } = body as PdfRequestBody

  if (results.length === 0) {
    return NextResponse.json(
      { error: 'Results array must not be empty' },
      { status: 400 }
    )
  }

  try {
    const generatedAt = new Date().toISOString().split('T')[0]

    const element = React.createElement(IntelligenceReport, {
      analysis,
      results,
      generatedAt,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)

    const filename = `genesislink-intelligence-report-${generatedAt}.pdf`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    )
  }
}
