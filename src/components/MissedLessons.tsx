'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RescheduleModal from '@/components/RescheduleModal'
import { Toast, useToast } from '@/components/Toast'

type MissedLesson = {
  id: string
  student_name: string
  student_whatsapp?: string | null
  scheduled_at: string
  duration_min: number | null
  package_sale_id: string | null
  activities: { id: string; name: string } | null
  instructor: { name: string } | null
}

export default function MissedLessons({
  lessons,
  instructors = [],
  schoolName = 'Pico Base',
  t,
}: {
  lessons: MissedLesson[]
  instructors?: Array<{ id: string; name: string }>
  schoolName?: string
  t: Record<string, string>
}) {
  const router = useRouter()
  const { toast, showToast } = useToast()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState<MissedLesson | null>(null)
  const [expanded, setExpanded] = useState(false)

  const visible = lessons.filter(l => !dismissed.has(l.id))
  const COLLAPSED_COUNT = 3
  // Always split the same way regardless of expanded — the extra items
  // beyond COLLAPSED_COUNT stay mounted and just get height-clipped when
  // collapsed (see the grid-template-rows 0fr/1fr wrapper below), so
  // toggling animates smoothly instead of the list abruptly gaining/
  // losing DOM nodes.
  const alwaysShown = visible.slice(0, COLLAPSED_COUNT)
  const collapsible = visible.slice(COLLAPSED_COUNT)
  const hiddenCount = collapsible.length

  async function dismiss(id: string) {
    setLoading(id)
    // A missed lesson is by definition already past scheduled_at, so
    // Regra 4's penalty window always applies here — if it's tied to a
    // package, dismissing it forfeits the credit as a no-show (matches
    // real policy: a lesson nobody showed up for isn't a free cancellation).
    const res = await fetch(`/api/owner/schedule?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setDismissed(prev => new Set([...prev, id]))
    setLoading(null)
    if (data.penalized && data.message) {
      showToast('err', data.message)
    }
    router.refresh()
  }

  function onRescheduleDone() {
    if (rescheduling) setDismissed(prev => new Set([...prev, rescheduling.id]))
    setRescheduling(null)
    router.refresh()
  }

  function renderLesson(lesson: MissedLesson) {
    const scheduledDate = new Date(lesson.scheduled_at)
    const hoursAgo = Math.round(
      (Date.now() - scheduledDate.getTime()) / (1000 * 60 * 60)
    )
    const daysAgo = Math.floor(hoursAgo / 24)

    const timeAgo = daysAgo > 0
      ? `${daysAgo} ${daysAgo > 1 ? t.days_ago_plural : t.day_ago_singular}`
      : `${hoursAgo}${t.hours_ago_suffix}`

    const formattedTime = scheduledDate.toLocaleTimeString(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' }
    )

    const formattedDate = scheduledDate.toLocaleDateString(
      'pt-BR',
      { day: '2-digit', month: 'short', timeZone: 'America/Fortaleza' }
    )

    return (
      <div
        key={lesson.id}
        style={{
          background: '#fff',
          border: '0.5px solid var(--signal-light)',
          borderLeft: '3px solid var(--signal)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
          <Link
            href={`/owner/students/name/${encodeURIComponent(lesson.student_name)}`}
            style={{
              fontSize: '12px', fontWeight: '500',
              color: 'var(--slate)', textDecoration: 'none',
              borderBottom: '1px solid transparent',
              transition: 'border-color 0.15s',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderBottomColor = 'var(--glacial)' }}
            onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent' }}
          >
            {lesson.student_name}
          </Link>
          <span style={{
            fontSize: '10px', color: 'var(--signal)',
            fontWeight: '500', flexShrink: 0,
          }}>
            {timeAgo}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--mist)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lesson.activities?.name ?? '—'}
          {' · '}
          {lesson.instructor?.name ?? '—'}
          {' · '}
          {formattedDate} {formattedTime}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
          <button
            onClick={() => setRescheduling(lesson)}
            style={{
              flex: 1, padding: '4px 8px',
              background: 'var(--glacial-light)',
              color: 'var(--glacial-dark)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '10px', fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'background-color 0.15s',
            }}
            // Hover inverts to solid --glacial with white text, not just a
            // background swap — with the muted-palette repaint, --glacial
            // is now a dark slate (not a mid-tone teal), so leaving the
            // dark --glacial-dark text unchanged on hover would put
            // near-black text on a near-black background.
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--glacial)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--glacial-light)'; e.currentTarget.style.color = 'var(--glacial-dark)' }}
          >
            {t.reschedule_btn}
          </button>

          <button
            onClick={() => dismiss(lesson.id)}
            disabled={loading === lesson.id}
            style={{
              flex: 1, padding: '4px 8px',
              background: 'var(--signal-light)',
              color: 'var(--signal-dark)',
              border: '0.5px solid var(--signal)',
              borderRadius: 'var(--radius-md)',
              fontSize: '10px', fontWeight: '500',
              cursor: loading === lesson.id ? 'not-allowed' : 'pointer',
              opacity: loading === lesson.id ? 0.6 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {loading === lesson.id ? '...' : t.dismiss_btn}
          </button>
        </div>
      </div>
    )
  }

  // Rendered even when the list empties out (e.g. right after dismissing
  // the last one) so the penalty toast triggered by that dismiss isn't cut
  // off by this component unmounting to null mid-display.
  if (visible.length === 0) return <Toast toast={toast} />

  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
      padding: '14px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '10px',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--signal)',
        }}>
          {t.missed_lessons_title}
        </div>
        <span style={{
          background: 'var(--signal)',
          color: '#fff',
          fontSize: '10px', fontWeight: '600',
          padding: '2px 7px',
          borderRadius: 'var(--radius-full)',
        }}>
          {visible.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {alwaysShown.map(renderLesson)}
      </div>

      {/* The extra items beyond COLLAPSED_COUNT stay mounted at all times —
          this grid-template-rows 0fr/1fr wrapper animates their combined
          height smoothly on toggle without needing a hardcoded/measured
          pixel height (a plain max-height transition would either clip
          content or require guessing a per-row height). */}
      {hiddenCount > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s ease-in-out',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px' }}>
              {collapsible.map(renderLesson)}
            </div>
          </div>
        </div>
      )}

      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%', marginTop: '8px', padding: '6px',
            background: 'transparent', color: 'var(--signal)',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '11px', fontWeight: '500',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          {expanded ? (
            <>▲ Minimizar</>
          ) : (
            <>Ver todas ({visible.length}) ▼</>
          )}
        </button>
      )}

      {rescheduling && (
        <RescheduleModal
          lesson={rescheduling}
          instructors={instructors}
          schoolName={schoolName}
          onClose={() => setRescheduling(null)}
          onDone={onRescheduleDone}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}
