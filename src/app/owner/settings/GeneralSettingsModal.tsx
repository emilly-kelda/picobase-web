'use client'

import { useState } from 'react'

type School = {
  id: string
  name: string
  slug: string
  currency: string
  language: string
  sport_types: string[] | null
  country: string | null
  payout_model: string
  fixed_payout_value: number | null
  privacy_policy_url: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px', color: 'var(--slate)',
  background: '#fff', outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--mist)', marginBottom: '6px', display: 'block',
}

export default function GeneralSettingsModal({
  school,
  currentLang,
  onClose,
  onSaved,
}: {
  school: School
  currentLang: string
  onClose: () => void
  onSaved: (patch: Partial<School>) => void
}) {
  const [name, setName]         = useState(school.name)
  const [country, setCountry]   = useState(school.country ?? '')
  const [language, setLanguage] = useState(school.language)
  const [payoutModel, setPayoutModel] = useState(school.payout_model ?? 'percentage')
  const [fixedPayoutValue, setFixedPayoutValue] = useState(String(school.fixed_payout_value ?? ''))
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(school.privacy_policy_url ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [portalLangSaving, setPortalLangSaving] = useState(false)

  const canSave = name.trim().length >= 2
    && (payoutModel !== 'fixed' || Number(fixedPayoutValue) > 0)
    && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'school', name, country, language,
          payout_model: payoutModel,
          fixed_payout_value: payoutModel === 'fixed' ? Number(fixedPayoutValue) : null,
          privacy_policy_url: privacyPolicyUrl.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved({
          name, country, language,
          payout_model: payoutModel,
          fixed_payout_value: payoutModel === 'fixed' ? Number(fixedPayoutValue) : null,
          privacy_policy_url: privacyPolicyUrl.trim() || null,
        })
      } else {
        setError(data.error ?? 'Não foi possível salvar.')
        setSaving(false)
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
      setSaving(false)
    }
  }

  // Portal language is the viewer's own UI preference (cookie), distinct
  // from the school's default `language` field above — applies immediately,
  // no "Save" step, same as before this refactor.
  async function setPortalLang(lang: string) {
    setPortalLangSaving(true)
    await fetch('/api/owner/language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang }),
    })
    window.location.reload()
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
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '20px' }}>
          Geral
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nome da escola</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>País</label>
              <input style={inputStyle} value={country} placeholder="BR" onChange={e => setCountry(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Idioma padrão da escola</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Modelo de repasse dos instrutores</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { value: 'percentage', label: 'Percentual por aula (%)', sub: 'Usa a comissão cadastrada de cada instrutor' },
                { value: 'fixed',      label: 'Taxa fixa por aula (valor único)', sub: 'Mesmo valor para qualquer instrutor, ignora a comissão individual' },
              ].map(option => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 12px',
                    border: `0.5px solid ${payoutModel === option.value ? 'var(--slate)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payout_model"
                    checked={payoutModel === option.value}
                    onChange={() => setPayoutModel(option.value)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--slate)', fontWeight: '500' }}>{option.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)' }}>{option.sub}</div>
                  </div>
                </label>
              ))}
            </div>
            {payoutModel === 'fixed' && (
              <div style={{ marginTop: '10px' }}>
                <label style={labelStyle}>Valor fixo por aula (R$)</label>
                <input
                  style={inputStyle} type="number" min={0} step={1}
                  value={fixedPayoutValue}
                  placeholder="50"
                  onChange={e => setFixedPayoutValue(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Link da Política de Privacidade (LGPD)</label>
            <input
              style={inputStyle} type="url"
              value={privacyPolicyUrl}
              placeholder="https://..."
              onChange={e => setPrivacyPolicyUrl(e.target.value)}
            />
            <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
              Opcional. Quando preenchido, aparece como um link ao lado do consentimento
              de dados no check-in público. Este app não gera nem assume um texto de
              política — use o documento revisado pelo seu jurídico.
            </div>
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
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '24px 0' }} />

        <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '12px' }}>
          Idioma do portal
        </div>
        <p style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '12px' }}>
          {currentLang === 'pt' ? 'Idioma da sua própria interface — aplica imediatamente.' : 'Your own interface language — applies immediately.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {[
            { value: 'pt', label: '🇧🇷 Português' },
            { value: 'en', label: '🇬🇧 English'   },
          ].map(option => (
            <button
              key={option.value}
              disabled={portalLangSaving}
              onClick={() => setPortalLang(option.value)}
              style={{
                padding: '9px 16px', borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${currentLang === option.value ? 'var(--glacial)' : 'var(--border-strong)'}`,
                background: currentLang === option.value ? 'var(--glacial-light)' : '#fff',
                color: currentLang === option.value ? 'var(--glacial-dark)' : 'var(--slate)',
                fontSize: '13px', fontWeight: '500',
                cursor: portalLangSaving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '10px' }}>
          Informações do sistema
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'School ID', value: school.id },
            { label: 'Slug',      value: school.slug },
            { label: 'Currency',  value: school.currency },
            { label: 'Sports',    value: school.sport_types?.join(', ') || '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--mist)', width: '70px', flexShrink: 0 }}>
                {item.label}
              </span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--slate)', wordBreak: 'break-all' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
