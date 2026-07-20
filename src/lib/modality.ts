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
