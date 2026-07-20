'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

/** Trigger for the receptionist's counter: opens a QR (same /api/owner/qr
 *  endpoint) right where the walk-in student is being handled — Sala de
 *  Espera. Two shapes: the default pill (school-wide QR, no student
 *  attached) and `compact` (a small icon-only trigger meant to sit inside a
 *  single checkin card's action row) — passing studentName/activityName
 *  makes the generated QR point at that specific student's checkin URL
 *  (?student=&activity=, the same query params CheckinForm.tsx already
 *  reads to pre-fill/lock its form — see checkin/[school]/page.tsx), so
 *  scanning it drops them straight into a form that already knows who they
 *  are instead of a blank one. */
export default function CheckinQRButton({
  slug,
  schoolName,
  studentName,
  activityName,
  compact = false,
  className,
}: {
  slug: string
  schoolName: string
  studentName?: string
  activityName?: string | null
  compact?: boolean
  className?: string
}) {
  const [open, setOpen]       = useState(false)
  const [imgSrc, setImgSrc]   = useState<string | null>(null)
  const [origin, setOrigin]   = useState('')

  const qrParams = new URLSearchParams({ format: 'png' })
  if (studentName) qrParams.set('student', studentName)
  if (activityName) qrParams.set('activity', activityName)

  useEffect(() => {
    if (!open) return
    setOrigin(window.location.origin)
    fetch(`/api/owner/qr?${qrParams.toString()}`)
      .then(r => r.blob())
      .then(blob => setImgSrc(URL.createObjectURL(blob)))
    // Re-fetch whenever the target student changes, unlike the school-wide
    // QR (fixed URL, safe to cache once per open).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentName, activityName])

  const linkParams = new URLSearchParams()
  if (studentName) linkParams.set('student', studentName)
  if (activityName) linkParams.set('activity', activityName)
  const query = linkParams.toString()
  const checkinUrl = `${origin || ''}/checkin/${slug}${query ? `?${query}` : ''}`

  return (
    <>
      {compact ? (
        // Fase 3 of picobase_design_system_dossie.md: the old icon-only
        // 📱 trigger read as "phone" — ambiguous with the student's own
        // device, not obviously "open the check-in QR". No icon library is
        // installed in this project (every icon in the app is an emoji
        // glyph), so 🔲 stands in for "QR code" — visually distinct from
        // the phone glyph it replaces — paired with an always-visible
        // "Check-in" label per the dossiê's explicit requirement.
        <Button
          type="button"
          variant="primary"
          onClick={() => setOpen(true)}
          title={studentName ? `QR Code de check-in — ${studentName}` : 'QR Code de check-in'}
          className={className}
        >
          🔲 Check-in
        </Button>
      ) : (
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
      )}

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
              {studentName ?? schoolName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '20px' }}>
              {studentName
                ? 'Peça para o cliente escanear — termo já vem com o nome preenchido'
                : 'Peça para o cliente escanear'}
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
