'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PAYMENT_METHODS, PAYMENT_TERMS } from '@/lib/schoolContract'

type SuccessResult = { ok: true; ownerEmail: string }

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Fortaleza',
  'America/Manaus',
  'America/Belem',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/Bogota',
  'Europe/Lisbon',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Pacific/Auckland',
  'Australia/Sydney',
]

const CURRENCIES = ['BRL', 'EUR', 'USD', 'GBP', 'ARS', 'CLP', 'COP']

export default function NewSchoolForm() {
  const router = useRouter()

  const [schoolName, setSchoolName] = useState('')
  const [slug,       setSlug]       = useState('')
  const [country,    setCountry]    = useState('')
  const [currency,   setCurrency]   = useState('BRL')
  const [timezone,   setTimezone]   = useState('America/Sao_Paulo')
  const [ownerName,  setOwnerName]  = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerWhatsapp, setOwnerWhatsapp] = useState('')
  const [paymentMethod,     setPaymentMethod]     = useState('')
  const [paymentTerms,      setPaymentTerms]      = useState('')
  const [subscriptionValue, setSubscriptionValue] = useState('')
  const [costCenter,        setCostCenter]        = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [result,     setResult]     = useState<SuccessResult | null>(null)

  function handleNameChange(val: string) {
    setSchoolName(val)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/master/schools', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        schoolName, slug, country, currency, timezone, ownerName, ownerEmail,
        ownerWhatsapp,
        paymentMethod:     paymentMethod || null,
        paymentTerms:      paymentTerms || null,
        subscriptionValue: subscriptionValue ? Number(subscriptionValue) : null,
        costCenter:        costCenter || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (data.ok) {
      setResult({ ok: true, ownerEmail: data.ownerEmail })
    } else {
      setError(data.error ?? 'Erro ao criar escola')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '0.5px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--slate)',
    fontFamily: 'var(--font-sans)', outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: '500' as const,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: 'var(--mist)', display: 'block', marginBottom: '6px',
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: '600' as const,
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: 'var(--mist)', marginBottom: '-4px',
  }

  if (result) {
    return (
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px',
      }}>
        <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--slate)', marginBottom: '8px' }}>
          Escola criada com sucesso.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '24px' }}>
          Um convite foi enviado para <strong style={{ color: 'var(--slate)' }}>{result.ownerEmail}</strong>.
          O owner poderá definir sua senha pelo link no email.
        </p>
        <button
          onClick={() => router.push('/master')}
          style={{
            padding: '10px 20px', background: 'var(--slate)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Voltar ao painel
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '18px',
      }}>

        <p style={sectionLabel}>Escola</p>

        <div>
          <label style={labelStyle}>Nome da escola *</label>
          <input
            style={inputStyle} type="text"
            placeholder="Pico Kite School"
            value={schoolName}
            onChange={e => handleNameChange(e.target.value)}
            autoFocus required
          />
        </div>

        <div>
          <label style={labelStyle}>Slug *</label>
          <input
            style={inputStyle} type="text"
            placeholder="pico-kite-school"
            value={slug}
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            required
          />
          <p style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
            Usado no link de check-in: /checkin/<strong>{slug || '…'}</strong>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>País *</label>
            <input
              style={inputStyle} type="text"
              placeholder="BR"
              value={country}
              onChange={e => setCountry(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Moeda *</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Fuso horário</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
          >
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '4px 0' }} />

        <p style={sectionLabel}>Owner</p>

        <div>
          <label style={labelStyle}>Nome completo *</label>
          <input
            style={inputStyle} type="text"
            placeholder="João Silva"
            value={ownerName}
            onChange={e => setOwnerName(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Email *</label>
          <input
            style={inputStyle} type="email"
            placeholder="joao@escola.com"
            value={ownerEmail}
            onChange={e => setOwnerEmail(e.target.value)}
            required
          />
          <p style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
            Um link de acesso será enviado para este email.
          </p>
        </div>

        <div>
          <label style={labelStyle}>WhatsApp</label>
          <input
            style={inputStyle} type="tel"
            placeholder="+55 85 91234-5678"
            value={ownerWhatsapp}
            onChange={e => setOwnerWhatsapp(e.target.value)}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '4px 0' }} />

        <p style={sectionLabel}>Financeiro</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Método de pagamento</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
            >
              <option value="">Selecione...</option>
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Condição de pagamento</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
            >
              <option value="">Selecione...</option>
              {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Valor da assinatura (R$)</label>
            <input
              style={inputStyle} type="number"
              min={0} step={10}
              placeholder="0"
              value={subscriptionValue}
              onChange={e => setSubscriptionValue(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Centro de custo</label>
            <input
              style={inputStyle} type="text"
              placeholder="Ex: LATAM"
              value={costCenter}
              onChange={e => setCostCenter(e.target.value)}
            />
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '-10px' }}>
          A escola começa em <strong>trial</strong> independente destes dados — ajuste o status quando o contrato for fechado.
        </p>

        {error && (
          <div style={{
            padding: '10px 14px', background: '#FEF2F2',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px', color: '#B91C1C',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 2, padding: '11px',
              background: saving ? 'var(--border)' : 'var(--slate)',
              color: saving ? 'var(--mist)' : '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Criando...' : 'Criar escola e enviar convite'}
          </button>
        </div>

      </div>
    </form>
  )
}
