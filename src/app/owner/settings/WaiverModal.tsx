'use client'

import { useState } from 'react'

type WaiverFields = {
  waiver_en: string | null
  waiver_pt: string | null
  waiver_fr: string | null
  waiver_es: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px', color: 'var(--slate)',
  background: '#fff', outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
  minHeight: '110px', resize: 'vertical', lineHeight: '1.6',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--mist)', marginBottom: '6px', display: 'block',
}

const LANGS: Array<{ key: keyof WaiverFields; label: string }> = [
  { key: 'waiver_en', label: 'EN · English'   },
  { key: 'waiver_pt', label: 'PT · Português' },
  { key: 'waiver_fr', label: 'FR · Français'  },
  { key: 'waiver_es', label: 'ES · Español'   },
]

export default function WaiverModal({
  waivers,
  onClose,
  onSaved,
}: {
  waivers: WaiverFields
  onClose: () => void
  onSaved: (patch: WaiverFields) => void
}) {
  const [form, setForm]     = useState(waivers)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'school', ...form }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved(form)
      } else {
        setError(data.error ?? 'Não foi possível salvar.')
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
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '560px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Termo de responsabilidade (Waiver)
        </div>
        <p style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '20px', lineHeight: '1.5' }}>
          Cada versão é exibida ao aluno no check-in de acordo com o idioma selecionado. Revise com seu jurídico.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {LANGS.map(({ key, label }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <textarea
                style={inputStyle}
                value={form[key] ?? ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={`Texto do waiver em ${label}...`}
              />
            </div>
          ))}
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
            disabled={saving}
            style={{
              flex: 2, padding: '11px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
