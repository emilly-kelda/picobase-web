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
      const scheduledAt = `${date}T${time}:00-03:00`
      const createRes = await fetch('/api/owner/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name:    lesson.student_name,
          activity_id:     lesson.activities?.id ?? null,
          instructor_id:   instructorId,
          scheduled_at:    scheduledAt,
          duration_min:    durationMin,
          // Carries the credit tracking over to the new slot — without this
          // the reschedule kept the old row's package_sale_id on a lesson
          // about to be deleted and dropped it on the new one, so the
          // rebooked lesson stopped drawing against the student's package
          // at all (a pre-existing gap, unrelated to the skip_penalty flag
          // below — that only prevents double-charging on top of it).
          package_sale_id:    lesson.package_sale_id ?? null,
          // Tells the capacity/clash checks not to count the old (not yet
          // deleted) lesson against itself — same package, same duration,
          // so it would otherwise look like this capacity is already spent.
          reschedule_from_id: lesson.id,
        }),
      })
      const createData = await createRes.json()
      if (!createData.ok) {
        setError(createData.error ?? 'Não foi possível reagendar.')
        setSaving(false)
        return
      }

      // skip_penalty: this is a reschedule, not a real cancellation — the
      // student isn't losing the lesson, just moving it (the replacement
      // above already carries the same package_sale_id forward). Regra 4's
      // penalty window would otherwise always trigger here anyway, since a
      // missed lesson's scheduled_at is by definition already in the past.
      await fetch(`/api/owner/schedule?id=${lesson.id}&skip_penalty=1`, { method: 'DELETE' })

      const instructorName = instructors.find(i => i.id === instructorId)?.name ?? suggestedInstructorName ?? ''
      const sport = lesson.activities?.name ?? 'sua aula'
      const message =
        `Olá ${lesson.student_name}, vimos que sua aula de ${sport} do dia ${fmtOldDate(lesson.scheduled_at)} ` +
        `não pôde ser realizada. Conseguimos reagendar para ${fmtNewDate(date)} às ${time} ` +
        `com o instrutor ${instructorName} na ${schoolName}. Fica bom para você?`

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
            {saving ? 'Salvando...' : 'Confirmar e Enviar WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}
