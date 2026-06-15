'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type MissedLesson = {
  id: string
  student_name: string
  scheduled_at: string
  duration_min: number | null
  notes: string | null
  activities: { id: string; name: string } | { id: string; name: string }[] | null
  instructor: { id: string; name: string } | { id: string; name: string }[] | null
}

function unwrap<T>(v: T | T[] | null): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export default function MissedLessons({
  lessons,
  lang,
}: {
  lessons: MissedLesson[]
  lang: 'pt' | 'en'
}) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)

  const visible = lessons.filter(l => !dismissed.has(l.id))
  if (visible.length === 0) return null

  async function dismiss(id: string) {
    setLoading(id)
    await fetch(`/api/owner/schedule?id=${id}`, { method: 'DELETE' })
    setDismissed(prev => new Set([...prev, id]))
    setLoading(null)
    router.refresh()
  }

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
          {lang === 'pt' ? 'Aulas não realizadas' : 'Missed lessons'}
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
            ? lang === 'pt'
              ? `${daysAgo} dia${daysAgo > 1 ? 's' : ''} atrás`
              : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`
            : lang === 'pt'
              ? `${hoursAgo}h atrás`
              : `${hoursAgo}h ago`

          const formattedTime = scheduledDate.toLocaleTimeString(
            lang === 'pt' ? 'pt-BR' : 'en-US',
            { hour: '2-digit', minute: '2-digit' }
          )

          const formattedDate = scheduledDate.toLocaleDateString(
            lang === 'pt' ? 'pt-BR' : 'en-US',
            { day: '2-digit', month: 'short' }
          )

          const activity   = unwrap(lesson.activities)
          const instructor = unwrap(lesson.instructor)

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
                <div style={{
                  fontSize: '13px', fontWeight: '500',
                  color: 'var(--slate)', marginBottom: '2px',
                }}>
                  {lesson.student_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  {activity?.name ?? '—'}
                  {' · '}
                  {instructor?.name ?? '—'}
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
                  {loading === lesson.id ? '...' : lang === 'pt' ? 'Descartar' : 'Dismiss'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
