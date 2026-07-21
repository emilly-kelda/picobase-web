'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { normalizeStudentName } from '@/lib/text'
import StudentPackageHistoryModal from '@/components/StudentPackageHistoryModal'
import CheckinQRButton from '@/components/CheckinQRButton'
import SellPackageFlowModal, { type PackageOption } from '@/components/SellPackageFlowModal'
import ScheduleFromCheckinModal from '@/components/ScheduleFromCheckinModal'
import { translateModalityName } from '@/lib/modality'
import Badge from '@/components/ui/Badge'
import ChameleonButton from '@/components/ui/ChameleonButton'
import PackageProgressBar from '@/components/PackageProgressBar'
import type { Stage } from '@/lib/stage'

type ActivityRef = {
  id: string
  name: string
  default_price: number
  default_duration_min: number
}

type Checkin = {
  id: string
  student_name: string
  student_nationality: string | null
  student_email: string | null
  student_whatsapp: string | null
  document_number: string | null
  document_type: string | null
  health_condition: string | null
  emergency_name: string | null
  emergency_phone: string | null
  birthdate: string | null
  checkin_at: string
  activity_id: string | null
  instructor_id: string | null
  is_minor: boolean | null
  guardian_name: string | null
  source: string | null
  partner_id: string | null
  stage: Stage | null
  checked_in: boolean
  waiver_signed_at: string | null
  activities: ActivityRef | null
  instructor: { id: string; name: string } | { id: string; name: string }[] | null
  partner: { id: string; name: string; type: string } | { id: string; name: string; type: string }[] | null
  scheduled_lesson: {
    id: string
    scheduled_at: string
    duration_min: number | null
    level: string | null
    activities: ActivityRef | null
    instructor: { id: string; name: string } | { id: string; name: string }[] | null
  } | null
}

type Instructor = {
  id: string
  name: string
  commission_pct: number | null
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza',
  })
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function unwrapInstructor(raw: Checkin['instructor']): { id: string; name: string } | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function fmtMinutes(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

function fmtRelative(iso: string, t: Record<string, string>) {
  const minutesAgo = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutesAgo < 1) return t.just_now_label
  if (minutesAgo < 60) return `${minutesAgo}${t.minutes_ago_suffix}`
  const hoursAgo = Math.floor(minutesAgo / 60)
  return `${hoursAgo}${t.hours_ago_suffix}`
}

function fmtBirthdate(iso: string | null) {
  if (!iso) return null
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PendingLessons({
  checkins: initialCheckins,
  instructors,
  activities = [],
  packageBalances = {},
  packageTypes = [],
  schoolSlug,
  schoolName,
  hoursMap,
  t,
  lang = 'pt',
}: {
  checkins: Checkin[]
  instructors: Instructor[]
  activities?: ActivityRef[]
  packageBalances?: Record<string, { minutesRemaining: number; minutesPurchased?: number; hasPackage: boolean; packageSaleId?: string; packageSport?: string | null }>
  packageTypes?: PackageOption[]
  schoolSlug: string
  schoolName: string
  hoursMap?: Map<string, number>
  t: Record<string, string>
  lang?: 'en' | 'pt'
}) {
  const router = useRouter()
  const [checkins, setCheckins]         = useState(initialCheckins)

  // checkins starts as a copy of the server prop (list rows get removed
  // locally as each gets confirmed, without waiting on a full refresh).
  // A background AutoRefresh (router.refresh()) delivers fresh
  // initialCheckins as a new prop, but that copy-once pattern means
  // nothing re-reads it unless told to — this keeps the list honest.
  useEffect(() => { setCheckins(initialCheckins) }, [initialCheckins])
  const [historyModal, setHistoryModal] = useState<{ studentName: string; packageSaleId: string } | null>(null)
  const [fichaModal, setFichaModal]     = useState<Checkin | null>(null)
  const [sellModal, setSellModal]       = useState<Checkin | null>(null)
  const [scheduleModal, setScheduleModal] = useState<Checkin | null>(null)

  // ChameleonButton's onCheckIn — desk confirms this student is physically
  // present, independent of stage/hasCredit (see checkedIn gate added to
  // ChameleonButton). Optimistic same as sendToWater below.
  async function checkIn(checkin: Checkin) {
    setCheckins(prev => prev.map(c => c.id === checkin.id ? { ...c, checked_in: true } : c))
    try {
      await fetch('/api/owner/checkin-stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkin.id, checked_in: true }),
      })
    } catch {}
  }

  // ChameleonButton's onSendToWater (picobase_chameleon_button_dossie.md
  // Fase 3/4): sala_de_espera -> na_agua. Optimistic — the row's button
  // flips to muted "Na água" text immediately; the PATCH just persists it.
  async function sendToWater(checkin: Checkin) {
    setCheckins(prev => prev.map(c => c.id === checkin.id ? { ...c, stage: 'na_agua' } : c))
    try {
      await fetch('/api/owner/checkin-stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkin.id, stage: 'na_agua' }),
      })
    } catch {}
  }

  return (
    <>
      <div style={{ marginBottom: '28px' }}>

        {/* Header (and its QR button) always renders, even with an empty
            Aguardando Vento — that's exactly when reception hands a new
            arrival the QR code, so it can't be gated behind checkins.length. */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {t.waiting_room_title}
            <span style={{
              background: 'var(--signal)',
              color: '#fff',
              fontSize: '10px', fontWeight: '600',
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0',
              textTransform: 'none',
            }}>
              {checkins.length}
            </span>
          </div>
        </div>

        {checkins.length === 0 ? (
          <div style={{
            background: '#fff',
            border: '0.5px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'center',
            fontSize: '13px', color: 'var(--mist)',
          }}>
            {t.no_checkins_waiting}
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {checkins.map(checkin => {
            const instructor = unwrapInstructor(checkin.instructor)
            const balanceKey = normalizeStudentName(checkin.student_name)
            const balance    = packageBalances[balanceKey]
            const exhausted  = balance?.hasPackage && balance.minutesRemaining <= 0
            const lastLesson = balance?.hasPackage && balance.minutesRemaining > 0 && balance.minutesRemaining <= 60

            // Fallback when this checkin's own activity_id is null but the
            // student has an active package for a specific sport — mainly
            // covers checkins already broken before ensureActiveCheckinFor
            // Today started backfilling activity_id at creation time (see
            // scheduledLessonRepository.ts). Same normalize+startsWith
            // match as lib/modality.ts.
            const fallbackActivityId = (!checkin.activity_id && balance?.packageSport)
              ? activities.find(a => {
                  const n = a.name.toLowerCase().replace(/[^a-z]/g, '')
                  const s = balance.packageSport!.toLowerCase().replace(/[^a-z]/g, '')
                  return n.startsWith(s)
                })?.id ?? null
              : null
            // Raw/untranslated either way (checkin.activities.name or the
            // package's sport key) — translateModalityName is applied once
            // at each render site below, same as before this fallback existed.
            const displayActivityName = checkin.activities?.name ?? balance?.packageSport ?? null

            // Card layout follows picobase_design_system_dossie.md Fase 4's
            // Aguardando Vento spec. Per
            // fix_checkin_removido_e_estagio_errado.md, the button row
            // (ChameleonButton + Agendar aula + Ver ficha) sits below the
            // badge row, full card width — NOT in the avatar row's
            // top-right corner (that placement hid Check-in and read as
            // "Iniciar Velejo" in the wrong spot).
            const hasCredit = !!balance?.hasPackage && !exhausted
            const creditBadgeText = lastLesson
              ? `${t.package_last_lesson_badge} · ${fmtMinutes(balance?.minutesRemaining ?? 0)} ${t.package_remaining_singular}`
              : `${fmtMinutes(balance?.minutesRemaining ?? 0)} ${t.package_remaining_badge}`

            return (
              <div
                key={checkin.id}
                style={{
                  background: '#fff',
                  // #E4E2DB (pb-border), not --border (#E6E5E2) — exact hex
                  // from the approved mockup, a subtly different gray.
                  border: checkin.health_condition ? '0.5px solid var(--signal)' : '0.5px solid var(--color-pb-border)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                {/* Avatar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: 'var(--radius-full)',
                    // Avatar color reflects health-condition alert first,
                    // then hasCredit — a student with no active package
                    // gets the neutral powder/slate pair, not the
                    // "termo assinado" green (that color means status, not
                    // decoration, per the approved mockup).
                    background: checkin.health_condition ? 'var(--signal-light)' : hasCredit ? 'var(--color-pb-glacial-light)' : 'var(--color-pb-powder)',
                    color: checkin.health_condition ? 'var(--signal-dark)' : hasCredit ? 'var(--color-pb-glacial-dark)' : 'var(--color-pb-slate)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '500',
                    flexShrink: 0,
                  }}
                    title={checkin.student_nationality ?? undefined}
                  >
                    {getInitials(checkin.student_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: '500',
                      // pb-slate (#1A1C22), not the older --slate (#0D0F14)
                      // — exact hex from the approved mockup.
                      color: 'var(--color-pb-slate)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {checkin.student_name}
                      </span>
                      {checkin.is_minor && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '1px 6px', borderRadius: 'var(--radius-md)',
                          background: '#FFFBEB', color: '#B45309',
                          fontSize: '10px', fontWeight: '600', flexShrink: 0,
                        }}>
                          {t.minor_badge}
                        </span>
                      )}
                      {checkin.health_condition && (
                        <span style={{
                          fontSize: '9px', fontWeight: '500',
                          color: 'var(--signal-dark)', background: 'var(--signal-light)',
                          padding: '1px 6px', borderRadius: 'var(--radius-full)', flexShrink: 0,
                        }}>
                          {t.health_label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-pb-mist)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayActivityName ? translateModalityName(displayActivityName, lang) : t.no_activity_label}
                      {' · '}
                      {instructor?.name ?? t.no_instructor_label}
                      {' · '}
                      <span title={fmtTime(checkin.checkin_at)}>{fmtRelative(checkin.checkin_at, t)}</span>
                    </div>
                  </div>
                  {/* All card actions live here now, top-right, next to
                      the avatar/name — not a separate full-width bar
                      below the badges. ChameleonButton's own compact
                      Check-in state was retired (see ChameleonButton.tsx)
                      since it duplicated this row's own Check-in chip once
                      that chip was promoted out of Ver ficha; the chip now
                      does both jobs (open the QR AND mark checked_in). */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <ChameleonButton
                      stage={checkin.stage ?? 'sala_de_espera'}
                      checkedIn={checkin.checked_in}
                      hasCredit={hasCredit}
                      slug={schoolSlug}
                      schoolName={schoolName}
                      studentName={checkin.student_name}
                      activityName={displayActivityName}
                      onCheckIn={() => checkIn(checkin)}
                      onSendToWater={() => sendToWater(checkin)}
                      onSellPackage={() => setSellModal(checkin)}
                      lang={lang}
                      className=""
                    />
                    {/* Byte-for-byte the same recipe as Reagendar
                        (MissedLessons.tsx) — var(--glacial-light)/
                        var(--glacial-dark), not an approximated zinc-*
                        Tailwind class. */}
                    <button
                      onClick={() => setScheduleModal({ ...checkin, activity_id: checkin.activity_id ?? fallbackActivityId })}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--glacial-light)',
                        color: 'var(--glacial-dark)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '10px', fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        transition: 'background-color 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--glacial)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--glacial-light)'; e.currentTarget.style.color = 'var(--glacial-dark)' }}
                    >
                      {t.schedule_lesson_btn}
                    </button>
                    {/* Always-available "show QR again" trigger — also
                        the only Check-in trigger now (see comment above);
                        onOpen still marks checked_in the same way
                        ChameleonButton's retired compact state used to. */}
                    <CheckinQRButton
                      slug={schoolSlug}
                      schoolName={schoolName}
                      studentName={checkin.student_name}
                      activityName={displayActivityName}
                      onOpen={() => checkIn(checkin)}
                      chip
                    />
                    <button
                      onClick={() => setFichaModal(checkin)}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--glacial-light)',
                        color: 'var(--glacial-dark)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '10px', fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        transition: 'background-color 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--glacial)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--glacial-light)'; e.currentTarget.style.color = 'var(--glacial-dark)' }}
                    >
                      {t.view_ficha_full_btn}
                    </button>
                  </div>
                </div>

                {/* Badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {checkin.waiver_signed_at ? (
                    <Badge variant="success">✓ {t.waiver_signed_badge}</Badge>
                  ) : (
                    <Badge variant="danger">{t.waiver_pending_badge}</Badge>
                  )}
                  {hasCredit ? (
                    balance?.packageSaleId ? (
                      <button
                        type="button"
                        onClick={() => setHistoryModal({
                          studentName: checkin.student_name,
                          packageSaleId: balance.packageSaleId!,
                        })}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'opacity 0.15s', lineHeight: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                        title={t.view_package_history_title}
                      >
                        <Badge variant="neutral">{creditBadgeText}</Badge>
                      </button>
                    ) : (
                      <Badge variant="neutral">{creditBadgeText}</Badge>
                    )
                  ) : (
                    <Badge variant="danger">{t.no_credits_badge}</Badge>
                  )}
                </div>

                {/* Graphical complement to the "Xh restantes" badge above —
                    the text stays as the precise reading, this just adds an
                    at-a-glance visual for hours consumed vs. total. */}
                {hasCredit && balance?.minutesPurchased ? (
                  <div style={{ marginBottom: '4px' }}>
                    <PackageProgressBar
                      pctUsed={((balance.minutesPurchased - balance.minutesRemaining) / balance.minutesPurchased) * 100}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        )}
      </div>

      {historyModal && (
        <StudentPackageHistoryModal
          studentName={historyModal.studentName}
          packageSaleId={historyModal.packageSaleId}
          onClose={() => setHistoryModal(null)}
        />
      )}

      {sellModal && (
        <SellPackageFlowModal
          packageTypes={packageTypes}
          initialStudentName={sellModal.student_name}
          onClose={() => setSellModal(null)}
          onSold={() => { setSellModal(null); router.refresh() }}
        />
      )}

      {scheduleModal && (
        <ScheduleFromCheckinModal
          checkinId={scheduleModal.id}
          studentName={scheduleModal.student_name}
          activities={activities}
          instructors={instructors}
          initialActivityId={scheduleModal.activity_id}
          initialInstructorId={scheduleModal.instructor_id}
          lang={lang}
          onClose={() => setScheduleModal(null)}
          onScheduled={() => { setScheduleModal(null); router.refresh() }}
        />
      )}

      {fichaModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setFichaModal(null) }}
        >
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '440px',
            padding: '28px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '2px' }}>
                  {fichaModal.student_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                  Check-in {fmtTime(fichaModal.checkin_at)} · {fmtRelative(fichaModal.checkin_at, t)}
                </div>
              </div>
              <button
                onClick={() => setFichaModal(null)}
                style={{
                  background: 'var(--powder)', border: 'none', borderRadius: '99px',
                  width: '30px', height: '30px', cursor: 'pointer',
                  fontSize: '14px', color: 'var(--mist)', flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: '500',
                color: fichaModal.waiver_signed_at ? 'var(--color-pb-glacial-dark)' : 'var(--signal-dark)',
                background: fichaModal.waiver_signed_at ? 'var(--color-pb-glacial-light)' : 'var(--signal-light)',
                padding: '4px 10px', borderRadius: 'var(--radius-full)',
              }}>
                {fichaModal.waiver_signed_at ? '✓ Termo de Responsabilidade Assinado' : 'Termo de Responsabilidade Pendente'}
              </div>
              {/* Moved here from the compact card's button row when that
                  row became [ChameleonButton][⋮] only
                  (picobase_chameleon_button_dossie.md Fase 4) — this is a
                  less time-critical, per-student utility (re-showing the
                  waiver/check-in link, e.g. for a companion), not something
                  that needs to compete for the card's button budget. */}
              <CheckinQRButton
                slug={schoolSlug}
                schoolName={schoolName}
                studentName={fichaModal.student_name}
                activityName={fichaModal.activities?.name}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Nacionalidade', value: fichaModal.student_nationality },
                {
                  label: fichaModal.document_type === 'cpf' ? 'CPF' : fichaModal.document_type === 'passport' ? 'Passaporte' : 'Documento',
                  value: fichaModal.document_number,
                },
                { label: 'Data de nascimento', value: fmtBirthdate(fichaModal.birthdate) },
                { label: 'Email', value: fichaModal.student_email },
                { label: 'WhatsApp', value: fichaModal.student_whatsapp },
                { label: 'Contato de emergência', value: fichaModal.emergency_name },
                { label: 'Telefone de emergência', value: fichaModal.emergency_phone },
                { label: 'Condições de saúde', value: fichaModal.health_condition },
                { label: 'Responsável (menor de idade)', value: fichaModal.is_minor ? (fichaModal.guardian_name ?? '—') : null },
                { label: 'Origem', value: fichaModal.source },
              ].filter(row => row.value).map(row => (
                <div key={row.label}>
                  <div style={{
                    fontSize: '10px', fontWeight: '500', letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '3px',
                  }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--slate)' }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setFichaModal(null)}
              style={{
                width: '100%', marginTop: '24px', padding: '11px',
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
