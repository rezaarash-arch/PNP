import jsonLogic from 'json-logic-js'

export type JsonLogicRule = Record<string, unknown>

/**
 * Evaluates a JSONLogic condition against a data object.
 * Handles null safety: null values are converted to NaN so they
 * fail all comparisons (json-logic-js treats null/undefined as 0,
 * which is wrong for our use case — a null CLB should not satisfy any minimum).
 */
export function evaluateCondition(
  condition: JsonLogicRule,
  data: Record<string, unknown>
): boolean {
  // Pre-process: convert null values to NaN
  // json-logic-js treats null and undefined as 0 in comparisons
  // (null >= 0 returns true, undefined >= 0 returns true)
  // NaN fails all numeric comparisons and equality checks, which is
  // the correct behavior for missing/null assessment data
  const safeData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    safeData[key] = value === null ? NaN : value
  }

  try {
    const result = jsonLogic.apply(condition, safeData)
    return Boolean(result)
  } catch {
    // If JSONLogic evaluation fails, treat as false (safe default)
    return false
  }
}
