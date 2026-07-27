/** School-local (Fortaleza, UTC-3, no DST) calendar date as YYYY-MM-DD —
 *  NOT new Date().toISOString().slice(0, 10), which is UTC and rolls over
 *  3 hours early relative to Brazil wall-clock time (21:00 local is already
 *  midnight UTC the next day), silently turning "today" into "tomorrow"
 *  from 9pm onward. sv-SE is a reliable way to get ISO-formatted (YYYY-MM-DD)
 *  output from toLocaleDateString with an explicit timeZone — same trick
 *  ScheduleGrid.tsx's own dateKey() and the reschedule-slot functions in
 *  scheduledLessonRepository.ts already use for -03:00 boundaries. */
export function todayBR(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' })
}

/** dateStr ± days, still as a Fortaleza-local YYYY-MM-DD. Anchored to noon
 *  before adding/subtracting days so a DST-less offset can't itself roll
 *  the date over at the boundary. */
export function addDaysBR(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00-03:00`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' })
}

/** [start, end) ISO boundaries for one Fortaleza-local calendar day, both
 *  carrying the explicit -03:00 offset — for .gte/.lt filters against a
 *  timestamptz column. A boundary with no offset gets parsed as UTC by
 *  PostgREST, which is the other half of the "flips 3h early" bug: even
 *  a correctly-computed dateStr still queries the wrong window without this. */
export function dayBoundsBR(dateStr: string): { start: string; end: string } {
  return { start: `${dateStr}T00:00:00-03:00`, end: `${dateStr}T23:59:59-03:00` }
}
