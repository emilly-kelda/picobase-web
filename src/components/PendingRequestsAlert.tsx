'use client'

import { useEffect, useRef, useState } from 'react'

type LessonRequest = {
  id: string
  type: 'reschedule' | 'cancellation'
  requested_data: { proposed_date?: string; proposed_time?: string; reason?: string | null } | null
  created_at: string
  scheduled_lesson_id: string
  scheduled_lessons: {
    student_name: string | null
    scheduled_at: string
    duration_min: number | null
    activities: { name: string } | null
    instructor: { name: string } | null
  } | null
}

const POLL_MS = 30000
const SNOOZE_MS = 180000
const SNOOZE_KEY = 'pb_lesson_requests_snooze'

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Fortaleza',
  })
}

/** Global, recurring red-alert modal for pending student reschedule/
 *  cancellation requests — mounted once in owner/layout.tsx so it surfaces
 *  on every /owner/* route, not just the dashboard. Polls (client fetch,
 *  not router.refresh — a layout-level component can't reload the whole
 *  route on every tick) every 30s; if the operator dismisses without
 *  resolving, a sessionStorage snooze timestamp holds it down for 3 minutes,
 *  short enough relative to the 30s poll interval that it reliably pops
 *  back up within ~30s of the snooze expiring. */
export default function PendingRequestsAlert() {
  const [requests, setRequests] = useState<LessonRequest[]>([])
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function poll() {
    try {
      const res = await fetch('/api/owner/lesson-requests')
      const data = await res.json()
      const list: LessonRequest[] = data.requests ?? []
      setRequests(list)
      const snoozedUntil = Number(sessionStorage.getItem(SNOOZE_KEY) ?? 0)
      if (list.length > 0 && Date.now() > snoozedUntil) {
        setOpen(true)
      }
    } catch {
      // Silent — the next tick just retries.
    }
  }

  useEffect(() => {
    poll()
    pollRef.current = setInterval(poll, POLL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    setOpen(false)
    sessionStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
  }

  async function resolve(id: string, action: 'approve' | 'reject') {
    setBusyId(id)
    setRowErrors(prev => { const next = { ...prev }; delete next[id]; return next })
    try {
      const res = await fetch(`/api/owner/lesson-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRowErrors(prev => ({ ...prev, [id]: data.error ?? 'Não foi possível concluir.' }))
        return
      }
      const next = requests.filter(r => r.id !== id)
      setRequests(next)
      if (next.length === 0) {
        setOpen(false)
        sessionStorage.removeItem(SNOOZE_KEY)
      }
    } catch {
      setRowErrors(prev => ({ ...prev, [id]: 'Erro de rede. Tente novamente.' }))
    } finally {
      setBusyId(null)
    }
  }

  if (!open || requests.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: '24px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '480px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '20px' }}>🔴</span>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--signal)' }}>
            Pedidos de alunos pendentes
          </div>
          <span style={{
            background: 'var(--signal)', color: '#fff', fontSize: '11px', fontWeight: '600',
            padding: '2px 8px', borderRadius: 'var(--radius-full)', marginLeft: 'auto',
          }}>
            {requests.length}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '18px' }}>
          Aprove ou recuse cada pedido. Este alerta reaparece a cada 3 minutos até ser resolvido.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {requests.map(r => {
            const lesson = r.scheduled_lessons
            const rd = r.requested_data
            return (
              <div key={r.id} style={{
                background: '#fff', border: '0.5px solid var(--signal-light)',
                borderLeft: '3px solid var(--signal)', borderRadius: 'var(--radius-md)',
                padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)' }}>
                    {lesson?.student_name ?? 'Aluno'}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: '600', color: 'var(--signal)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {r.type === 'reschedule' ? 'Reagendamento' : 'Cancelamento'}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  {lesson?.activities?.name ?? '—'} · {lesson?.instructor?.name ?? '—'}
                  {lesson?.scheduled_at ? ` · Atual: ${fmtDateTime(lesson.scheduled_at)}` : ''}
                </div>

                {r.type === 'reschedule' && rd?.proposed_date && rd?.proposed_time && (
                  <div style={{ fontSize: '12px', color: 'var(--slate)' }}>
                    Novo horário proposto: <strong>{rd.proposed_date.split('-').reverse().join('/')} às {rd.proposed_time}</strong>
                  </div>
                )}
                {rd?.reason && (
                  <div style={{ fontSize: '12px', color: 'var(--mist)', fontStyle: 'italic' }}>
                    &quot;{rd.reason}&quot;
                  </div>
                )}

                {rowErrors[r.id] && (
                  <div style={{ fontSize: '11px', color: 'var(--signal)' }}>
                    {rowErrors[r.id]}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <button
                    onClick={() => resolve(r.id, 'approve')}
                    disabled={busyId === r.id}
                    style={{
                      flex: 1, padding: '7px 10px', background: 'var(--slate)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-md)', fontSize: '11px', fontWeight: '600',
                      cursor: busyId === r.id ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
                      opacity: busyId === r.id ? 0.6 : 1,
                    }}
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => resolve(r.id, 'reject')}
                    disabled={busyId === r.id}
                    style={{
                      flex: 1, padding: '7px 10px', background: 'var(--signal-light)', color: 'var(--signal-dark)',
                      border: '0.5px solid var(--signal)', borderRadius: 'var(--radius-md)', fontSize: '11px', fontWeight: '600',
                      cursor: busyId === r.id ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
                      opacity: busyId === r.id ? 0.6 : 1,
                    }}
                  >
                    Recusar
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={dismiss}
          style={{
            width: '100%', marginTop: '18px', padding: '10px',
            background: '#fff', color: 'var(--mist)',
            border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          Lembrar em 3 minutos
        </button>
      </div>
    </div>
  )
}
