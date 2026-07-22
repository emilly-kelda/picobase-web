/** Translates a free-text activity/modality name (as typed by the school
 *  into `activities.name` — there's no fixed catalog/enum backing it) into
 *  a display label for the active portal language.
 *
 *  Same prefix-match convention already duplicated across this codebase
 *  (scheduledLessonRepository.ts's detectModality, ScheduledLessons.tsx's
 *  activityMatchesSport, sessions/page.tsx's own copy) — normalize then
 *  `.startsWith()`, not a substring check, since "Surf" is a substring of
 *  both "Kitesurf" and "Windsurf". Tolerates suffixes like "Kitesurf -
 *  Avançado".
 *
 *  Most of these (Kitesurf, Wingfoil, Kitefoil, Surf, Windsurf, Downwind)
 *  are the same word in English and Portuguese — real loanwords, not
 *  translated. Only Aluguel/Supervisão actually differ. Falls back to the
 *  original string for anything unrecognized (a school-added category with
 *  no mapping here) rather than showing a blank. */
const MODALITY_LABELS: Record<string, { en: string; pt: string }> = {
  kitesurf: { en: 'Kitesurf', pt: 'Kitesurf' },
  wingfoil: { en: 'Wingfoil', pt: 'Wingfoil' },
  kitefoil: { en: 'Kitefoil', pt: 'Kitefoil' },
  surf:     { en: 'Surf',     pt: 'Surf' },
  windsurf: { en: 'Windsurf', pt: 'Windsurf' },
  aluguel:  { en: 'Rental',   pt: 'Aluguel' },
  // 'supervis' not 'supervisao' — accented characters get stripped below,
  // not transliterated, so "Supervisão" normalizes to "supervis..." with
  // the "ã" simply gone, not turned into an "a" (same reasoning as
  // ScheduledLessons.tsx's own SPORT_FILTERS key for this one).
  supervis: { en: 'Supervision', pt: 'Supervisão' },
  downwind: { en: 'Downwind', pt: 'Downwind' },
}

export function translateModalityName(
  activityName: string | null | undefined,
  lang: 'en' | 'pt'
): string {
  if (!activityName) return activityName ?? '—'
  const normalized = activityName.toLowerCase().replace(/[^a-z]/g, '')
  const key = Object.keys(MODALITY_LABELS).find(k => normalized.startsWith(k))
  return key ? MODALITY_LABELS[key][lang] : activityName
}

/** Same prefix-match as translateModalityName above, but returns the raw
 *  grouping key ('kitesurf', 'wingfoil', ...) instead of a display label —
 *  for grouping sessions by modality (certificates, hours totals). Exported
 *  so callers reuse this instead of adding a 4th copy of the same
 *  normalize-then-startsWith heuristic already duplicated across
 *  scheduledLessonRepository.ts/ScheduledLessons.tsx/sessions/page.tsx. */
export function normalizeSportKey(activityName: string | null | undefined): string | null {
  if (!activityName) return null
  const normalized = activityName.toLowerCase().replace(/[^a-z]/g, '')
  return Object.keys(MODALITY_LABELS).find(k => normalized.startsWith(k)) ?? null
}

export type SessionForGrouping = {
  duration_min: number | null
  session_date: string
  activities: { name: string } | null
  users?: { name: string } | { name: string }[] | null
}

/** Groups a student's realized sessions (as returned by
 *  studentRepository.ts's getSessionsByStudent) by modality, summing
 *  duration and keeping the most recent session's instructor/date per
 *  group — used to compute per-sport hours totals for the certificate
 *  section on the student detail page. Sessions whose activity name
 *  doesn't match a known modality (normalizeSportKey returns null) are
 *  excluded, same fallback behavior as detectModality elsewhere. */
export function groupSessionsBySport(
  sessions: SessionForGrouping[]
): Map<string, { minutes: number; lastInstructorName: string | null; lastDate: string }> {
  const groups = new Map<string, { minutes: number; lastInstructorName: string | null; lastDate: string }>()

  // Sessions are typically already ordered most-recent-first (see
  // getSessionsByStudent's `.order('session_date', { ascending: false })`),
  // but sort defensively so "last" is correct regardless of caller order.
  const sorted = [...sessions].sort((a, b) => (a.session_date < b.session_date ? 1 : -1))

  for (const s of sorted) {
    const key = normalizeSportKey(s.activities?.name)
    if (!key) continue

    const instructor = Array.isArray(s.users) ? s.users[0] : s.users
    const existing = groups.get(key)

    if (!existing) {
      groups.set(key, {
        minutes: s.duration_min ?? 0,
        lastInstructorName: instructor?.name ?? null,
        lastDate: s.session_date,
      })
    } else {
      existing.minutes += s.duration_min ?? 0
    }
  }

  return groups
}
