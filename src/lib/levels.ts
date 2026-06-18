/** Class level progression, per (student, activity). Ascending order. */
export type Level = 'experimental' | 'iniciante' | 'intermediario' | 'avancado'

export const LEVEL_ORDER: Level[] = ['experimental', 'iniciante', 'intermediario', 'avancado']

export const LEVEL_LABELS: Record<Level, { pt: string; en: string }> = {
  experimental:   { pt: 'Experimental',  en: 'Trial' },
  iniciante:      { pt: 'Iniciante',     en: 'Beginner' },
  intermediario:  { pt: 'Intermediário', en: 'Intermediate' },
  avancado:       { pt: 'Avançado',      en: 'Advanced' },
}

export function isLevel(value: string | null | undefined): value is Level {
  return value === 'experimental' || value === 'iniciante' || value === 'intermediario' || value === 'avancado'
}

/**
 * Default level for a student in a given activity:
 * - no confirmed session in that activity         -> experimental (allowed).
 * - most recent confirmed session was experimental -> iniciante; experimental is one-shot.
 * - most recent confirmed session level is unknown/legacy (no level recorded) but a
 *   confirmed session exists -> iniciante (safest assumption — they aren't a first-timer).
 * - otherwise -> the most recent confirmed level (owner can still override forward).
 * Any confirmed session in the activity disables experimental going forward.
 */
export function resolveDefaultLevel(
  mostRecentLevel: string | null | undefined,
  hasConfirmedHistory: boolean
): { level: Level; experimentalDisabled: boolean } {
  if (!hasConfirmedHistory) return { level: 'experimental', experimentalDisabled: false }
  if (!isLevel(mostRecentLevel) || mostRecentLevel === 'experimental') {
    return { level: 'iniciante', experimentalDisabled: true }
  }
  return { level: mostRecentLevel, experimentalDisabled: true }
}
