'use client'

import { useState, useEffect } from 'react'

/** Compact trigger for the receptionist's counter: instead of navigating to
 *  Settings to find the full QRCodeDisplay card, this opens the same QR
 *  (same /api/owner/qr endpoint) right where the walk-in student is being
 *  handled — Sala de Espera. */
export default function CheckinQRButton({
  slug,
  schoolName,
}: {
  slug: string
  schoolName: string
}) {
  const [open, setOpen]       = useState(false)
  const [imgSrc, setImgSrc]   = useState<string | null>(null)
  const [origin, setOrigin]   = useState('')

  useEffect(() => {
    if (!open) return
    setOrigin(window.location.origin)
    if (imgSrc) return
    fetch('/api/owner/qr?format=png')
      .then(r => r.blob())
      .then(blob => setImgSrc(URL.createObjectURL(blob)))
  }, [open])

  const checkinUrl = origin ? `${origin}/checkin/${slug}` : `/checkin/${slug}`

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px',
          background: '#fff',
          border: '0.5px solid var(--border-strong)',
          borderRadius: 'var(--radius-full)',
          fontSize: '11px', fontWeight: '500',
          color: 'var(--glacial-dark)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          whiteSpace: 'nowrap',
        }}
      >
        📱 Exibir QR Code de Check-in
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '340px',
            padding: '28px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
              {schoolName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '20px' }}>
              Peça para o cliente escanear
            </div>

            <div style={{
              width: '220px', height: '220px', margin: '0 auto 20px',
              background: 'var(--powder)', borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {imgSrc ? (
                <img src={imgSrc} alt="QR Code de check-in" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--mist)' }}>Gerando...</div>
              )}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '20px', wordBreak: 'break-all' }}>
              {checkinUrl}
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                width: '100%', padding: '11px',
                background: '#fff', color: 'var(--mist)',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
