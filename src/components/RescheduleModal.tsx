'use client'

import { useState, useEffect } from 'react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

type MissedLesson = {
  id: string
  student_name: string
  student_whatsapp?: string | null
  scheduled_at: string
  duration_min: number | null
  package_sale_id: string | null
  public_token?: string | null
  activities: { id: string; name: string } | null
}

type Instructor = { id: string; name: string }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

function fmtOldDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', timeZone: 'America/Fortaleza',
  })
}

function fmtNewDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })
}

export default function RescheduleModal({
  lesson,
  instructors,
  schoolName,
  onClose,
  onDone,
}: {
  lesson: MissedLesson
  instructors: Instructor[]
  schoolName: string
  onClose: () => void
  onDone: () => void
}) {
  const [loadingSuggestion, setLoadingSuggestion] = useState(true)
  const [noSuggestion, setNoSuggestion] = useState(false)
  const [suggestedInstructorName, setSuggestedInstructorName] = useState<string | null>(null)

  const [date, setDate]               = useState('')
  const [time, setTime]               = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const durationMin = lesson.duration_min || 60

  useEffect(() => {
    let cancelled = false
    async function loadSuggestion() {
      try {
        const params = new URLSearchParams({
          activityName: lesson.activities?.name ?? '',
          durationMin: String(durationMin),
          excludeId: lesson.id,
        })
        const res = await fetch(`/api/owner/reschedule-suggestion?${params}`)
        const data = await res.json()
        if (cancelled) return
        if (data.suggestion) {
          setDate(data.suggestion.date)
          setTime(data.suggestion.time)
          setInstructorId(data.suggestion.instructor_id)
          setSuggestedInstructorName(data.suggestion.instructor_name)
        } else {
          setNoSuggestion(true)
        }
      } catch {
        if (!cancelled) setNoSuggestion(true)
      } finally {
        if (!cancelled) setLoadingSuggestion(false)
      }
    }
    loadSuggestion()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canConfirm = date && time && instructorId && !saving

  async function confirm() {
    if (!canConfirm) return
    setSaving(true)
    setError(null)
    try {
      // Proposes a new time instead of moving the lesson immediately — the
      // original scheduled_lessons row (still its old, already-past
      // scheduled_at) is untouched until the student accepts via the
      // WhatsApp link below. See api/owner/reschedule-request and
      // api/aula/[token]'s accept_reschedule/decline_reschedule actions.
      const res = await fetch('/api/owner/reschedule-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_lesson_id:    lesson.id,
          proposed_date:          date,
          proposed_time:          time,
          proposed_instructor_id: instructorId,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error ?? 'Não foi possível enviar a proposta de reagendamento.')
        setSaving(false)
        return
      }

      const publicToken = data.public_token ?? lesson.public_token
      const instructorName = instructors.find(i => i.id === instructorId)?.name ?? suggestedInstructorName ?? ''
      const sport = lesson.activities?.name ?? 'sua aula'
      const link = publicToken ? `${window.location.origin}/aula/${publicToken}` : ''
      const message =
        `Olá ${lesson.student_name}, vimos que sua aula de ${sport} do dia ${fmtOldDate(lesson.scheduled_at)} ` +
        `não pôde ser realizada. Propomos reagendar para ${fmtNewDate(date)} às ${time} ` +
        `com o instrutor ${instructorName} na ${schoolName}. Toque aqui para aceitar a nova data ou manter o horário anterior: ${link}`

      if (lesson.student_whatsapp) {
        window.open(buildWhatsAppUrl(lesson.student_whatsapp, message), '_blank', 'noopener,noreferrer')
      }

      onDone()
    } catch {
      setError('Erro de rede. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '480px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Reagendar aula
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '18px' }}>
          {lesson.student_name} · {lesson.activities?.name ?? 'Aula pendente'}
        </div>

        {loadingSuggestion ? (
          <div style={{ fontSize: '13px', color: 'var(--mist)', padding: '12px 0' }}>
            Buscando o próximo horário disponível...
          </div>
        ) : noSuggestion ? (
          <div style={{
            fontSize: '12px', color: 'var(--mist)',
            background: 'var(--powder)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', marginBottom: '16px',
          }}>
            Nenhum horário livre encontrado automaticamente nos próximos 7 dias — selecione manualmente abaixo.
          </div>
        ) : (
          <div style={{
            fontSize: '12px', color: 'var(--slate)',
            background: 'var(--glacial-light)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', marginBottom: '16px',
          }}>
            <strong>Sugestão do sistema:</strong> {fmtNewDate(date)} às {time} com {suggestedInstructorName}.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Data</label>
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Horário</label>
            <input style={inputStyle} type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Instrutor</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={instructorId}
            onChange={e => setInstructorId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        {!lesson.student_whatsapp && (
          <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '12px' }}>
            Aluno sem WhatsApp cadastrado — o reagendamento será salvo, mas nenhuma mensagem será enviada.
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={!canConfirm}
            style={{
              flex: 2, padding: '11px',
              background: canConfirm ? 'var(--slate)' : 'var(--border)',
              color: canConfirm ? '#fff' : 'var(--mist)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Enviando...' : 'Enviar Proposta por WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}
