export const MIN_COLUMN_FR = 0.12

/**
 * @param {unknown} raw - JSON array from DB or null
 * @param {number} columnCount
 * @returns {number[]} positive fractions summing to columnCount (average 1)
 */
export function normalizeColumnFractions(raw, columnCount) {
  const n = Math.max(1, columnCount ?? 1)
  if (!Array.isArray(raw) || raw.length !== n) {
    return Array.from({ length: n }, () => 1)
  }
  const clamped = raw.map((x) => Math.max(MIN_COLUMN_FR, Number(x) || MIN_COLUMN_FR))
  const sum = clamped.reduce((a, b) => a + b, 0)
  if (sum <= 0) return Array.from({ length: n }, () => 1)
  return clamped.map((x) => (x / sum) * n)
}

/** CSS grid-template-columns value for editor / reader */
export function gridTemplateColumnsFromFractions(fractions) {
  return fractions.map((f) => `minmax(0, ${f}fr)`).join(' ')
}
