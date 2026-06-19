export type CommissionMode = 'percentage' | 'fixed_per_hour'

/** Server-side commission calc, shared by every "confirm session" route.
 *  Always re-derives from the instructor's current saved rate rather than
 *  trusting a client-supplied commission_pct, so a stale/tampered client
 *  value can't override what the owner actually configured. */
export function computeCommissionAmount(
  instructor: {
    commission_mode?: string | null
    commission_pct: number | null
    fixed_per_hour?: number | null
  },
  price: number,
  durationMin: number
): number {
  if (instructor.commission_mode === 'fixed_per_hour') {
    return (instructor.fixed_per_hour ?? 0) * (durationMin / 60)
  }
  return price * (instructor.commission_pct ?? 0)
}
