import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { AIAnalysis } from '@/lib/ai/types'
import type { ProgramResult } from '@/lib/types/results'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface IntelligenceReportProps {
  analysis: AIAnalysis
  results: ProgramResult[]
  generatedAt: string
  headerImage?: string
  footerImage?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const PROVINCE_LOOKUP: Record<string, string> = {
  ab: 'Alberta',
  bc: 'British Columbia',
  mb: 'Manitoba',
  nb: 'New Brunswick',
  nl: 'Newfoundland & Labrador',
  ns: 'Nova Scotia',
  nwt: 'Northwest Territories',
  on: 'Ontario',
  pei: 'Prince Edward Island',
  sk: 'Saskatchewan',
  yk: 'Yukon',
}

function formatProgramName(programId: string): string {
  return programId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function extractProvince(programId: string): string {
  const code = programId.split('-')[0]
  return PROVINCE_LOOKUP[code] ?? code.toUpperCase()
}

function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    strong: 'Strong',
    competitive: 'Competitive',
    moderate: 'Moderate',
    low: 'Low',
    unlikely: 'Unlikely',
    ineligible: 'Ineligible',
  }
  return map[tier] ?? tier
}

function fitLabel(fit: string): string {
  return fit.charAt(0).toUpperCase() + fit.slice(1) + ' Fit'
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const NAVY = '#1a1a2e'
const ACCENT = '#16537e'
const LIGHT_GRAY = '#f4f4f4'
const MEDIUM_GRAY = '#cccccc'
const DARK_GRAY = '#555555'
const WHITE = '#ffffff'
const BLACK = '#111111'

const styles = StyleSheet.create({
  /* Page */
  page: {
    paddingTop: 75,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: BLACK,
  },

  /* Cover / Header */
  coverTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 4,
  },
  coverSubtitle: {
    fontSize: 12,
    color: DARK_GRAY,
    marginBottom: 16,
  },
  hr: {
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    marginBottom: 20,
  },

  /* Section headings */
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: ACCENT,
    paddingBottom: 4,
  },

  /* Body text */
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: BLACK,
    marginBottom: 8,
  },

  /* Program analysis blocks */
  programBlock: {
    marginTop: 12,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: MEDIUM_GRAY,
    borderRadius: 3,
  },
  programTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    marginBottom: 4,
  },
  fitBadge: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK_GRAY,
    marginBottom: 6,
  },
  programNarrative: {
    fontSize: 9,
    lineHeight: 1.4,
    color: BLACK,
    marginBottom: 6,
  },
  programLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK_GRAY,
    marginTop: 4,
    marginBottom: 2,
  },

  /* Bullet lists */
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bullet: {
    width: 10,
    fontSize: 9,
    color: ACCENT,
  },
  listText: {
    flex: 1,
    fontSize: 9,
  },

  /* Roadmap phases */
  phaseBlock: {
    marginBottom: 12,
  },
  phaseTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 4,
  },

  /* Improvement priorities table */
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    padding: 6,
  },
  tableHeaderText: {
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: MEDIUM_GRAY,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: MEDIUM_GRAY,
    backgroundColor: LIGHT_GRAY,
  },
  colField: { width: '20%', fontSize: 8 },
  colRec: { width: '45%', fontSize: 8 },
  colEffort: { width: '15%', fontSize: 8 },
  colImpact: { width: '20%', fontSize: 8 },

  /* Program matrix table */
  matrixHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    padding: 5,
  },
  matrixHeaderText: {
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  matrixRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: MEDIUM_GRAY,
  },
  matrixRowAlt: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: MEDIUM_GRAY,
    backgroundColor: LIGHT_GRAY,
  },
  mColProvince: { width: '16%', fontSize: 7 },
  mColStream: { width: '22%', fontSize: 7 },
  mColStatus: { width: '12%', fontSize: 7 },
  mColEligible: { width: '12%', fontSize: 7 },
  mColScore: { width: '14%', fontSize: 7 },
  mColProb: { width: '12%', fontSize: 7 },
  mColTier: { width: '12%', fontSize: 7, textTransform: 'capitalize' },

  /* Disclaimer */
  disclaimerPage: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: BLACK,
    justifyContent: 'flex-end',
  },
  disclaimerHeading: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: DARK_GRAY,
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: MEDIUM_GRAY,
  },

  /* Letterhead header image — full width, proportional height */
  letterheadHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 'auto',
    maxHeight: 70,
  },

  /* Letterhead footer image — full width, proportional height */
  letterheadFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 'auto',
    maxHeight: 45,
  },

  /* Background watermark */
  watermark: {
    position: 'absolute',
    top: '35%',
    left: '-5%',
    width: '110%',
    textAlign: 'center',
    fontSize: 72,
    fontFamily: 'Helvetica-Bold',
    color: '#e8eff5',
    opacity: 0.3,
    transform: 'rotate(-35deg)',
  },
})

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Watermark() {
  return (
    <Text style={styles.watermark} fixed>
      GenesisLink
    </Text>
  )
}

function LetterheadHeader({ src }: { src?: string }) {
  if (!src) return null
  return <Image style={styles.letterheadHeader} src={src} fixed />
}

function LetterheadFooter({ src }: { src?: string }) {
  if (!src) return null
  return <Image style={styles.letterheadFooter} src={src} fixed />
}

function Footer({ headerImage, footerImage }: { headerImage?: string; footerImage?: string }) {
  return (
    <>
      <LetterheadHeader src={headerImage} />
      <LetterheadFooter src={footerImage} />
      <View style={styles.footer} fixed>
        <Text>GenesisLink - Confidential</Text>
        <Text>Business Immigration Report</Text>
      </View>
    </>
  )
}

function ProgramAnalysisBlock({
  pa,
}: {
  pa: AIAnalysis['programAnalyses'][number]
}) {
  return (
    <View style={styles.programBlock} wrap={false}>
      <Text style={styles.programTitle}>{formatProgramName(pa.programId)}</Text>
      <Text style={styles.fitBadge}>{fitLabel(pa.strategicFit)}</Text>
      <Text style={styles.programNarrative}>{pa.narrative}</Text>

      {pa.risks.length > 0 && (
        <>
          <Text style={styles.programLabel}>Risks:</Text>
          {pa.risks.map((risk, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <Text style={styles.listText}>{risk}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.programLabel}>Timeline: {pa.timeline}</Text>
    </View>
  )
}

function ImprovementTable({
  priorities,
}: {
  priorities: AIAnalysis['improvementPriorities']
}) {
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.colField]}>Field</Text>
        <Text style={[styles.tableHeaderText, styles.colRec]}>
          Recommendation
        </Text>
        <Text style={[styles.tableHeaderText, styles.colEffort]}>Effort</Text>
        <Text style={[styles.tableHeaderText, styles.colImpact]}>Impact</Text>
      </View>
      {priorities.map((item, i) => (
        <View
          key={i}
          style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
        >
          <Text style={styles.colField}>{item.field}</Text>
          <Text style={styles.colRec}>{item.recommendation}</Text>
          <Text style={styles.colEffort}>
            {item.effort.charAt(0).toUpperCase() + item.effort.slice(1)}
          </Text>
          <Text style={styles.colImpact}>{item.impact}</Text>
        </View>
      ))}
    </View>
  )
}

function ProgramMatrix({ results }: { results: ProgramResult[] }) {
  return (
    <View>
      <View style={styles.matrixHeader}>
        <Text style={[styles.matrixHeaderText, styles.mColProvince]}>
          Province
        </Text>
        <Text style={[styles.matrixHeaderText, styles.mColStream]}>
          Stream
        </Text>
        <Text style={[styles.matrixHeaderText, styles.mColStatus]}>
          Status
        </Text>
        <Text style={[styles.matrixHeaderText, styles.mColEligible]}>
          Eligible
        </Text>
        <Text style={[styles.matrixHeaderText, styles.mColScore]}>Score</Text>
        <Text style={[styles.matrixHeaderText, styles.mColProb]}>Prob.</Text>
        <Text style={[styles.matrixHeaderText, styles.mColTier]}>Tier</Text>
      </View>
      {results.map((r, i) => {
        const score =
          r.eligibility.eligible && r.eligibility.score !== null
            ? `${r.eligibility.score}/${r.eligibility.maxScore}`
            : '\u2014'
        return (
          <View
            key={r.programId}
            style={i % 2 === 0 ? styles.matrixRow : styles.matrixRowAlt}
          >
            <Text style={styles.mColProvince}>
              {extractProvince(r.programId)}
            </Text>
            <Text style={styles.mColStream}>
              {formatProgramName(r.programId)}
            </Text>
            <Text style={styles.mColStatus}>{r.meta.status}</Text>
            <Text style={styles.mColEligible}>
              {r.eligibility.eligible ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.mColScore}>{score}</Text>
            <Text style={styles.mColProb}>{r.probability.percent}%</Text>
            <Text style={styles.mColTier}>
              {tierLabel(r.probability.tier)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const BUSINESS_PLAN_FOOTNOTE =
  '* Business Plan Score Estimate: Scores marked with an asterisk (*) include an estimated ' +
  '80% of the Business Plan / Business Concept category points. This estimate assumes the ' +
  'candidate engages GenesisLink\'s business development and advisory services for business ' +
  'plan preparation, market research, and application strategy. Actual scores are determined ' +
  'by provincial assessors and may vary.'

const DISCLAIMER_TEXT =
  'This report provides estimates only and does not constitute legal immigration advice. ' +
  'The information is based on publicly available program requirements as of the report ' +
  'generation date. Actual program requirements, scoring, and selection criteria may differ. ' +
  'Provincial Nominee Programs may change their criteria at any time without notice. The ' +
  'probability estimates are statistical approximations based on historical data and should ' +
  'not be relied upon as predictions of future outcomes. GenesisLink strongly recommends ' +
  'consulting with a licensed immigration consultant (RCIC) or lawyer for personalized ' +
  'immigration advice.'

/* ------------------------------------------------------------------ */
/*  Main Document                                                      */
/* ------------------------------------------------------------------ */

export function IntelligenceReport({
  analysis,
  results,
  generatedAt,
  headerImage,
  footerImage,
}: IntelligenceReportProps) {
  return (
    <Document
      title="GenesisLink Business Immigration Report"
      author="GenesisLink"
      subject="PNP Business Immigration Report"
    >
      {/* Page 1: Cover + Executive Summary */}
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.coverTitle}>GenesisLink Business Immigration Report</Text>
        <Text style={styles.coverSubtitle}>Generated {generatedAt}</Text>
        <View style={styles.hr} />

        <Text style={styles.sectionHeading}>Executive Summary</Text>
        <Text style={styles.bodyText}>{analysis.executiveSummary}</Text>

        <Watermark /><Footer headerImage={headerImage} footerImage={footerImage} />
      </Page>

      {/* Page 2+: Program Analyses */}
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.sectionHeading}>Program Analyses</Text>
        {analysis.programAnalyses.map((pa) => (
          <ProgramAnalysisBlock key={pa.programId} pa={pa} />
        ))}
        <Watermark /><Footer headerImage={headerImage} footerImage={footerImage} />
      </Page>

      {/* Ineligibility Insights */}
      {analysis.ineligibilityInsights && analysis.ineligibilityInsights.length > 0 && (
        <Page size="LETTER" style={styles.page} wrap>
          <Text style={styles.sectionHeading}>Why You Don&apos;t Qualify (Yet)</Text>
          {analysis.ineligibilityInsights.map((insight) => (
            <View key={insight.programId} style={styles.programBlock} wrap={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.programTitle}>{formatProgramName(insight.programId)}</Text>
                <Text style={[styles.fitBadge, { marginLeft: 8 }]}>
                  {insight.feasibility.charAt(0).toUpperCase() + insight.feasibility.slice(1)}
                </Text>
              </View>
              {insight.barriers.map((barrier, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.bullet, { color: '#cc0000' }]}>{'\u2717'}</Text>
                  <Text style={styles.listText}>{barrier}</Text>
                </View>
              ))}
              <Text style={[styles.programNarrative, { marginTop: 4, color: ACCENT }]}>
                {insight.suggestion}
              </Text>
            </View>
          ))}
          <Watermark /><Footer headerImage={headerImage} footerImage={footerImage} />
        </Page>
      )}

      {/* Strategic Roadmap */}
      {analysis.strategicRoadmap.length > 0 && (
        <Page size="LETTER" style={styles.page} wrap>
          <Text style={styles.sectionHeading}>Strategic Roadmap</Text>
          {analysis.strategicRoadmap.map((phase, i) => (
            <View key={i} style={styles.phaseBlock}>
              <Text style={styles.phaseTitle}>{phase.phase}</Text>
              {phase.actions.map((action, j) => (
                <View key={j} style={styles.listItem}>
                  <Text style={styles.bullet}>{'\u2022'}</Text>
                  <Text style={styles.listText}>{action}</Text>
                </View>
              ))}
            </View>
          ))}
          <Watermark /><Footer headerImage={headerImage} footerImage={footerImage} />
        </Page>
      )}

      {/* Improvement Priorities + Risk Factors */}
      <Page size="LETTER" style={styles.page} wrap>
        {analysis.improvementPriorities.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Improvement Priorities</Text>
            <ImprovementTable priorities={analysis.improvementPriorities} />
          </>
        )}

        {analysis.riskFactors.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Risk Factors</Text>
            {analysis.riskFactors.map((risk, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.listText}>{risk}</Text>
              </View>
            ))}
          </>
        )}
        <Watermark /><Footer headerImage={headerImage} footerImage={footerImage} />
      </Page>

      {/* Last Page: Full Program Matrix + Disclaimer */}
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.sectionHeading}>Full Program Matrix</Text>
        <ProgramMatrix results={results} />

        {/* Business Plan Estimate footnote if applicable */}
        {results.some((r) => r.eligibility.eligible && r.eligibility.includesBusinessPlanEstimate) && (
          <View style={{ marginTop: 16, padding: 8, borderWidth: 1, borderColor: '#0099cc', borderRadius: 3 }}>
            <Text style={{ fontSize: 8, lineHeight: 1.5, color: ACCENT }}>{BUSINESS_PLAN_FOOTNOTE}</Text>
          </View>
        )}

        <View style={styles.disclaimerPage}>
          <Text style={styles.disclaimerHeading}>Important Disclaimer</Text>
          <Text style={styles.disclaimerText}>{DISCLAIMER_TEXT}</Text>
        </View>
        <Watermark /><Footer headerImage={headerImage} footerImage={footerImage} />
      </Page>
    </Document>
  )
}
