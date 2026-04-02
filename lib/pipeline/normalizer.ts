/**
 * Normalizes raw scraped data into a consistent format for storage and comparison.
 */

interface NormalizedRule {
  program: string
  source_url: string
  requirements: Record<string, unknown>
  last_known_update: string | null
  [key: string]: unknown
}

interface NormalizedDraw {
  program: string
  source_url: string
  draw_date: string
  invitations_issued: number | null
  min_score: number | null
  category: string | null
  [key: string]: unknown
}

/**
 * Normalize raw rules data — standardize field names and validate structure.
 * Ensures each rule record has the expected shape for downstream processing.
 */
export function normalizeRules(raw: unknown[]): NormalizedRule[] {
  return raw.map((item) => {
    const record = (item ?? {}) as Record<string, unknown>
    return {
      program: String(record.program ?? ''),
      source_url: String(record.source_url ?? ''),
      requirements:
        typeof record.requirements === 'object' && record.requirements !== null
          ? (record.requirements as Record<string, unknown>)
          : {},
      last_known_update:
        record.last_known_update != null
          ? String(record.last_known_update)
          : null,
    }
  })
}

/**
 * Normalize raw draws data — parse dates, ensure numeric scores.
 * Coerces values to the expected types so downstream code can rely on them.
 */
export function normalizeDraws(raw: unknown[]): NormalizedDraw[] {
  return raw.map((item) => {
    const record = (item ?? {}) as Record<string, unknown>

    // Parse date — accept ISO strings, fallback to empty string
    const rawDate = record.draw_date
    let drawDate = ''
    if (typeof rawDate === 'string' && rawDate.length > 0) {
      const parsed = new Date(rawDate)
      drawDate = isNaN(parsed.getTime()) ? rawDate : parsed.toISOString().split('T')[0]
    }

    return {
      program: String(record.program ?? ''),
      source_url: String(record.source_url ?? ''),
      draw_date: drawDate,
      invitations_issued: toNullableNumber(record.invitations_issued),
      min_score: toNullableNumber(record.min_score),
      category:
        record.category != null ? String(record.category) : null,
    }
  })
}

/** Convert a value to a number or null. */
function toNullableNumber(value: unknown): number | null {
  if (value == null) return null
  const num = Number(value)
  return isNaN(num) ? null : num
}
