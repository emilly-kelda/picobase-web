'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RescheduleModal from '@/components/RescheduleModal'

type MissedLesson = {
  id: string
  student_name: string
  student_whatsapp?: string | null
  scheduled_at: string
  duration_min: number | null
  activities: { id: string; name: string } | null
  instructor: { name: string } | null
}

export default function MissedLessons({
  lessons,
  instructors = [],
  schoolName = 'Pico Base',
}: {
  lessons: MissedLesson[]
  instructors?: Array<{ id: string; name: string }>
  schoolName?: string
}) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState<MissedLesson | null>(null)

  const visible = lessons.filter(l => !dismissed.has(l.id))

  async function dismiss(id: string) {
    setLoading(id)
    await fetch(`/api/owner/schedule?id=${id}`, { method: 'DELETE' })
    setDismissed(prev => new Set([...prev, id]))
    setLoading(null)
    router.refresh()
  }

  function onRescheduleDone() {
    if (rescheduling) setDismissed(prev => new Set([...prev, rescheduling.id]))
    setRescheduling(null)
    router.refresh()
  }

  if (visible.length === 0) return null

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '10px',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--signal)',
        }}>
          Aulas não realizadas
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
        {visible.map(lesson => {
          const scheduledDate = new Date(lesson.scheduled_at)
          const hoursAgo = Math.round(
            (Date.now() - scheduledDate.getTime()) / (1000 * 60 * 60)
          )
          const daysAgo = Math.floor(hoursAgo / 24)

          const timeAgo = daysAgo > 0
            ? `${daysAgo} dia${daysAgo > 1 ? 's' : ''} atrás`
            : `${hoursAgo}h atrás`

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
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: '2px' }}>
                  <Link
                    href={`/owner/students/name/${encodeURIComponent(lesson.student_name)}`}
                    style={{
                      fontSize: '13px', fontWeight: '500',
                      color: 'var(--slate)', textDecoration: 'none',
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderBottomColor = 'var(--glacial)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent' }}
                  >
                    {lesson.student_name}
                  </Link>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  {lesson.activities?.name ?? '—'}
                  {' · '}
                  {lesson.instructor?.name ?? '—'}
                  {' · '}
                  {formattedDate} {formattedTime}
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: '11px', color: 'var(--signal)',
                  fontWeight: '500',
                }}>
                  {timeAgo}
                </span>

                <button
                  onClick={() => setRescheduling(lesson)}
                  style={{
                    padding: '5px 12px',
                    background: 'var(--glacial-light)',
                    color: 'var(--glacial-dark)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '11px', fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--glacial)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--glacial-light)' }}
                >
                  Reagendar
                </button>

                <button
                  onClick={() => dismiss(lesson.id)}
                  disabled={loading === lesson.id}
                  style={{
                    padding: '5px 12px',
                    background: 'var(--signal-light)',
                    color: 'var(--signal-dark)',
                    border: '0.5px solid var(--signal)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '11px', fontWeight: '500',
                    cursor: loading === lesson.id ? 'not-allowed' : 'pointer',
                    opacity: loading === lesson.id ? 0.6 : 1,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {loading === lesson.id ? '...' : 'Descartar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {rescheduling && (
        <RescheduleModal
          lesson={rescheduling}
          instructors={instructors}
          schoolName={schoolName}
          onClose={() => setRescheduling(null)}
          onDone={onRescheduleDone}
        />
      )}
    </div>
  )
}
