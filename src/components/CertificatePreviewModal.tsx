'use client'

import { useEffect, useState } from 'react'
import { buildApiWhatsAppUrl } from '@/lib/whatsapp'

type Props = {
  studentId: string
  studentName: string
  whatsapp: string | null
  sportKey: string
  sportLabel: string
  docType: 'hours' | 'proficiency'
  siteOrigin: string
  onClose: () => void
}

/** Preview + share modal opened from CertificateSection.tsx's pills — replaces
 *  the old "open the PDF in a new tab" link. The certificate API route
 *  (`/api/owner/certificate/[studentId]/[sport]`) always sends
 *  `Content-Disposition: attachment`, which blocks inline `<iframe src>`
 *  rendering — rather than touch that route (its URL is also the one shared
 *  directly to students over WhatsApp, so changing its headers is riskier
 *  than it looks), this fetches the PDF as a blob client-side and previews/
 *  downloads from the resulting object URL instead. */
export default function CertificatePreviewModal({
  studentId, studentName, whatsapp, sportKey, sportLabel, docType, siteOrigin, onClose,
}: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = `${siteOrigin}/api/owner/certificate/${studentId}/${sportKey}?type=${docType}`
  const docLabel = docType === 'hours' ? 'Atestado de Horas' : 'Certificado de Proficiência'
  const docLabelLower = docType === 'hours' ? 'atestado de horas' : 'certificado de proficiência'
  const filename = `${docType === 'hours' ? 'atestado' : 'certificado'}_${studentName.replace(/\s+/g, '_')}_${sportKey}.pdf`

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error('Não foi possível gerar o documento.')
        return res.blob()
      })
      .then(blob => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      })
      .catch(() => { if (!cancelled) setError('Não foi possível gerar o documento. Tente novamente.') })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [apiUrl])

  const message = `Olá, ${studentName}! Segue seu ${docLabelLower} de ${sportLabel}: ${apiUrl}`

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 260, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '720px',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--slate)' }}>
            {docLabel} — {studentName}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--mist)', padding: '4px 8px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', background: 'var(--powder)', minHeight: '60vh' }}>
          {error ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--signal)' }}>
              {error}
            </div>
          ) : !blobUrl ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
              Carregando...
            </div>
          ) : (
            <iframe src={blobUrl} title={docLabel} style={{ width: '100%', height: '100%', minHeight: '60vh', border: 'none' }} />
          )}
        </div>

        <div style={{
          padding: '16px 24px', borderTop: '0.5px solid var(--border)',
          display: 'flex', gap: '10px', flexShrink: 0,
        }}>
          {blobUrl ? (
            <a
              href={blobUrl}
              download={filename}
              style={{
                flex: 1, padding: '11px', borderRadius: 'var(--radius-md)',
                border: '0.5px solid var(--border-strong)',
                fontSize: '13px', fontWeight: '500', textAlign: 'center',
                color: 'var(--slate)', textDecoration: 'none', fontFamily: 'var(--font-sans)',
              }}
            >
              ⬇️ Baixar PDF
            </a>
          ) : (
            <span style={{
              flex: 1, padding: '11px', borderRadius: 'var(--radius-md)',
              border: '0.5px solid var(--border)', fontSize: '13px', textAlign: 'center',
              color: 'var(--mist)', cursor: 'not-allowed',
            }}>
              ⬇️ Baixar PDF
            </span>
          )}

          {whatsapp ? (
            <a
              href={buildApiWhatsAppUrl(whatsapp, message)}
              target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, padding: '11px', borderRadius: 'var(--radius-md)', border: 'none',
                fontSize: '13px', fontWeight: '500', textAlign: 'center',
                background: 'var(--slate)', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-sans)',
              }}
            >
              💬 Enviar via WhatsApp
            </a>
          ) : (
            <span
              title="Aluno sem WhatsApp cadastrado"
              style={{
                flex: 1, padding: '11px', borderRadius: 'var(--radius-md)',
                fontSize: '13px', textAlign: 'center',
                background: 'var(--border)', color: 'var(--mist)', cursor: 'not-allowed',
              }}
            >
              💬 Enviar via WhatsApp
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
