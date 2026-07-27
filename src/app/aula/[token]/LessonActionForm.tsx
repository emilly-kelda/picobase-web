'use client'

import { useState } from 'react'

type Props = {
  token: string
  studentName: string | null
  scheduledAt: string
  durationMin: number
  status: string
  studentConfirmedAt: string | null
  activityName: string | null
  instructorName: string | null
  schoolName: string
  // Owner-proposed new time (RescheduleModal, missed lessons) awaiting this
  // student's accept/decline — null when there's no active proposal.
  pendingProposal: { proposedDate: string; proposedTime: string } | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  border: '1.5px solid #E4E0D8',
  borderRadius: '14px',
  fontSize: '16px',
  color: '#1A1C22',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#8A8C98',
  marginBottom: '8px',
  display: 'block',
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'America/Fortaleza' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' })
  return `${date} às ${time}`
}

function fmtProposedDateTime(date: string, time: string) {
  return fmtDateTime(`${date}T${time}:00-03:00`)
}

export default function LessonActionForm({
  token, studentName, scheduledAt, durationMin, status, studentConfirmedAt,
  activityName, instructorName, schoolName, pendingProposal,
}: Props) {
  const [mode, setMode] = useState<'default' | 'reschedule' | 'cancel'>('default')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'reschedule' | 'cancel' | 'accept_reschedule' | null>(null)
  const [confirmedAt, setConfirmedAt] = useState(studentConfirmedAt)

  const [proposedDate, setProposedDate] = useState('')
  const [proposedTime, setProposedTime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  async function submitAction(body: Record<string, unknown>) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/aula/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Não foi possível concluir. Tente novamente.')
        return
      }
      if (body.action === 'confirm') {
        setConfirmedAt(new Date().toISOString())
        setMode('default')
      } else {
        setDone(body.action as 'reschedule' | 'cancel')
      }
    } catch {
      setError('Erro de rede. Verifique sua conexão e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const isCancelled = status === 'cancelled'

  return (
    <div style={{ minHeight: '100vh', background: '#F0EEE9', fontFamily: 'inherit' }}>
      <div style={{ background: '#1B4B5A', padding: '20px 24px 24px' }}>
        <div style={{ fontSize: '18px', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '16px' }}>
          <span style={{ fontWeight: 800, fontStyle: 'italic', color: '#E8471A' }}>Pico</span>
          <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}> Base</span>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          {schoolName}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          Sua aula
        </div>
      </div>

      <div style={{ padding: '24px', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', border: '1.5px solid #E4E0D8' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8C98', marginBottom: '6px' }}>
            {activityName ?? 'Aula'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1C22', marginBottom: '4px' }}>
            {fmtDateTime(scheduledAt)}
          </div>
          <div style={{ fontSize: '13px', color: '#8A8C98' }}>
            {studentName ? `${studentName} · ` : ''}
            {instructorName ? `com ${instructorName}` : ''}
            {durationMin ? ` · ${durationMin}min` : ''}
          </div>
        </div>

        {isCancelled ? (
          <div style={{
            padding: '16px 18px', background: '#FFF0EE', border: '1.5px solid #F4A89A',
            borderRadius: '14px', fontSize: '14px', color: '#C0392B',
          }}>
            Esta aula foi cancelada.
          </div>
        ) : done ? (
          <div style={{
            padding: '18px 20px', background: '#E0F8F5', border: '1.5px solid #7FDCD1',
            borderRadius: '14px', fontSize: '14px', color: '#00695C', textAlign: 'center',
          }}>
            ✓ {done === 'reschedule'
              ? 'Pedido de reagendamento enviado! A equipe vai confirmar em breve.'
              : done === 'cancel'
              ? 'Pedido de cancelamento enviado! A equipe vai confirmar em breve.'
              : 'Nova data confirmada! Te esperamos no novo horário.'}
          </div>
        ) : pendingProposal && mode !== 'reschedule' ? (
          // Owner proposed a new time for this lesson — resolving that
          // takes priority over the normal confirm/reschedule/cancel
          // actions below, so those don't show at the same time (avoids
          // "which button do I press" with five options at once).
          // "Manter horário anterior" didn't make sense here (the old
          // slot already passed for a missed lesson in most cases it
          // fires) — the real choice is accept the school's suggested
          // time, or counter-propose one of the student's own via the
          // same reschedule form used below, entered through
          // mode: 'reschedule' rather than a separate component.
          <div style={{ background: '#FFF8E8', border: '1.5px solid #F5D061', borderRadius: '14px', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8A5E00', marginBottom: '8px' }}>
              Nova data proposta
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#1A1C22', marginBottom: '16px' }}>
              {fmtProposedDateTime(pendingProposal.proposedDate, pendingProposal.proposedTime)}
            </div>
            {error && <ErrorBox message={error} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: error ? '12px' : '0' }}>
              <button
                onClick={() => submitAction({ action: 'accept_reschedule' })}
                disabled={submitting}
                style={{
                  padding: '16px', borderRadius: '14px', border: 'none',
                  fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
                  background: '#00A896', color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Enviando...' : `Aceitar ${fmtProposedDateTime(pendingProposal.proposedDate, pendingProposal.proposedTime)}`}
              </button>
              <button
                onClick={() => setMode('reschedule')}
                disabled={submitting}
                style={{
                  padding: '16px', borderRadius: '14px', border: '1.5px solid #E4E0D8',
                  fontSize: '15px', fontWeight: 600, fontFamily: 'inherit',
                  background: '#fff', color: '#1A1C22',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                Sugerir outro dia / horário
              </button>
            </div>
          </div>
        ) : (
          <>
            {confirmedAt && mode === 'default' && (
              <div style={{
                padding: '12px 16px', background: '#E0F8F5', border: '1.5px solid #7FDCD1',
                borderRadius: '14px', fontSize: '13px', color: '#00695C',
              }}>
                ✓ Presença confirmada
              </div>
            )}

            {mode === 'default' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {!confirmedAt && (
                  <button
                    onClick={() => submitAction({ action: 'confirm' })}
                    disabled={submitting}
                    style={{
                      padding: '16px', borderRadius: '14px', border: 'none',
                      fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
                      background: '#00A896', color: '#fff',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? 'Enviando...' : 'Confirmar Presença'}
                  </button>
                )}
                <button
                  onClick={() => setMode('reschedule')}
                  style={{
                    padding: '16px', borderRadius: '14px', border: '1.5px solid #E4E0D8',
                    fontSize: '15px', fontWeight: 600, fontFamily: 'inherit',
                    background: '#fff', color: '#1A1C22', cursor: 'pointer',
                  }}
                >
                  Solicitar Reagendamento
                </button>
                <button
                  onClick={() => setMode('cancel')}
                  style={{
                    padding: '16px', borderRadius: '14px', border: '1.5px solid #E4E0D8',
                    fontSize: '15px', fontWeight: 600, fontFamily: 'inherit',
                    background: '#fff', color: '#C0392B', cursor: 'pointer',
                  }}
                >
                  Solicitar Cancelamento
                </button>
              </div>
            )}

            {mode === 'reschedule' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Nova data</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={proposedDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setProposedDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Novo horário</label>
                  <input
                    style={inputStyle}
                    type="time"
                    value={proposedTime}
                    onChange={e => setProposedTime(e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Motivo (opcional)</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', lineHeight: 1.5 }}
                    value={rescheduleReason}
                    onChange={e => setRescheduleReason(e.target.value)}
                    placeholder="Conte pra gente o motivo, se quiser"
                  />
                </div>
                {error && <ErrorBox message={error} />}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setMode('default'); setError(null) }}
                    style={{
                      flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid #E4E0D8',
                      fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
                      background: '#fff', color: '#8A8C98', cursor: 'pointer',
                    }}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => submitAction({
                      action: 'reschedule',
                      proposed_date: proposedDate,
                      proposed_time: proposedTime,
                      reason: rescheduleReason || null,
                    })}
                    disabled={submitting || !proposedDate || !proposedTime}
                    style={{
                      flex: 2, padding: '14px', borderRadius: '14px', border: 'none',
                      fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
                      background: (submitting || !proposedDate || !proposedTime) ? '#E4E0D8' : '#00A896',
                      color: (submitting || !proposedDate || !proposedTime) ? '#8A8C98' : '#fff',
                      cursor: (submitting || !proposedDate || !proposedTime) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Enviando...' : 'Enviar Pedido'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'cancel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Motivo do cancelamento</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', lineHeight: 1.5 }}
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Conte pra gente o motivo"
                  />
                </div>
                {error && <ErrorBox message={error} />}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setMode('default'); setError(null) }}
                    style={{
                      flex: 1, padding: '14px', borderRadius: '14px', border: '1.5px solid #E4E0D8',
                      fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
                      background: '#fff', color: '#8A8C98', cursor: 'pointer',
                    }}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => submitAction({ action: 'cancel', reason: cancelReason || null })}
                    disabled={submitting}
                    style={{
                      flex: 2, padding: '14px', borderRadius: '14px', border: 'none',
                      fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
                      background: submitting ? '#E4E0D8' : '#C0392B',
                      color: submitting ? '#8A8C98' : '#fff',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Enviando...' : 'Confirmar Cancelamento'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px', background: '#FFF0EE', border: '0.5px solid #F4A89A',
      borderRadius: '12px', fontSize: '13px', color: '#C0392B',
    }}>
      {message}
    </div>
  )
}
