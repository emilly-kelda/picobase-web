import { LEVEL_LABELS, isLevel } from '@/lib/levels'

export type GridLesson = {
  id: string
  student_name: string
  scheduled_at: string
  duration_min: number | null
  level: string | null
  instructor: { id: string; name: string } | null
  activityName: string | null
}

type Instructor = { id: string; name: string }

const UNASSIGNED_COL = '__unassigned__'

function dateKey(iso: string) {
  // Fortaleza-local calendar date, not the UTC one scheduled_at's own
  // ISO string would give via a plain .slice(0, 10) — a lesson stored as
  // 02:00 UTC is already the previous evening in Fortaleza (-03:00).
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' })
}

function timeKey(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza',
  })
}

function fmtDateHeading(key: string) {
  return new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

/** Matrix view (horário × instrutor) for one or more days of scheduled
 *  lessons — inspired by Viking Bookings' layout, replacing the flat table
 *  Agendadas used to show. `lessons` can span multiple dates (this page's
 *  own month filter); grouped into one grid per date here rather than
 *  requiring the caller to pre-split, so the existing month/instructor
 *  filters upstream don't need to change shape.
 *
 *  Columns are every active instructor passed in (not just ones with a
 *  lesson that day) — an empty column is itself useful info: that
 *  instructor is free. Lessons with no instructor assigned get a dedicated
 *  "Aguardando Instrutor" column instead of silently vanishing from the
 *  grid, and only appears on a given day if that day actually has one. */
export default function ScheduleGrid({
  lessons,
  instructors,
  lang = 'pt',
}: {
  lessons: GridLesson[]
  instructors: Instructor[]
  lang?: 'en' | 'pt'
}) {
  if (lessons.length === 0) {
    return (
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '48px 20px',
        textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
      }}>
        Nenhuma aula agendada neste período.
      </div>
    )
  }

  const byDate = new Map<string, GridLesson[]>()
  for (const lesson of lessons) {
    const key = dateKey(lesson.scheduled_at)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(lesson)
  }
  const dateKeys = [...byDate.keys()].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {dateKeys.map(dKey => (
        <DayGrid key={dKey} dateKey={dKey} lessons={byDate.get(dKey)!} instructors={instructors} lang={lang} />
      ))}
    </div>
  )
}

function DayGrid({
  dateKey: dKey, lessons, instructors, lang,
}: {
  dateKey: string
  lessons: GridLesson[]
  instructors: Instructor[]
  lang: 'en' | 'pt'
}) {
  const hasUnassigned = lessons.some(l => !l.instructor)
  const columns: Array<{ key: string; name: string }> = [
    ...instructors.map(i => ({ key: i.id, name: i.name })),
    ...(hasUnassigned ? [{ key: UNASSIGNED_COL, name: 'Aguardando Instrutor' }] : []),
  ]

  const timeKeys = [...new Set(lessons.map(l => timeKey(l.scheduled_at)))].sort()

  const cellLessons = (time: string, colKey: string) =>
    lessons.filter(l =>
      timeKey(l.scheduled_at) === time
      && (l.instructor?.id ?? UNASSIGNED_COL) === colKey
    )

  return (
    <div style={{
      background: '#fff', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
        fontSize: '13px', fontWeight: '600', color: 'var(--slate)',
        textTransform: 'capitalize', background: 'var(--powder)',
      }}>
        {fmtDateHeading(dKey)}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `88px repeat(${columns.length}, minmax(160px, 1fr))`,
          minWidth: `${88 + columns.length * 160}px`,
        }}>
          {/* Column headers */}
          <div style={{
            padding: '10px 12px', fontSize: '10px', fontWeight: '600',
            letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mist)',
            borderBottom: '0.5px solid var(--border)', position: 'sticky', left: 0,
            background: '#fff',
          }} />
          {columns.map(col => (
            <div key={col.key} style={{
              padding: '10px 12px', fontSize: '11px', fontWeight: '600',
              color: col.key === UNASSIGNED_COL ? 'var(--amber)' : 'var(--slate)',
              borderBottom: '0.5px solid var(--border)',
              borderLeft: '0.5px solid var(--border)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {col.name}
            </div>
          ))}

          {/* Rows */}
          {timeKeys.map(time => (
            <FragmentRow
              key={time}
              time={time}
              columns={columns}
              cellLessons={cellLessons}
              lang={lang}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FragmentRow({
  time, columns, cellLessons, lang,
}: {
  time: string
  columns: Array<{ key: string; name: string }>
  cellLessons: (time: string, colKey: string) => GridLesson[]
  lang: 'en' | 'pt'
}) {
  return (
    <>
      <div style={{
        padding: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--slate)',
        borderBottom: '0.5px solid var(--border)', position: 'sticky', left: 0,
        background: '#fff', fontVariantNumeric: 'tabular-nums',
      }}>
        {time}
      </div>
      {columns.map(col => {
        const cell = cellLessons(time, col.key)
        return (
          <div key={col.key} style={{
            padding: '8px', borderBottom: '0.5px solid var(--border)',
            borderLeft: '0.5px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            {cell.map(lesson => (
              <div key={lesson.id} style={{
                background: col.key === UNASSIGNED_COL ? 'var(--amber-light)' : 'var(--powder)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: '600', color: 'var(--slate)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {lesson.student_name}
                </div>
                <div style={{
                  fontSize: '11px', color: 'var(--mist)', marginTop: '2px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {lesson.activityName ?? '—'}
                  {lesson.duration_min ? ` · ${lesson.duration_min}min` : ''}
                </div>
                {isLevel(lesson.level) && (
                  <div style={{
                    display: 'inline-block', marginTop: '4px',
                    padding: '1px 7px', borderRadius: 'var(--radius-full)',
                    fontSize: '10px', fontWeight: '500',
                    background: '#fff', color: 'var(--glacial-dark)',
                    border: '0.5px solid var(--border)',
                  }}>
                    {LEVEL_LABELS[lesson.level][lang]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}
