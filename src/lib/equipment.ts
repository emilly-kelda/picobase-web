/** Rough kite-size guide (rider weight x wind speed) — a generic simplified
 *  heuristic used across kite schools (not any single brand's proprietary
 *  chart, which this app has no license to reproduce). Meant as a starting
 *  point for the operator in the Ficha modal, who still decides and records
 *  the actual gear handed out in equipment_notes — this never overrides
 *  that free-text field, only suggests what to start from. */

const WEIGHT_BANDS = [50, 60, 70, 80, 90] as const
const WIND_BANDS = [13, 17, 21, 26, 31] as const

// Rows = wind bands (ascending), columns = weight bands (ascending).
// Each cell is a [minM, maxM] kite size range.
const KITE_SIZE_MATRIX: [number, number][][] = [
  // < 13kn
  [[14, 17], [16, 19], [17, 21], [19, 23], [21, 25]],
  // 13-17kn
  [[10, 13], [12, 15], [13, 17], [15, 19], [16, 21]],
  // 17-21kn
  [[8, 10], [9, 12], [10, 14], [12, 15], [13, 17]],
  // 21-26kn
  [[6, 8], [7, 10], [8, 11], [9, 13], [10, 14]],
  // 26-31kn
  [[5, 7], [6, 8], [6, 9], [7, 10], [8, 11]],
  // 31kn+
  [[4, 6], [5, 7], [5, 8], [6, 9], [7, 10]],
]

function bandIndex(value: number, thresholds: readonly number[]): number {
  let i = 0
  while (i < thresholds.length && value >= thresholds[i]) i++
  return i
}

export function suggestKiteSizeM(weightKg: number, windKn: number): { min: number; max: number } | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(windKn) || weightKg <= 0 || windKn < 0) return null
  const windRow = bandIndex(windKn, WIND_BANDS)
  const weightCol = bandIndex(weightKg, WEIGHT_BANDS)
  const [min, max] = KITE_SIZE_MATRIX[windRow][weightCol]
  return { min, max }
}
