'use client'

import { useState } from 'react'

type WaiverFields = {
  waiver_en: string | null
  waiver_pt: string | null
  waiver_fr: string | null
  waiver_es: string | null
  waiver_type: string | null
  waiver_file_global_url: string | null
  waiver_files_by_lang: Record<string, string> | null
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

const LANGS: Array<{ key: 'waiver_en' | 'waiver_pt' | 'waiver_fr' | 'waiver_es'; code: string; label: string }> = [
  { key: 'waiver_pt', code: 'pt', label: 'PT · Português' },
  { key: 'waiver_en', code: 'en', label: 'EN · English'   },
  { key: 'waiver_fr', code: 'fr', label: 'FR · Français'  },
  { key: 'waiver_es', code: 'es', label: 'ES · Español'   },
]

function extOf(url: string) {
  const clean = url.split('?')[0]
  const ext = clean.slice(clean.lastIndexOf('.') + 1).toUpperCase()
  return ext.length <= 5 ? ext : 'ARQUIVO'
}

/** One upload/remove control — used for both the global document and each
 *  per-language slot. Shows the uploaded filename with a remove (trash)
 *  button once set, matching PartnerFormModal's logo-upload interaction. */
function FileSlot({
  url, fileName, uploading, onUpload, onRemove,
}: {
  url: string | null
  fileName: string | null
  uploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  if (url) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', border: '0.5px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)', background: '#fff',
      }}>
        <span style={{ fontSize: '15px' }}>📎</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: '13px', color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName ?? `Arquivo enviado (.${extOf(url).toLowerCase()})`}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '12px', color: 'var(--glacial-dark)', fontWeight: '500', textDecoration: 'none', flexShrink: 0 }}
        >
          Ver
        </a>
        <button
          type="button"
          onClick={onRemove}
          title="Remover arquivo"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--signal)', fontSize: '14px', padding: '2px 4px', flexShrink: 0,
          }}
        >
          🗑
        </button>
      </div>
    )
  }

  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '9px 12px', border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-md)', cursor: uploading ? 'not-allowed' : 'pointer',
      fontSize: '13px', color: 'var(--mist)', background: 'var(--powder)',
    }}>
      <span>📎</span>
      <span>{uploading ? 'Enviando...' : 'Escolher arquivo (PDF ou Word)'}</span>
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={uploading}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />
    </label>
  )
}

export default function WaiverModal({
  waivers,
  onClose,
  onSaved,
}: {
  waivers: WaiverFields
  onClose: () => void
  onSaved: (patch: WaiverFields) => void
}) {
  const [form, setForm] = useState({
    waiver_en: waivers.waiver_en,
    waiver_pt: waivers.waiver_pt,
    waiver_fr: waivers.waiver_fr,
    waiver_es: waivers.waiver_es,
  })
  const [waiverType, setWaiverType] = useState<'text' | 'file'>(
    waivers.waiver_type === 'file' ? 'file' : 'text'
  )
  const [globalUrl, setGlobalUrl] = useState(waivers.waiver_file_global_url)
  const [filesByLang, setFilesByLang] = useState<Record<string, string>>(waivers.waiver_files_by_lang ?? {})
  // Original filenames only survive for uploads made in this session — the
  // DB only stores URLs, so a previously-saved file falls back to showing
  // its extension instead of a name (see FileSlot).
  const [fileNames, setFileNames] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function uploadTo(slot: string, file: File, apply: (url: string) => void) {
    setUploading(u => ({ ...u, [slot]: true }))
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/owner/upload-waiver', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.ok) {
        apply(data.url)
        setFileNames(f => ({ ...f, [slot]: data.fileName ?? file.name }))
      } else {
        setError(data.error ?? 'Não foi possível enviar o arquivo.')
      }
    } catch {
      setError('Erro de rede ao enviar o arquivo.')
    } finally {
      setUploading(u => ({ ...u, [slot]: false }))
    }
  }

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    const patch: WaiverFields = {
      ...form,
      waiver_type: waiverType,
      waiver_file_global_url: globalUrl,
      waiver_files_by_lang: filesByLang,
    }
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'school', ...patch }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved(patch)
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
          Exibido ao aluno no check-in de acordo com o idioma selecionado. Revise com seu jurídico.
        </p>

        <label style={labelStyle}>Tipo de Termo de Responsabilidade</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {([
            { value: 'text' as const, label: 'Texto Dinâmico' },
            { value: 'file' as const, label: 'Anexo de Arquivo Oficial' },
          ]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWaiverType(opt.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: `1.5px solid ${waiverType === opt.value ? 'var(--glacial)' : 'var(--border)'}`,
                background: waiverType === opt.value ? 'var(--glacial-light)' : '#fff',
                color: waiverType === opt.value ? 'var(--glacial-dark)' : 'var(--mist)',
                fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {waiverType === 'text' ? (
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
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Documento Geral Único (Opcional)</label>
              <p style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '8px', lineHeight: '1.5' }}>
                Suba um arquivo único (PDF/Word) válido para todos os alunos se não quiser separar por idioma.
              </p>
              <FileSlot
                url={globalUrl}
                fileName={fileNames['global'] ?? null}
                uploading={!!uploading['global']}
                onUpload={file => uploadTo('global', file, url => setGlobalUrl(url))}
                onRemove={() => setGlobalUrl(null)}
              />
            </div>

            <div>
              <div style={{ ...labelStyle, marginBottom: '10px' }}>Documentos por idioma</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {LANGS.map(({ code, label }) => (
                  <div key={code}>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--slate)', marginBottom: '6px', display: 'block' }}>
                      {label}
                    </label>
                    <FileSlot
                      url={filesByLang[code] ?? null}
                      fileName={fileNames[code] ?? null}
                      uploading={!!uploading[code]}
                      onUpload={file => uploadTo(code, file, url => setFilesByLang(f => ({ ...f, [code]: url })))}
                      onRemove={() => setFilesByLang(f => {
                        const next = { ...f }
                        delete next[code]
                        return next
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
