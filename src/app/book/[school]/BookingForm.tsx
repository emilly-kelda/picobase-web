'use client'

import { useState } from 'react'

type School = {
  id: string
  name: string
  slug: string
}

type Activity = {
  id: string
  name: string
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 18px',
  border: '1.5px solid #E4E0D8',
  borderRadius: '14px',
  fontSize: '17px',
  color: '#1A1C22',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
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

function whatsappHref(rawPhone: string, text?: string) {
  const digits = rawPhone.replace(/\D/g, '')
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${query}`
}

export default function BookingForm({
  school,
  activities,
  ownerWhatsapp,
}: {
  school: School
  activities: Activity[]
  ownerWhatsapp: string | null
}) {
  const [form, setForm] = useState({
    student_name:   '',
    whatsapp:       '',
    activity_id:    '',
    preferred_date: '',
    preferred_time: '',
    notes:          '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const canSubmit = form.student_name.trim().length >= 2
    && form.whatsapp.replace(/\D/g, '').length >= 8
    && !submitting

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_slug:    school.slug,
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
        setDone(true)
      } else {
        setError(data.error ?? 'Não foi possível enviar seu pedido. Tente novamente.')
      }
    } catch {
      setError('Erro de rede. Verifique sua conexão e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F0EEE9',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', fontFamily: 'inherit', textAlign: 'center',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#E0F8F5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', marginBottom: '20px', color: '#00A896',
        }}>
          ✓
        </div>

        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A1C22', marginBottom: '6px' }}>
          Pedido enviado!
        </div>
        <div style={{ fontSize: '15px', color: '#8A8C98', marginBottom: '8px' }}>
          Entraremos em contato pelo WhatsApp em breve.
        </div>
        <div style={{ fontSize: '13px', color: '#B8B4AA', marginBottom: '32px' }}>
          {school.name}
        </div>

        {ownerWhatsapp && (
          <a
            href={whatsappHref(ownerWhatsapp, `Olá! Acabei de solicitar uma aula em ${school.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '14px 24px', borderRadius: '14px',
              background: '#00A896', color: '#fff',
              fontSize: '15px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            💬 Falar com {school.name} agora
          </a>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '32px', fontSize: '11px', color: '#B8B4AA' }}>
          <div style={{ marginBottom: '4px' }}>Desenvolvido por</div>
          <div style={{ fontSize: '13px' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 800, color: '#E8471A' }}>Pico</span>
            <span style={{ fontWeight: 500, color: '#1A1C22' }}> Base</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0EEE9', fontFamily: 'inherit' }}>

      {/* Ocean header */}
      <div style={{ background: '#1B4B5A', padding: '20px 24px 24px' }}>
        <div style={{ fontSize: '18px', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '16px' }}>
          <span style={{ fontWeight: 800, fontStyle: 'italic', color: '#E8471A' }}>Pico</span>
          <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}> Base</span>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          {school.name}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          Solicitar aula
        </div>
      </div>

      <div style={{ padding: '24px', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        <div>
          <label style={labelStyle}>Nome completo *</label>
          <input
            style={inputStyle}
            type="text"
            value={form.student_name}
            onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
            placeholder="João Silva"
            autoComplete="name"
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
            autoComplete="tel"
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

        <div>
          <label style={labelStyle}>Data preferida</label>
          <input
            style={inputStyle}
            type="date"
            value={form.preferred_date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
          />
        </div>

        <div>
          <label style={labelStyle}>Horário preferido</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {TIME_SLOTS.map(slot => {
              const active = form.preferred_time === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, preferred_time: f.preferred_time === slot ? '' : slot }))}
                  style={{
                    padding: '14px 8px', borderRadius: '14px',
                    border: `1.5px solid ${active ? '#00A896' : '#E4E0D8'}`,
                    background: active ? '#E0F8F5' : '#fff',
                    color: active ? '#1B4B5A' : '#1A1C22',
                    fontSize: '15px', fontWeight: active ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {slot}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Observações</label>
          <textarea
            style={{ ...inputStyle, minHeight: '90px', resize: 'vertical', lineHeight: 1.5 }}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Alguma preferência ou informação adicional?"
          />
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', background: '#FFF0EE', border: '0.5px solid #F4A89A',
            borderRadius: '12px', fontSize: '13px', color: '#C0392B',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            padding: '16px', borderRadius: '14px', border: 'none',
            fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
            background: canSubmit ? '#00A896' : '#E4E0D8',
            color: canSubmit ? '#fff' : '#8A8C98',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Enviando...' : 'Solicitar aula →'}
        </button>
      </div>
    </div>
  )
}
