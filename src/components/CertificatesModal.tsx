'use client'

import { useEffect, useMemo, useState } from 'react'
import { normalizeSportKey, translateModalityName } from '@/lib/modality'

type Activity = { id: string; name: string }

type SignatureType = 'upload' | 'fictitious' | 'text'

type CertificateTemplate = {
  id: string
  sport_key: string | null
  theme_key: string
  background_image_url: string | null
  signature_type: SignatureType
  signature_data: string | null
  font_family: string | null
}

const DEFAULT_FORM = {
  theme_key: 'oceano',
  background_image_url: null as string | null,
  signature_type: 'text' as SignatureType,
  signature_data: null as string | null,
  font_family: null as string | null,
}

// Must stay in sync with the server-side definitions in
// src/lib/certificate-pdf.tsx — not imported directly since that module
// pulls in @react-pdf/renderer (server-only PDF rendering, shouldn't ship
// to the client bundle). Google Fonts CSS2 API (browser-optimized woff2)
// here vs. the raw static TTF files used server-side — same visual fonts.
const GOOGLE_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Pacifico&family=Sacramento&family=Alex+Brush&family=Allura&display=swap'

const THEMES = [
  { key: 'oceano', label: 'Oceano', colors: ['#0B1F2E', '#2EC4B6', '#E8F8F7'] },
  { key: 'areia',  label: 'Areia',  colors: ['#6B4226', '#D4A574', '#FBF1E0'] },
  { key: 'vento',  label: 'Vento',  colors: ['#1E3A5F', '#5DADE2', '#EBF5FB'] },
]

const FONTS: Array<{ key: string; label: string; family: string }> = [
  { key: 'great_vibes', label: 'Great Vibes', family: "'Great Vibes', cursive" },
  { key: 'pacifico',    label: 'Pacifico',    family: "'Pacifico', cursive" },
  { key: 'sacramento',  label: 'Sacramento',  family: "'Sacramento', cursive" },
  { key: 'alex_brush',  label: 'Alex Brush',  family: "'Alex Brush', cursive" },
  { key: 'allura',      label: 'Allura',      family: "'Allura', cursive" },
]

const FICTITIOUS_PRESETS: Array<{ key: string; text: string; fontKey: string }> = [
  { key: 'direcao_tecnica',        text: 'Direção Técnica',        fontKey: 'great_vibes' },
  { key: 'coordenacao_pedagogica', text: 'Coordenação Pedagógica', fontKey: 'allura' },
  { key: 'instrutor_responsavel',  text: 'Instrutor Responsável',  fontKey: 'alex_brush' },
  { key: 'direcao_geral',          text: 'Direção Geral',          fontKey: 'sacramento' },
  { key: 'coordenacao_ensino',     text: 'Coordenação de Ensino',  fontKey: 'pacifico' },
]

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--mist)', marginBottom: '8px', display: 'block',
}

const pillBase: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 'var(--radius-full)',
  fontSize: '13px', fontWeight: '500', cursor: 'pointer',
  fontFamily: 'var(--font-sans)', border: '1.5px solid var(--border)',
  background: '#fff', color: 'var(--mist)',
}
const pillActive: React.CSSProperties = {
  ...pillBase, border: '1.5px solid var(--glacial)',
  background: 'var(--glacial-light)', color: 'var(--glacial-dark)',
}

function fontFamilyOf(key: string | null) {
  return FONTS.find(f => f.key === key)?.family ?? FONTS[0].family
}

export default function CertificatesModal({
  activities,
  logoUrl,
  onClose,
  onLogoSaved,
}: {
  activities: Activity[]
  logoUrl: string | null
  onClose: () => void
  onLogoSaved: (logoUrl: string | null) => void
}) {
  const sportOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const a of activities) {
      const key = normalizeSportKey(a.name)
      if (key && !seen.has(key)) seen.set(key, translateModalityName(key, 'pt'))
    }
    return [...seen.entries()].map(([key, label]) => ({ key, label }))
  }, [activities])

  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [scope, setScope] = useState<string | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/owner/certificate-templates')
      .then(r => r.json())
      .then(data => setTemplates(data.templates ?? []))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false))
  }, [])

  // Loads the selected scope's saved template (or resets to defaults if
  // that sport has no override yet) whenever the scope changes or the
  // initial fetch above lands. Adjusted during render (React's documented
  // pattern for "reset state when a prop changes") rather than in a
  // useEffect, which would call setState synchronously after commit and
  // trigger an extra cascading render. Switching scope discards any
  // unsaved edits in the previous one — acceptable for a single-click Save
  // flow.
  const resetKey = `${scope}:${loadingTemplates}`
  const [lastResetKey, setLastResetKey] = useState(resetKey)
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey)
    const existing = templates.find(t => t.sport_key === scope)
    setForm(existing ? {
      theme_key: existing.theme_key,
      background_image_url: existing.background_image_url,
      signature_type: existing.signature_type,
      signature_data: existing.signature_data,
      font_family: existing.font_family,
    } : DEFAULT_FORM)
    setSaved(false)
    setError(null)
  }

  const currentOverride = templates.find(t => t.sport_key === scope)

  async function upload(file: File, kind: 'background' | 'signature' | 'logo'): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('kind', kind)
    const res = await fetch('/api/owner/certificate-templates/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!data.ok) {
      setError(data.error ?? 'Não foi possível enviar o arquivo.')
      return null
    }
    return data.url
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    setError(null)
    try {
      const url = await upload(file, 'logo')
      if (url) {
        const res = await fetch('/api/owner/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'school', logo_url: url }),
        })
        const data = await res.json()
        if (data.ok) onLogoSaved(url)
        else setError(data.error ?? 'Não foi possível salvar a logo.')
      }
    } catch {
      setError('Erro de rede ao enviar a logo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleLogoRemove() {
    const res = await fetch('/api/owner/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'school', logo_url: null }),
    })
    const data = await res.json()
    if (data.ok) onLogoSaved(null)
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/owner/certificate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport_key: scope,
          theme_key: form.theme_key,
          background_image_url: form.background_image_url,
          signature_type: form.signature_type,
          signature_data: form.signature_data,
          font_family: form.font_family,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        const listRes = await fetch('/api/owner/certificate-templates')
        const listData = await listRes.json()
        setTemplates(listData.templates ?? [])
        setSaved(true)
      } else {
        setError(data.error ?? 'Não foi possível salvar.')
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function removeOverride() {
    if (!currentOverride) return
    setRemoving(true)
    setError(null)
    try {
      const res = await fetch(`/api/owner/certificate-templates?id=${currentOverride.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        setTemplates(prev => prev.filter(t => t.id !== currentOverride.id))
        setForm(DEFAULT_FORM)
      } else {
        setError(data.error ?? 'Não foi possível remover.')
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setRemoving(false)
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
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '640px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Certificados
        </div>
        <p style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '20px', lineHeight: '1.5' }}>
          Personalize a aparência do Atestado de Horas e do Certificado de Proficiência.
        </p>

        {/* Logo — global, applies to every certificate regardless of esporte */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Logo da escola</label>
          {logoUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={logoUrl} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px' }} />
              <button type="button" onClick={handleLogoRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--signal)', fontSize: '12px', fontFamily: 'var(--font-sans)', textDecoration: 'underline' }}>
                Remover logo
              </button>
            </div>
          ) : (
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '9px 12px', border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)', cursor: uploadingLogo ? 'not-allowed' : 'pointer',
              fontSize: '13px', color: 'var(--mist)', background: 'var(--powder)',
            }}>
              <span>{uploadingLogo ? 'Enviando...' : '📎 Escolher logo (PNG, JPG ou WEBP)'}</span>
              <input
                type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingLogo}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = '' }}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0 20px' }} />

        {/* Escopo */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Aplicar a</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setScope(null)} style={scope === null ? pillActive : pillBase}>
              Padrão (todas as modalidades)
            </button>
            {sportOptions.map(s => (
              <button key={s.key} type="button" onClick={() => setScope(s.key)} style={scope === s.key ? pillActive : pillBase}>
                {s.label}{templates.some(t => t.sport_key === s.key) ? ' •' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Fundo */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Fundo do certificado</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {THEMES.map(theme => (
              <button
                key={theme.key}
                type="button"
                onClick={() => setForm(f => ({ ...f, theme_key: theme.key, background_image_url: null }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${!form.background_image_url && form.theme_key === theme.key ? 'var(--glacial)' : 'var(--border)'}`,
                  background: !form.background_image_url && form.theme_key === theme.key ? 'var(--glacial-light)' : '#fff',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--slate)',
                }}
              >
                <span style={{ display: 'flex' }}>
                  {theme.colors.map((c, i) => (
                    <span key={i} style={{ width: '10px', height: '14px', background: c }} />
                  ))}
                </span>
                {theme.label}
              </button>
            ))}
          </div>
          {form.background_image_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={form.background_image_url} alt="Fundo customizado" style={{ width: '80px', height: '48px', objectFit: 'cover', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
              <button type="button" onClick={() => setForm(f => ({ ...f, background_image_url: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--signal)', fontSize: '12px', fontFamily: 'var(--font-sans)', textDecoration: 'underline' }}>
                Remover imagem
              </button>
            </div>
          ) : (
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '9px 12px', border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)', cursor: uploadingBg ? 'not-allowed' : 'pointer',
              fontSize: '13px', color: 'var(--mist)', background: 'var(--powder)',
            }}>
              <span>{uploadingBg ? 'Enviando...' : '📎 Ou fazer upload de uma imagem customizada'}</span>
              <input
                type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingBg}
                onChange={async e => {
                  const f = e.target.files?.[0]; e.target.value = ''
                  if (!f) return
                  setUploadingBg(true)
                  const url = await upload(f, 'background')
                  if (url) setForm(fm => ({ ...fm, background_image_url: url }))
                  setUploadingBg(false)
                }}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        {/* Assinatura */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Assinatura</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {([
              { value: 'text' as const, label: 'Texto' },
              { value: 'fictitious' as const, label: 'Fictícia' },
              { value: 'upload' as const, label: 'Upload' },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, signature_type: opt.value, signature_data: null }))}
                style={form.signature_type === opt.value ? pillActive : pillBase}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {form.signature_type === 'text' && (
            <div>
              <input
                type="text"
                placeholder="Nome ou cargo (ex: João Silva, Direção)"
                value={form.signature_data ?? ''}
                onChange={e => setForm(f => ({ ...f, signature_data: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 12px', marginBottom: '10px',
                  border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
                  fontSize: '13px', color: 'var(--slate)', fontFamily: 'var(--font-sans)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FONTS.map(font => (
                  <button
                    key={font.key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, font_family: font.key }))}
                    style={{
                      padding: '8px 14px', borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${(form.font_family ?? FONTS[0].key) === font.key ? 'var(--glacial)' : 'var(--border)'}`,
                      background: (form.font_family ?? FONTS[0].key) === font.key ? 'var(--glacial-light)' : '#fff',
                      cursor: 'pointer', fontSize: '18px', fontFamily: font.family, color: 'var(--slate)',
                    }}
                  >
                    {form.signature_data?.trim() || 'Assinatura'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.signature_type === 'fictitious' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {FICTITIOUS_PRESETS.map(preset => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, signature_data: preset.key }))}
                  style={{
                    padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'left',
                    border: `1.5px solid ${form.signature_data === preset.key ? 'var(--glacial)' : 'var(--border)'}`,
                    background: form.signature_data === preset.key ? 'var(--glacial-light)' : '#fff',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div style={{ fontSize: '20px', fontFamily: fontFamilyOf(preset.fontKey), color: 'var(--slate)', marginBottom: '4px' }}>
                    {preset.text}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mist)' }}>{preset.text}</div>
                </button>
              ))}
            </div>
          )}

          {form.signature_type === 'upload' && (
            form.signature_data ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={form.signature_data} alt="Assinatura" style={{ height: '40px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px' }} />
                <button type="button" onClick={() => setForm(f => ({ ...f, signature_data: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--signal)', fontSize: '12px', fontFamily: 'var(--font-sans)', textDecoration: 'underline' }}>
                  Remover assinatura
                </button>
              </div>
            ) : (
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '9px 12px', border: '1px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)', cursor: uploadingSig ? 'not-allowed' : 'pointer',
                fontSize: '13px', color: 'var(--mist)', background: 'var(--powder)',
              }}>
                <span>{uploadingSig ? 'Enviando...' : '📎 Escolher imagem (PNG com fundo transparente)'}</span>
                <input
                  type="file" accept="image/png" disabled={uploadingSig}
                  onChange={async e => {
                    const f = e.target.files?.[0]; e.target.value = ''
                    if (!f) return
                    setUploadingSig(true)
                    const url = await upload(f, 'signature')
                    if (url) setForm(fm => ({ ...fm, signature_data: url }))
                    setUploadingSig(false)
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            )
          )}
        </div>

        {error && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {saved && !error && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px',
            background: 'var(--powder)', color: 'var(--slate)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            Template salvo. Abra o certificado de um aluno para conferir o resultado.
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
            Fechar
          </button>
          {scope !== null && currentOverride && (
            <button
              onClick={removeOverride}
              disabled={removing || saving}
              style={{
                flex: 1, padding: '11px',
                background: '#fff', color: 'var(--signal)',
                border: '0.5px solid var(--signal)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px', cursor: removing ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {removing ? 'Removendo...' : 'Remover personalização'}
            </button>
          )}
          <button
            onClick={save}
            disabled={saving || loadingTemplates}
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
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
