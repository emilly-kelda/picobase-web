'use client'

import { useState } from 'react'

type Activity = {
  id: string
  name: string
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  color: 'var(--slate)',
  background: '#fff',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--mist)',
  display: 'block',
  marginBottom: '6px',
}

export default function AddBookingModal({
  schoolSlug,
  activities,
  onClose,
  onCreated,
}: {
  schoolSlug: string
  activities: Activity[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    student_name:   '',
    whatsapp:       '',
    activity_id:    '',
    preferred_date: '',
    preferred_time: '',
    notes:          '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Same field set and /api/book contract as the public booking form
  // (src/app/book/[school]/BookingForm.tsx) — this just gives the owner a
  // way to log a booking taken by phone/in person without leaving Base Camp.
  const canSave = form.student_name.trim().length >= 2
    && form.whatsapp.replace(/\D/g, '').length >= 8
    && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_slug:    schoolSlug,
          student_name:   form.student_name,
          whatsapp:       form.whatsapp,
          activity_id:    form.activity_id || null,
          preferred_date: form.preferred_date || null,
          preferred_time: form.preferred_time || null,
          notes:          form.notes || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        onCreated()
      } else {
        setError(data.error ?? 'Não foi possível registrar a reserva.')
        setSaving(false)
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '440px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          fontSize: '18px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '20px',
        }}>
          Nova reserva
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nome completo *</label>
            <input
              style={inputStyle}
              type="text"
              value={form.student_name}
              onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
              placeholder="Nome do aluno"
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>WhatsApp *</label>
            <input
              style={inputStyle}
              type="tel"
              value={form.whatsapp}
              onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
              placeholder="+55 85 99999-9999"
            />
          </div>

          {activities.length > 0 && (
            <div>
              <label style={labelStyle}>Atividade</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.activity_id}
                onChange={e => setForm(f => ({ ...f, activity_id: e.target.value }))}
              >
                <option value="">Selecionar</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Data preferida</label>
              <input
                style={inputStyle}
                type="date"
                value={form.preferred_date}
                onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Horário</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.preferred_time}
                onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))}
              >
                <option value="">Selecionar</option>
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Observações</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Opcional..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
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
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            style={{
              flex: 2, padding: '11px',
              background: canSave ? 'var(--slate)' : 'var(--border)',
              color: canSave ? '#fff' : 'var(--mist)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Salvando...' : 'Adicionar reserva'}
          </button>
        </div>
      </div>
    </div>
  )
}
