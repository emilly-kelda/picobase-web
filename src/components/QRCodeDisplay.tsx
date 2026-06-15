'use client'

import { useEffect, useState } from 'react'

export default function QRCodeDisplay({
  slug,
  schoolName,
}: {
  slug: string
  schoolName: string
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    fetch('/api/owner/qr?format=png')
      .then(r => r.blob())
      .then(blob => setImgSrc(URL.createObjectURL(blob)))
  }, [])

  const checkinUrl = origin ? `${origin}/checkin/${slug}` : `/checkin/${slug}`

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: '14px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '3px',
          }}>
            QR Code de Check-in
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
            {checkinUrl}
          </div>
        </div>
        <a
          href={checkinUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: '6px 14px',
            background: 'var(--powder)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px', color: 'var(--mist)',
            textDecoration: 'none',
          }}
        >
          Testar →
        </a>
      </div>

      {/* QR + download */}
      <div style={{
        padding: '32px 24px',
        display: 'flex', alignItems: 'center',
        gap: '40px',
      }}>
        {/* QR preview */}
        <div style={{
          width: '160px', height: '160px',
          background: 'var(--powder)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="QR Code"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
              Gerando...
            </div>
          )}
        </div>

        {/* Info + download buttons */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '6px',
          }}>
            {schoolName}
          </div>
          <div style={{
            fontSize: '13px', color: 'var(--mist)',
            lineHeight: '1.6', marginBottom: '20px',
          }}>
            Imprima e deixe na recepção ou envie pelo WhatsApp.
            O aluno escaneia, preenche os dados e assina o waiver
            em menos de 2 minutos.
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href="/api/owner/qr?format=png"
              download
              style={{
                padding: '9px 18px',
                background: 'var(--glacial)', color: '#fff',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px', fontWeight: '500',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              ↓ PNG (WhatsApp)
            </a>
            <a
              href="/api/owner/qr?format=svg"
              download
              style={{
                padding: '9px 18px',
                background: '#fff', color: 'var(--slate)',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px', fontWeight: '500',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              ↓ SVG (Impressão)
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
