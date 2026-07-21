'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

/** Strips the protocol and ellipsizes long paths — a visual "shortened
 *  link" with no shortening service involved (none exists in this
 *  project); the href underneath is always the real, full URL. */
function shortenForDisplay(url: string, maxLen = 42): string {
  const stripped = url.replace(/^https?:\/\//, '')
  return stripped.length <= maxLen ? stripped : `${stripped.slice(0, maxLen - 1)}…`
}

/** Trigger for the receptionist's counter: opens a QR (same /api/owner/qr
 *  endpoint) right where the walk-in student is being handled — Sala de
 *  Espera. Three shapes: the default pill (school-wide QR, no student
 *  attached), `compact` (a small labeled trigger for a checkin card's
 *  action row), and `iconOnly` (bare glyph, no label — ChameleonButton's
 *  not-checked-in state). Passing studentName/activityName makes the
 *  generated QR point at that specific student's checkin URL
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
  iconOnly = false,
  onOpen,
  className,
}: {
  slug: string
  schoolName: string
  studentName?: string
  activityName?: string | null
  compact?: boolean
  // Tiny square glyph-only trigger — no text label at all — for contexts
  // too tight for even the compact pill (ChameleonButton's not-checked-in
  // state, restoring the QR/modal flow that used to be the primary action
  // there before it got replaced by a plain button).
  iconOnly?: boolean
  // Fires whenever the modal is opened, any trigger shape — lets a caller
  // (ChameleonButton) piggyback its own side effect (marking checked_in
  // true) on the same click without this component knowing anything about
  // that business logic.
  onOpen?: () => void
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
      {iconOnly ? (
        // Restored per the approved redesign: check-in's primary action in
        // Aguardando Vento goes back to a compact QR trigger instead of the
        // plain "Check-in" button ChameleonButton had — 36px square (avatar
        // height) so it sits naturally next to the card's other elements.
        <button
          type="button"
          onClick={() => { onOpen?.(); setOpen(true) }}
          title={studentName ? `QR Code de check-in — ${studentName}` : 'QR Code de check-in'}
          // rounded-[8px], not rounded-lg — globals.css/Tailwind
          // --radius-lg collision, see Button.tsx's comment.
          className={`inline-flex items-center justify-center rounded-[8px] bg-pb-glacial text-pb-white hover:opacity-90 ${className ?? ''}`}
          style={{ width: '36px', height: '36px', flexShrink: 0, border: 'none', cursor: 'pointer' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3M14 21h3M21 17.5V21" />
          </svg>
        </button>
      ) : compact ? (
        // Fase 3 of picobase_design_system_dossie.md: the old icon-only
        // 📱 trigger read as "phone" — ambiguous with the student's own
        // device, not obviously "open the check-in QR". No icon library is
        // installed in this project (every icon in the app is an emoji
        // glyph), so a plain "Check-in" text label — no icon — stands in
        // per the no-emoji pass; the dossiê's requirement was an
        // always-visible text label, which this still satisfies.
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => { onOpen?.(); setOpen(true) }}
          title={studentName ? `QR Code de check-in — ${studentName}` : 'QR Code de check-in'}
          className={className}
        >
          Check-in
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
            borderRadius: 'var(--radius-md)',
            fontSize: '11px', fontWeight: '500',
            color: 'var(--glacial-dark)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
          }}
        >
          Exibir QR Code de Check-in
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

            <div style={{ marginBottom: '20px' }}>
              <a
                href={checkinUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'var(--glacial-dark)', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                {shortenForDisplay(checkinUrl)}
              </a>
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
