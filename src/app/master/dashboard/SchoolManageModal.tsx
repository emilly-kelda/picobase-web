'use client'

import { useState, useEffect } from 'react'
import type { MasterSchoolRow } from '@/repositories/schoolRepository'

type FinancialDoc = { id: string; doc_type: string; url: string; note: string | null; created_at: string }

const DOC_TYPES = [
  { value: 'nota_fiscal',    label: 'Nota Fiscal' },
  { value: 'recibo',         label: 'Recibo' },
  { value: 'link_cobranca',  label: 'Link de cobrança' },
]

const DOC_TYPE_LABEL: Record<string, string> = Object.fromEntries(DOC_TYPES.map(t => [t.value, t.label]))

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
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

const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--mist)',
}

export default function SchoolManageModal({
  school,
  onClose,
}: {
  school: MasterSchoolRow
  onClose: () => void
}) {
  const [message, setMessage]           = useState('')
  const [sendingNotice, setSendingNotice] = useState(false)
  const [noticeSent, setNoticeSent]     = useState(false)
  const [noticeError, setNoticeError]   = useState<string | null>(null)

  const [docs, setDocs]           = useState<FinancialDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [docType, setDocType]     = useState('nota_fiscal')
  const [docUrl, setDocUrl]       = useState('')
  const [docNote, setDocNote]     = useState('')
  const [savingDoc, setSavingDoc] = useState(false)
  const [docError, setDocError]   = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/master/financial-docs?school_id=${school.id}`)
      .then(r => r.json())
      .then(data => setDocs(data.docs ?? []))
      .catch(() => {})
      .finally(() => setLoadingDocs(false))
  }, [school.id])

  async function sendNotice() {
    if (!message.trim()) return
    setSendingNotice(true)
    setNoticeError(null)
    try {
      const res = await fetch('/api/master/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: school.id, message: message.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessage('')
        setNoticeSent(true)
        setTimeout(() => setNoticeSent(false), 3000)
      } else {
        setNoticeError(data.error ?? 'Erro ao enviar aviso.')
      }
    } catch {
      setNoticeError('Erro de rede. Tente novamente.')
    } finally {
      setSendingNotice(false)
    }
  }

  async function saveDoc() {
    if (!docUrl.trim()) return
    setSavingDoc(true)
    setDocError(null)
    try {
      const res = await fetch('/api/master/financial-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: school.id, docType, url: docUrl.trim(), note: docNote.trim() || null }),
      })
      const data = await res.json()
      if (data.ok) {
        setDocUrl('')
        setDocNote('')
        const refreshed = await fetch(`/api/master/financial-docs?school_id=${school.id}`).then(r => r.json())
        setDocs(refreshed.docs ?? [])
      } else {
        setDocError(data.error ?? 'Erro ao salvar documento.')
      }
    } catch {
      setDocError('Erro de rede. Tente novamente.')
    } finally {
      setSavingDoc(false)
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
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '480px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Gerenciar escola
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '24px' }}>
          {school.name}
        </div>

        {/* ── Notice ────────────────────────────────────────────────────── */}
        <p style={sectionLabel}>Enviar aviso</p>
        <p style={{ fontSize: '12px', color: 'var(--mist)', margin: '4px 0 10px' }}>
          Aparece como banner para o dono ao entrar no painel.
        </p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          placeholder="Ex: sua assinatura vence em 3 dias..."
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
        />
        {noticeError && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626' }}>{noticeError}</div>
        )}
        {noticeSent && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#007868' }}>Aviso enviado.</div>
        )}
        <button
          onClick={sendNotice}
          disabled={!message.trim() || sendingNotice}
          style={{
            marginTop: '10px', padding: '8px 16px',
            background: message.trim() ? 'var(--slate)' : 'var(--border)',
            color: message.trim() ? '#fff' : 'var(--mist)',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '12px', fontWeight: '500',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {sendingNotice ? 'Enviando...' : 'Enviar aviso'}
        </button>

        <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '24px 0' }} />

        {/* ── Financial documents ──────────────────────────────────────── */}
        <p style={sectionLabel}>Documentos financeiros</p>

        <div style={{ margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loadingDocs ? (
            <div style={{ fontSize: '12px', color: 'var(--mist)' }}>Carregando...</div>
          ) : docs.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--mist)' }}>Nenhum documento registrado.</div>
          ) : (
            docs.map(d => (
              <div key={d.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', background: 'var(--powder)', borderRadius: 'var(--radius-md)',
                fontSize: '12px',
              }}>
                <div>
                  <span style={{ fontWeight: '500', color: 'var(--slate)' }}>
                    {DOC_TYPE_LABEL[d.doc_type] ?? d.doc_type}
                  </span>
                  {d.note && <span style={{ color: 'var(--mist)' }}> — {d.note}</span>}
                </div>
                <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--glacial-dark)', flexShrink: 0, marginLeft: '10px' }}>
                  Abrir ↗
                </a>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>URL</label>
            <input
              style={inputStyle} type="text"
              placeholder="https://..."
              value={docUrl}
              onChange={e => setDocUrl(e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label style={labelStyle}>Nota (opcional)</label>
          <input
            style={inputStyle} type="text"
            value={docNote}
            onChange={e => setDocNote(e.target.value)}
          />
        </div>
        {docError && (
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#DC2626' }}>{docError}</div>
        )}
        <button
          onClick={saveDoc}
          disabled={!docUrl.trim() || savingDoc}
          style={{
            padding: '8px 16px',
            background: docUrl.trim() ? 'var(--slate)' : 'var(--border)',
            color: docUrl.trim() ? '#fff' : 'var(--mist)',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '12px', fontWeight: '500',
            cursor: docUrl.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {savingDoc ? 'Salvando...' : 'Adicionar documento'}
        </button>

        <div style={{ display: 'flex', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
