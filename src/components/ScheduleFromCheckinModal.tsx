'use client'

import { useState } from 'react'
import { translateModalityName } from '@/lib/modality'

type ActivityRef = { id: string; name: string }
type Instructor = { id: string; name: string }

const DURATIONS = [
  { label: '1h',   value: 60  },
  { label: '1h30', value: 90  },
  { label: '2h',   value: 120 },
  { label: '3h',   value: 180 },
]

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
}

function nowPlus(minutes: number) {
  const d = new Date(Date.now() + minutes * 60000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "Agendar Aula" from an Aguardando Vento card that has no scheduled lesson
 *  yet — a walk-in with nothing pre-arranged gets slotted into a specific
 *  instructor/time instead of being confirmed (charged) immediately.
 *  Deliberately lightweight: no pricing/payment fields here — that
 *  decision moves to "Confirmar / Iniciar Aula" on the resulting Aulas
 *  Agendadas row once the student actually starts the lesson.
 *
 *  checkinId is optional: the Students page's "[ Agendar ]" quick action
 *  opens this same modal for a student with no checkin in play at all
 *  (just scheduling ahead from their profile row) — in that case this
 *  posts straight to /api/owner/schedule with student_name instead of
 *  going through /api/owner/schedule-from-checkin's checkin-linking step. */
export default function ScheduleFromCheckinModal({
  checkinId,
  studentName,
  activities,
  instructors,
  initialActivityId,
  initialInstructorId,
  lang = 'pt',
  onClose,
  onScheduled,
}: {
  checkinId?: string
  studentName: string
  activities: ActivityRef[]
  instructors: Instructor[]
  initialActivityId?: string | null
  initialInstructorId?: string | null
  lang?: 'en' | 'pt'
  onClose: () => void
  onScheduled: () => void
}) {
  const [activityId, setActivityId]     = useState(initialActivityId ?? '')
  const [instructorId, setInstructorId] = useState(initialInstructorId ?? '')
  const [date, setDate]                 = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime]                 = useState(() => nowPlus(15))
  const [duration, setDuration]         = useState(60)
  const [useCustom, setUseCustom]       = useState(false)
  const [custom, setCustom]             = useState('')
  const [notes, setNotes]               = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const finalDuration = useCustom ? parseInt(custom) || 0 : duration
  const canSave = !saving && !!date && !!time && finalDuration > 0

  async function submit() {
    if (!canSave) return
    setSaving(true)
    setError(null)

    const res = await fetch(checkinId ? '/api/owner/schedule-from-checkin' : '/api/owner/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(checkinId ? { checkin_id: checkinId } : { student_name: studentName }),
        activity_id:   activityId || null,
        instructor_id: instructorId || null,
        scheduled_at:  `${date}T${time}:00-03:00`,
        duration_min:  finalDuration,
        notes:         notes || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (data.ok) {
      onScheduled()
    } else {
      setError(data.error ?? 'Erro ao agendar')
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 250, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '420px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Agendar aula
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '20px' }}>
          {studentName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Atividade</label>
            <select style={selectStyle} value={activityId} onChange={e => setActivityId(e.target.value)}>
              <option value="">Selecionar atividade</option>
              {activities.map(a => <option key={a.id} value={a.id}>{translateModalityName(a.name, lang)}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Instrutor</label>
            <select style={selectStyle} value={instructorId} onChange={e => setInstructorId(e.target.value)}>
              <option value="">Selecionar instrutor</option>
              {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Data</label>
              <input
                type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ ...selectStyle, cursor: 'auto' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Horário</label>
              <input
                type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{ ...selectStyle, cursor: 'auto' }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Duração</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => { setDuration(d.value); setUseCustom(false) }}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${!useCustom && duration === d.value ? 'var(--glacial)' : 'var(--border)'}`,
                    background: !useCustom && duration === d.value ? 'var(--glacial-light)' : '#fff',
                    color: !useCustom && duration === d.value ? 'var(--glacial-dark)' : 'var(--slate)',
                    fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  {d.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${useCustom ? 'var(--glacial)' : 'var(--border)'}`,
                  background: useCustom ? 'var(--glacial-light)' : '#fff',
                  color: useCustom ? 'var(--glacial-dark)' : 'var(--slate)',
                  fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                Outro
              </button>
              {useCustom && (
                <input
                  type="number" placeholder="Minutos" value={custom}
                  onChange={e => setCustom(e.target.value)}
                  style={{
                    width: '100px', padding: '8px 12px',
                    border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
                    fontSize: '13px', color: 'var(--slate)', fontFamily: 'var(--font-sans)', outline: 'none',
                  }}
                />
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Observações</label>
            <input
              type="text" placeholder="Opcional..." value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ ...selectStyle, cursor: 'auto' }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!canSave}
            style={{
              flex: 2, padding: '11px',
              background: canSave ? 'var(--slate)' : 'var(--border)',
              color: canSave ? '#fff' : 'var(--mist)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Agendando...' : 'Agendar aula'}
          </button>
        </div>
      </div>
    </div>
  )
}
