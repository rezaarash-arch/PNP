import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ProgramResult, SensitivityAnalysis } from '@/lib/types/results'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AssessmentReportProps {
  results: ProgramResult[]
  generatedAt: string
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

/** Derive a human-readable program name from the programId slug. */
function formatProgramName(programId: string): string {
  return programId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Extract province code (first segment) from a programId like "ab-graduate-entrepreneur". */
function extractProvince(programId: string): string {
  const code = programId.split('-')[0]
  return PROVINCE_LOOKUP[code] ?? code.toUpperCase()
}

/** Map tier to a user-friendly label. */
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

/** Format a percentage range as "X% - Y%". */
function formatRange(range: [number, number]): string {
  return `${range[0]}% - ${range[1]}%`
}

/** Sort sensitivity items by descending probability change, then ascending effort. */
function sortSensitivity(items: SensitivityAnalysis[]): SensitivityAnalysis[] {
  const effortRank: Record<string, number> = { low: 0, medium: 1, high: 2 }
  return [...items].sort((a, b) => {
    const pDiff = b.probabilityChange - a.probabilityChange
    if (pDiff !== 0) return pDiff
    return (effortRank[a.effort] ?? 1) - (effortRank[b.effort] ?? 1)
  })
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const NAVY = '#000000'
const CYAN = '#0099cc'
const LIGHT_GRAY = '#f4f4f4'
const MEDIUM_GRAY = '#cccccc'
const DARK_GRAY = '#555555'
const WHITE = '#ffffff'

const styles = StyleSheet.create({
  /* Page */
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: NAVY,
  },

  /* Header */
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: CYAN,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  subtitle: {
    fontSize: 11,
    color: CYAN,
    marginTop: 4,
  },
  dateText: {
    fontSize: 9,
    color: DARK_GRAY,
  },

  /* Section headings */
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: CYAN,
    paddingBottom: 4,
  },

  /* Summary table */
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
  colProgram: { width: '30%' },
  colProvince: { width: '18%' },
  colProbability: { width: '16%' },
  colTier: { width: '16%' },
  colEligible: { width: '20%' },

  /* Detail blocks */
  detailBlock: {
    marginTop: 14,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: MEDIUM_GRAY,
    borderRadius: 3,
  },
  detailTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: CYAN,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  detailLabel: {
    width: '40%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: DARK_GRAY,
  },
  detailValue: {
    width: '60%',
    fontSize: 9,
  },
  breakdownHeader: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GRAY,
    padding: 4,
    marginTop: 6,
  },
  breakdownHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: DARK_GRAY,
  },
  breakdownRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_GRAY,
  },
  breakdownCategory: { width: '25%', fontSize: 8 },
  breakdownFactor: { width: '35%', fontSize: 8 },
  breakdownPoints: { width: '20%', fontSize: 8 },
  breakdownExplanation: { width: '20%', fontSize: 8, color: DARK_GRAY },

  /* Sensitivity table */
  sensitivityHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    padding: 5,
  },
  sensitivityHeaderText: {
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  sensitivityRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: MEDIUM_GRAY,
  },
  sensitivityRowAlt: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: MEDIUM_GRAY,
    backgroundColor: LIGHT_GRAY,
  },
  senColFactor: { width: '22%', fontSize: 8 },
  senColCurrent: { width: '16%', fontSize: 8 },
  senColImproved: { width: '16%', fontSize: 8 },
  senColScoreChg: { width: '14%', fontSize: 8 },
  senColProbChg: { width: '14%', fontSize: 8 },
  senColEffort: { width: '18%', fontSize: 8 },

  /* Disqualifier / near-miss lists */
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bullet: {
    width: 10,
    fontSize: 9,
    color: CYAN,
  },
  listText: {
    flex: 1,
    fontSize: 9,
  },

  /* Disclaimer */
  disclaimerPage: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: NAVY,
    justifyContent: 'center',
  },
  disclaimerHeading: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 16,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: DARK_GRAY,
    textAlign: 'left',
  },
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
})

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Header({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>GenesisLink</Text>
          <Text style={styles.subtitle}>PNP Assessment Report</Text>
        </View>
        <Text style={styles.dateText}>Generated: {generatedAt}</Text>
      </View>
    </View>
  )
}

function Footer({ pageLabel }: { pageLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>GenesisLink - Confidential</Text>
      <Text>{pageLabel}</Text>
    </View>
  )
}

function SummaryTable({ results }: { results: ProgramResult[] }) {
  return (
    <View>
      <Text style={styles.sectionHeading}>Program Summary</Text>

      {/* Header row */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.colProgram]}>Program</Text>
        <Text style={[styles.tableHeaderText, styles.colProvince]}>Province</Text>
        <Text style={[styles.tableHeaderText, styles.colProbability]}>Probability</Text>
        <Text style={[styles.tableHeaderText, styles.colTier]}>Tier</Text>
        <Text style={[styles.tableHeaderText, styles.colEligible]}>Eligible?</Text>
      </View>

      {/* Data rows */}
      {results.map((r, i) => (
        <View key={r.programId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
          <Text style={styles.colProgram}>{formatProgramName(r.programId)}</Text>
          <Text style={styles.colProvince}>{extractProvince(r.programId)}</Text>
          <Text style={styles.colProbability}>{r.probability.percent}%</Text>
          <Text style={styles.colTier}>{tierLabel(r.probability.tier)}</Text>
          <Text style={styles.colEligible}>
            {r.eligibility.eligible ? 'Yes' : 'No'}
          </Text>
        </View>
      ))}
    </View>
  )
}

function ProgramDetail({ result }: { result: ProgramResult }) {
  const { programId, eligibility, probability } = result

  return (
    <View style={styles.detailBlock} wrap={false}>
      <Text style={styles.detailTitle}>{formatProgramName(programId)}</Text>

      {/* Key metrics */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Province</Text>
        <Text style={styles.detailValue}>{extractProvince(programId)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Eligible</Text>
        <Text style={styles.detailValue}>{eligibility.eligible ? 'Yes' : 'No'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Probability</Text>
        <Text style={styles.detailValue}>
          {probability.percent}% ({tierLabel(probability.tier)})
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Range</Text>
        <Text style={styles.detailValue}>{formatRange(probability.range)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Confidence</Text>
        <Text style={styles.detailValue}>
          {probability.confidence.charAt(0).toUpperCase() + probability.confidence.slice(1)}
        </Text>
      </View>

      {/* Score breakdown for eligible programs */}
      {eligibility.eligible && eligibility.score !== null && (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Score</Text>
            <Text style={styles.detailValue}>
              {eligibility.score} / {eligibility.maxScore}
            </Text>
          </View>

          {eligibility.breakdown.length > 0 && (
            <>
              <View style={styles.breakdownHeader}>
                <Text style={[styles.breakdownHeaderText, styles.breakdownCategory]}>
                  Category
                </Text>
                <Text style={[styles.breakdownHeaderText, styles.breakdownFactor]}>
                  Factor
                </Text>
                <Text style={[styles.breakdownHeaderText, styles.breakdownPoints]}>
                  Points
                </Text>
                <Text style={[styles.breakdownHeaderText, styles.breakdownExplanation]}>
                  Note
                </Text>
              </View>
              {eligibility.breakdown.map((b, i) => (
                <View key={i} style={styles.breakdownRow}>
                  <Text style={styles.breakdownCategory}>{b.category}</Text>
                  <Text style={styles.breakdownFactor}>{b.factor}</Text>
                  <Text style={styles.breakdownPoints}>
                    {b.points} / {b.maxPoints}
                  </Text>
                  <Text style={styles.breakdownExplanation}>{b.explanation}</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}

      {/* Disqualifiers for ineligible programs */}
      {!eligibility.eligible && eligibility.disqualifiers.length > 0 && (
        <>
          <Text style={[styles.detailLabel, { marginTop: 6, marginBottom: 3 }]}>
            Disqualifiers:
          </Text>
          {eligibility.disqualifiers.map((d, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <Text style={styles.listText}>
                {d.requirement}: {d.explanation}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Near misses */}
      {!eligibility.eligible && eligibility.nearMisses.length > 0 && (
        <>
          <Text style={[styles.detailLabel, { marginTop: 6, marginBottom: 3 }]}>
            Near Misses:
          </Text>
          {eligibility.nearMisses.map((nm, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <Text style={styles.listText}>
                {nm.requirement} (gap: {nm.gap}) - {nm.suggestion}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Explanation */}
      {probability.explanation && (
        <View style={[styles.detailRow, { marginTop: 4 }]}>
          <Text style={styles.detailLabel}>Explanation</Text>
          <Text style={styles.detailValue}>{probability.explanation}</Text>
        </View>
      )}
    </View>
  )
}

function SensitivitySection({ results }: { results: ProgramResult[] }) {
  // Collect all sensitivity items across eligible programs
  const allItems: (SensitivityAnalysis & { programId: string })[] = []
  for (const r of results) {
    if (r.eligibility.eligible && r.sensitivity.length > 0) {
      for (const s of r.sensitivity) {
        allItems.push({ ...s, programId: r.programId })
      }
    }
  }

  if (allItems.length === 0) return null

  const sorted = sortSensitivity(allItems)
  // Show top 15 improvements across all programs
  const top = sorted.slice(0, 15)

  return (
    <View>
      <Text style={styles.sectionHeading}>How to Improve Your Score</Text>

      <View style={styles.sensitivityHeader}>
        <Text style={[styles.sensitivityHeaderText, styles.senColFactor]}>Factor</Text>
        <Text style={[styles.sensitivityHeaderText, styles.senColCurrent]}>Current</Text>
        <Text style={[styles.sensitivityHeaderText, styles.senColImproved]}>Improved</Text>
        <Text style={[styles.sensitivityHeaderText, styles.senColScoreChg]}>Score +/-</Text>
        <Text style={[styles.sensitivityHeaderText, styles.senColProbChg]}>Prob +/-</Text>
        <Text style={[styles.sensitivityHeaderText, styles.senColEffort]}>Effort</Text>
      </View>

      {top.map((item, i) => (
        <View key={i} style={i % 2 === 0 ? styles.sensitivityRow : styles.sensitivityRowAlt}>
          <Text style={styles.senColFactor}>{item.factor}</Text>
          <Text style={styles.senColCurrent}>{item.currentValue}</Text>
          <Text style={styles.senColImproved}>{item.improvedValue}</Text>
          <Text style={styles.senColScoreChg}>
            {item.scoreChange > 0 ? '+' : ''}
            {item.scoreChange}
          </Text>
          <Text style={styles.senColProbChg}>
            {item.probabilityChange > 0 ? '+' : ''}
            {item.probabilityChange}%
          </Text>
          <Text style={styles.senColEffort}>
            {item.effort.charAt(0).toUpperCase() + item.effort.slice(1)}
          </Text>
        </View>
      ))}
    </View>
  )
}

const DISCLAIMER_TEXT =
  'This report provides estimates only and does not constitute legal immigration advice. ' +
  'The information is based on publicly available program requirements as of the report ' +
  'generation date. Actual program requirements, scoring, and selection criteria may differ. ' +
  'Provincial Nominee Programs may change their criteria at any time without notice. The ' +
  'probability estimates are statistical approximations based on historical data and should ' +
  'not be relied upon as predictions of future outcomes. GenesisLink strongly recommends ' +
  'consulting with a licensed immigration consultant (RCIC) or lawyer for personalized ' +
  'immigration advice.'

function DisclaimerPage() {
  return (
    <Page size="LETTER" style={styles.disclaimerPage}>
      <Text style={styles.disclaimerHeading}>Important Disclaimer</Text>
      <Text style={styles.disclaimerText}>{DISCLAIMER_TEXT}</Text>
      <Footer pageLabel="Disclaimer" />
    </Page>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Document                                                      */
/* ------------------------------------------------------------------ */

export function AssessmentReport({ results, generatedAt }: AssessmentReportProps) {
  const eligible = results.filter((r) => r.eligibility.eligible)
  const ineligible = results.filter((r) => !r.eligibility.eligible)

  return (
    <Document
      title="GenesisLink PNP Assessment Report"
      author="GenesisLink"
      subject="Provincial Nominee Program Assessment"
    >
      {/* Page 1+: Summary & Eligible Program Details */}
      <Page size="LETTER" style={styles.page} wrap>
        <Header generatedAt={generatedAt} />
        <SummaryTable results={results} />

        {/* Detailed Results - Eligible Programs */}
        {eligible.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Detailed Results - Eligible Programs</Text>
            {eligible.map((r) => (
              <ProgramDetail key={r.programId} result={r} />
            ))}
          </>
        )}

        {/* Detailed Results - Ineligible Programs */}
        {ineligible.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Detailed Results - Ineligible Programs</Text>
            {ineligible.map((r) => (
              <ProgramDetail key={r.programId} result={r} />
            ))}
          </>
        )}

        {/* Sensitivity Analysis */}
        <SensitivitySection results={results} />

        <Footer pageLabel="" />
      </Page>

      {/* Disclaimer Page */}
      <DisclaimerPage />
    </Document>
  )
}
