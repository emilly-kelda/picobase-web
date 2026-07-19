'use client'

import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  fontFamily: 'var(--font-sans)', outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

const NATIONALITIES: Array<[string, string]> = [
  ['BR', '🇧🇷 Brasil'], ['FR', '🇫🇷 França'],
  ['DE', '🇩🇪 Alemanha'], ['GB', '🇬🇧 UK'],
  ['US', '🇺🇸 EUA'], ['AR', '🇦🇷 Argentina'],
  ['ES', '🇪🇸 Espanha'], ['PT', '🇵🇹 Portugal'],
  ['IT', '🇮🇹 Itália'], ['NL', '🇳🇱 Holanda'],
  ['AU', '🇦🇺 Austrália'], ['SE', '🇸🇪 Suécia'],
  ['OTHER', 'Outro'],
]

/** Same fields/validation as the old standalone /owner/students/new route
 *  (plain useState, no form library — this app doesn't use one anywhere),
 *  now a modal so adding a student doesn't leave the list. */
export default function AddStudentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [name,        setName]        = useState('')
  const [nationality, setNationality] = useState('')
  const [whatsapp,    setWhatsapp]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function save() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          nationality: nationality || null,
          whatsapp: whatsapp || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved()
      } else {
        setError(data.error ?? 'Erro ao criar aluno')
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
        width: '100%', maxWidth: '480px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
            Novo aluno
          </div>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Adicionar aluno manualmente ao sistema.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Nome completo *</label>
            <input
              style={inputStyle} type="text"
              placeholder="Sofia Andersson"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Nacionalidade</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={nationality}
              onChange={e => setNationality(e.target.value)}
            >
              <option value="">—</option>
              {NATIONALITIES.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>WhatsApp</label>
            <input
              style={inputStyle} type="tel"
              placeholder="+55 85 9..."
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
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

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
            disabled={saving || !name.trim()}
            style={{
              flex: 2, padding: '11px',
              background: saving || !name.trim() ? 'var(--border)' : 'var(--slate)',
              color: saving || !name.trim() ? 'var(--mist)' : '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Salvando...' : 'Criar aluno'}
          </button>
        </div>
      </div>
    </div>
  )
}
