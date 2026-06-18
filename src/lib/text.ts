/** Normalize a student name for cross-table matching (check-ins, sessions, scheduled_lessons
 *  store free-typed names with no shared id). Strips accents/case/whitespace differences so
 *  "José Silva" and "jose  silva" match. */
const DIACRITIC_RANGE_START = 0x0300
const DIACRITIC_RANGE_END   = 0x036f
const COMBINING_DIACRITICS  = new RegExp(
  '[' + String.fromCharCode(DIACRITIC_RANGE_START) + '-' + String.fromCharCode(DIACRITIC_RANGE_END) + ']',
  'g'
)

export function normalizeStudentName(name: string | null | undefined): string {
  return (name ?? '')
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}
