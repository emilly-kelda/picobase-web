'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLevel, LEVEL_LABELS, type Level } from '@/lib/levels'
import { normalizeStudentName } from '@/lib/text'
import LevelPicker from '@/components/LevelPicker'
import StudentPackageHistoryModal from '@/components/StudentPackageHistoryModal'
import CheckinQRButton from '@/components/CheckinQRButton'
import SellPackageFlowModal, { type PackageOption } from '@/components/SellPackageFlowModal'
import ScheduleFromCheckinModal from '@/components/ScheduleFromCheckinModal'
import type { VariableCostInfo } from '@/lib/commission'
import { translateModalityName } from '@/lib/modality'
import Badge from '@/components/ui/Badge'
import ChameleonButton from '@/components/ui/ChameleonButton'
import OverflowMenu from '@/components/ui/OverflowMenu'
import type { Stage } from '@/lib/stage'

type ActivityRef = {
  id: string
  name: string
  default_price: number
  default_duration_min: number
}

type Currency = 'BRL' | 'EUR' | 'USD'

const CURRENCY_OPTIONS: Array<{ value: Currency; symbol: string; flag: string }> = [
  { value: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { value: 'EUR', symbol: '€',  flag: '🇪🇺' },
  { value: 'USD', symbol: '$',  flag: '🇺🇸' },
]

const CURRENCY_SYMBOL: Record<Currency, string> = { BRL: 'R$', EUR: '€', USD: '$' }

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

const DURATIONS = [
  { label: '1h',   value: 60  },
  { label: '1h30', value: 90  },
  { label: '2h',   value: 120 },
  { label: '3h',   value: 180 },
]

const SOURCE_ICON: Record<string, string> = {
  walk_in:   '🚶',
  whatsapp:  '💬',
  instagram: '📸',
  hotel:     '🏨',
  agencia:   '✈',
  outro:     '💡',
}

function fmt(n: number, currency: Currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n)
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

function fmtRelative(iso: string) {
  const minutesAgo = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutesAgo < 1) return 'agora mesmo'
  if (minutesAgo < 60) return `há ${minutesAgo}min`
  const hoursAgo = Math.floor(minutesAgo / 60)
  return `há ${hoursAgo}h`
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
  payoutModel = 'percentage',
  fixedPayoutValue = null,
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
  packageBalances?: Record<string, { minutesRemaining: number; hasPackage: boolean; packageSaleId?: string }>
  payoutModel?: string
  fixedPayoutValue?: number | null
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
  // The confirm modal's own fields (selected, activityId, price, etc.)
  // are separate state set once when it opens, not derived from
  // `checkins`, so a background sync here can't reset an open modal.
  useEffect(() => { setCheckins(initialCheckins) }, [initialCheckins])
  const [historyModal, setHistoryModal] = useState<{ studentName: string; packageSaleId: string } | null>(null)
  const [fichaModal, setFichaModal]     = useState<Checkin | null>(null)
  const [sellModal, setSellModal]       = useState<Checkin | null>(null)
  const [scheduleModal, setScheduleModal] = useState<Checkin | null>(null)
  const [selected, setSelected]         = useState<Checkin | null>(null)
  const [activityId, setActivityId]     = useState('')
  const [duration, setDuration]         = useState(60)
  const [useCustom, setUseCustom]       = useState(false)
  const [custom, setCustom]             = useState('')
  const [price, setPrice]               = useState(0)
  const [instructorId, setInstructorId] = useState('')
  const [notes, setNotes]               = useState('')
  const [showNotes, setShowNotes]       = useState(false)
  const [confirming, setConfirming]         = useState(false)
  const [confirmed, setConfirmed]           = useState<string | null>(null)
  // confirm-lesson can now reject the request (instructor/student clash,
  // insufficient package balance) — this used to only ever check data.ok
  // and otherwise do nothing, leaving the operator with no idea why
  // nothing happened when a submit failed.
  const [confirmError, setConfirmError]     = useState<string | null>(null)
  const [showProgression, setShowProgression] = useState(false)
  const [progLevel,        setProgLevel]      = useState('')
  const [progNotes,        setProgNotes]      = useState('')
  const [priceMode, setPriceMode]             = useState<'total' | 'per_hour'>('total')
  const [pricePerHour, setPricePerHour]       = useState(0)
  const [sessionDate, setSessionDate]         = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod]     = useState<'pix' | 'dinheiro' | 'cartao' | 'a_receber' | null>(null)
  const [level, setLevel]                     = useState<Level>('experimental')
  const [experimentalDisabled, setExperimentalDisabled] = useState(false)
  const [currency, setCurrency]               = useState<Currency>('BRL')
  const [variableCost, setVariableCost]       = useState<VariableCostInfo | null>(null)
  const [fxRates, setFxRates]                 = useState<{ USD: number; EUR: number } | null>(null)
  const [fxError, setFxError]                 = useState(false)
  const [fxLoading, setFxLoading]              = useState(false)
  const [fxSource, setFxSource]                = useState<'live' | 'stale-cache' | 'fallback' | null>(null)

  // Commissions are always paid in BRL, so the confirm modal needs today's
  // rate to show an accurate preview whenever a non-BRL currency is
  // selected. Re-fetched every time the modal opens (not just once on
  // mount) so the rate can't go stale across a long-open Base Camp tab —
  // one call covers both USD and EUR, so switching currency mid-modal
  // doesn't need a second fetch. The actual conversion is re-done
  // authoritatively server-side on confirm; this is display-only.
  //
  // The timestamp query param is a client-side cache-buster (belt and
  // suspenders — api/fx/route.ts now also sets dynamic='force-dynamic' and
  // Cache-Control: no-store, which was the actual bug: without those, the
  // route could serve the same cached response, including a cached
  // failure, on every request, making "Tentar novamente" look broken).
  function loadFxRates() {
    setFxError(false)
    setFxLoading(true)
    fetch(`/api/fx?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) { setFxRates(data.rates); setFxSource(data.source ?? 'live') }
        else setFxError(true)
      })
      .catch(() => setFxError(true))
      .finally(() => setFxLoading(false))
  }

  useEffect(() => {
    loadFxRates()
  }, [])

  function open(checkin: Checkin) {
    loadFxRates()
    const sched = checkin.scheduled_lesson
    const fallbackActivity = sched?.activities ?? checkin.activities
    const schedInstructor = unwrapInstructor(sched?.instructor ?? null)

    setSelected(checkin)
    setConfirmError(null)
    setActivityId(sched?.activities?.id ?? checkin.activity_id ?? '')
    setDuration(sched?.duration_min ?? fallbackActivity?.default_duration_min ?? 60)
    setPrice(fallbackActivity?.default_price ?? 0)
    setInstructorId(schedInstructor?.id ?? checkin.instructor_id ?? '')
    setUseCustom(false)
    setCustom('')
    setNotes('')
    setShowNotes(false)
    setShowProgression(false)
    setProgLevel('')
    setProgNotes('')
    setPriceMode('total')
    setPricePerHour(0)
    setSessionDate(new Date().toISOString().slice(0, 10))
    setPaymentMethod(null)
    setCurrency('BRL')
    setVariableCost(null)

    fetch(`/api/owner/package-variable-cost?student_name=${encodeURIComponent(checkin.student_name)}`)
      .then(r => r.json())
      .then(data => setVariableCost(data))
      .catch(() => {})

    if (isLevel(sched?.level)) {
      setLevel(sched!.level as Level)
    } else {
      setLevel('experimental')
    }
    setExperimentalDisabled(false)
  }

  function close() { setSelected(null) }

  // ChameleonButton's onSendToWater (picobase_chameleon_button_dossie.md
  // Fase 3/4): sala_de_espera -> na_agua. Optimistic — the row's button
  // flips to "Finalizar e cobrar" immediately; the PATCH just persists it.
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

  // Recompute the level default whenever the activity is known — fires on open()
  // and again if the owner manually switches Atividade in the modal. The level
  // carried from a matched agendamento stays authoritative only while the
  // activity hasn't been changed away from what was actually booked.
  useEffect(() => {
    if (!selected || !activityId) return
    const sched = selected.scheduled_lesson
    const bookedActivityId = sched?.activities?.id ?? selected.activity_id
    const keepScheduledLevel = isLevel(sched?.level) && activityId === bookedActivityId

    fetch(`/api/owner/default-level?student_name=${encodeURIComponent(selected.student_name)}&activity_id=${activityId}`)
      .then(r => r.json())
      .then(data => {
        if (!data?.level) return
        setExperimentalDisabled(!!data.experimentalDisabled)
        if (!keepScheduledLevel) setLevel(data.level)
      })
      .catch(() => {})
  }, [selected, activityId])

  const usesFixedPayout    = payoutModel === 'fixed'
  const selectedInstructor = instructors.find(i => i.id === instructorId)
  const commissionPct      = selectedInstructor?.commission_pct ?? 0.38
  const finalDuration      = useCustom ? parseInt(custom) || 0 : duration
  const totalPrice         = priceMode === 'per_hour'
    ? Math.round(pricePerHour * (finalDuration / 60))
    : price
  // Variable package costs (e.g. Downwind boat/fuel) reduce the commission
  // base only — the school still collects totalPrice in full.
  const costDeduction = variableCost?.hasVariableCost ? variableCost.variableCostAmount : 0
  const netRevenue    = Math.max(0, totalPrice - costDeduction)
  const cantConfirm = confirming || !instructorId || totalPrice <= 0 || finalDuration <= 0 || !paymentMethod

  // Commission preview, always in BRL — mirrors the server: convert the full
  // charged amount to BRL first, then subtract the (already-BRL) variable
  // cost, then apply the commission %. costDeduction must NOT be subtracted
  // before conversion — it's a BRL figure, mixing units with totalPrice when
  // currency isn't BRL.
  const fxRate           = currency === 'BRL' ? 1 : fxRates?.[currency] ?? null
  const totalPriceBRL    = fxRate != null ? totalPrice * fxRate : null
  const netRevenueBRL    = totalPriceBRL != null ? Math.max(0, totalPriceBRL - costDeduction) : null
  // Fixed payout is already BRL and duration/price-independent — no fx
  // conversion applies to it, unlike the percentage path (which needs
  // netRevenueBRL, hence waits on the fx rate fetch same as before).
  const commissionBRL    = usesFixedPayout
    ? (fixedPayoutValue ?? 0)
    : (netRevenueBRL != null ? netRevenueBRL * commissionPct : null)

  async function confirm() {
    if (!selected || !instructorId) return
    setConfirming(true)
    setConfirmError(null)

    const res = await fetch('/api/owner/confirm-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkin_id:     selected.id,
        instructor_id:  instructorId,
        activity_id:    activityId || null,
        duration_min:   finalDuration,
        price:          totalPrice,
        price_original: totalPrice,
        currency,
        notes,
        commission_pct: commissionPct,
        session_date:   sessionDate,
        payment_method: paymentMethod,
        level,
      }),
    })

    const data = await res.json()
    setConfirming(false)

    if (data.ok) {
      setConfirmed(selected.student_name)
      setCheckins(prev => prev.filter(c => c.id !== selected.id))
      setSelected(null)
      setTimeout(() => {
        setConfirmed(null)
        router.refresh()
      }, 2000)
    } else {
      setConfirmError(data.error ?? 'Erro ao confirmar aula')
    }
  }

  return (
    <>
      <div style={{ marginBottom: '28px' }}>

        {/* Header (and its QR button) always renders, even with an empty
            waiting room — that's exactly when reception hands a new
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

        {confirmed && (
          <div style={{
            background: 'var(--glacial-light)',
            border: '0.5px solid var(--glacial)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px', fontWeight: '500',
            color: 'var(--glacial-dark)',
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '12px',
          }}>
            <span>✓</span>
            <span>{t.lesson_confirmed_for} {confirmed}</span>
          </div>
        )}

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

            // Card layout follows picobase_design_system_dossie.md Fase 4's
            // exact Sala de Espera spec: avatar row (10px to badges) →
            // badge row (12px to buttons) → button row (8px between
            // buttons), 16px card padding throughout. The 4-tier package
            // badge (never-bought vs exhausted vs last-lesson vs healthy)
            // collapses into the spec's 2 outcomes — success "Termo
            // assinado" plus either a neutral "Xh restantes" or a danger
            // "Sem créditos" — losing the never-bought/exhausted distinction
            // in this compact view specifically (still resolvable via "Ver
            // ficha"). Health-condition and minor-student flags are kept
            // (real safety data, not a style choice the dossiê spoke to);
            // so is the activity name in the subtitle, alongside the
            // instructor/time-ago the spec calls for literally.
            //
            // The old scheduled-lesson "Confirmar →" shortcut has no slot
            // in the spec's fixed 2-3 button row and is dropped from this
            // card — Aulas Agendadas already has an equivalent "Confirmar
            // Aula" primary now (this same session's work). Its inline
            // confirm-modal state (open(), selected, activityId... below)
            // is intentionally left in place rather than torn out as a
            // side effect of a layout change; picobase_chameleon_button_
            // dossie.md's Fase 2 overflow menu is a natural place to
            // resurface it later if still wanted.
            const hasCredit = !!balance?.hasPackage && !exhausted
            const creditBadgeText = lastLesson
              ? `${t.package_last_lesson_badge} · ${fmtMinutes(balance?.minutesRemaining ?? 0)} ${t.package_remaining_singular}`
              : `${fmtMinutes(balance?.minutesRemaining ?? 0)} ${t.package_remaining_badge}`

            return (
              <div
                key={checkin.id}
                style={{
                  background: '#fff',
                  border: checkin.health_condition ? '0.5px solid var(--signal)' : '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                {/* Avatar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: 'var(--radius-full)',
                    background: checkin.health_condition ? 'var(--signal-light)' : 'var(--color-pb-glacial-light)',
                    color: checkin.health_condition ? 'var(--signal-dark)' : 'var(--color-pb-glacial-dark)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '500',
                    flexShrink: 0,
                  }}
                    title={checkin.student_nationality ?? undefined}
                  >
                    {getInitials(checkin.student_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: '500',
                      color: 'var(--slate)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {checkin.student_name}
                      </span>
                      {(hoursMap?.get(checkin.student_name) ?? 0) >= 10 * 60 && (
                        <span title={t.medal_tooltip} style={{ fontSize: '12px' }}>🏅</span>
                      )}
                      {checkin.source && (
                        <span title={checkin.source} style={{ fontSize: '12px' }}>{SOURCE_ICON[checkin.source] ?? ''}</span>
                      )}
                      {checkin.is_minor && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '1px 6px', borderRadius: 'var(--radius-full)',
                          background: '#FEF3C7', color: '#92400E',
                          fontSize: '10px', fontWeight: '600', flexShrink: 0,
                        }}>
                          ⚠ {t.minor_badge}
                        </span>
                      )}
                      {checkin.health_condition && (
                        <span style={{
                          fontSize: '9px', fontWeight: '500',
                          color: 'var(--signal-dark)', background: 'var(--signal-light)',
                          padding: '1px 6px', borderRadius: 'var(--radius-full)', flexShrink: 0,
                        }}>
                          ⚠ {t.health_label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {checkin.activities?.name ? translateModalityName(checkin.activities.name, lang) : t.no_activity_label}
                      {' · '}
                      {instructor?.name ?? t.no_instructor_label}
                      {' · '}
                      <span title={fmtTime(checkin.checkin_at)}>{fmtRelative(checkin.checkin_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <Badge variant="success">✓ {t.waiver_signed_badge}</Badge>
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
                    <Badge variant="danger">⚠ {t.no_credits_badge}</Badge>
                  )}
                </div>

                {/* Button row — picobase_chameleon_button_dossie.md Fase 4:
                    [ChameleonButton] [⋮ OverflowMenu], replacing the
                    Check-in/Agendar aula/Vender pacote/Ver ficha row Fase 4
                    of the design-system dossiê had just built. 'checkout'
                    is derived, not stored — true only while this exact
                    checkin's confirm modal (selected) is open. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChameleonButton
                    stage={selected?.id === checkin.id ? 'checkout' : (checkin.stage ?? 'sala_de_espera')}
                    hasCredit={hasCredit}
                    onSendToWater={() => sendToWater(checkin)}
                    onFinishAndCharge={() => open(checkin)}
                    onSellPackage={() => setSellModal(checkin)}
                  />
                  <OverflowMenu items={[
                    { label: t.view_ficha_full_btn, onClick: () => setFichaModal(checkin) },
                    { label: t.schedule_lesson_btn, onClick: () => setScheduleModal(checkin) },
                  ]} />
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>

      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '480px',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>

            {selected.health_condition && (
              <div style={{
                background: 'var(--signal-light)',
                border: '0.5px solid var(--signal)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex', gap: '10px',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{
                    fontSize: '12px', fontWeight: '600',
                    color: 'var(--signal-dark)', marginBottom: '2px',
                  }}>
                    Alerta médico
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--signal-dark)' }}>
                    {selected.health_condition}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '18px', fontWeight: '500',
                color: 'var(--slate)', marginBottom: '4px',
              }}>
                {selected.student_name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
                Check-in às {fmtTime(selected.checkin_at)}
                {selected.activities?.name && ` · ${selected.activities.name}`}
              </div>
              {selected.scheduled_lesson && (
                <div style={{
                  marginTop: '8px', padding: '8px 12px',
                  background: 'var(--glacial-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px', color: 'var(--glacial-dark)',
                }}>
                  📅 Aula agendada para {fmtTime(selected.scheduled_lesson.scheduled_at)} — confirmação pré-preenchida a partir do agendamento.
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '8px',
              }}>
                Atividade
              </div>
              <select
                value={activityId}
                onChange={e => setActivityId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', color: 'var(--slate)',
                  background: '#fff', fontFamily: 'var(--font-sans)',
                  outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Selecionar atividade</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {activityId && (
              <div style={{ marginBottom: '20px' }}>
                <LevelPicker
                  value={level}
                  experimentalDisabled={experimentalDisabled}
                  onChange={setLevel}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '8px',
              }}>
                Instrutor
              </div>
              <select
                value={instructorId}
                onChange={e => setInstructorId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', color: 'var(--slate)',
                  background: '#fff', fontFamily: 'var(--font-sans)',
                  outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Selecionar instrutor</option>
                {instructors.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} · {Math.round((i.commission_pct ?? 0) * 100)}%
                  </option>
                ))}
              </select>
              {selected?.instructor_id && selected.instructor_id === instructorId && (
                <div style={{
                  fontSize: '11px',
                  color: 'var(--glacial-dark)',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span>✓</span>
                  <span>Selecionado pelo aluno no check-in</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '8px',
              }}>
                Data da aula
              </div>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                style={{
                  padding: '9px 12px',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', color: 'var(--slate)',
                  fontFamily: 'var(--font-sans)', outline: 'none',
                  background: '#fff', cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
                Altere se a aula foi em outro dia
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '8px',
              }}>
                Duração
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => { setDuration(d.value); setUseCustom(false) }}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${!useCustom && duration === d.value ? 'var(--glacial)' : 'var(--border)'}`,
                      background: !useCustom && duration === d.value ? 'var(--glacial-light)' : '#fff',
                      color: !useCustom && duration === d.value ? 'var(--glacial-dark)' : 'var(--slate)',
                      fontSize: '14px', fontWeight: '500',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
                <button
                  onClick={() => setUseCustom(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${useCustom ? 'var(--glacial)' : 'var(--border)'}`,
                    background: useCustom ? 'var(--glacial-light)' : '#fff',
                    color: useCustom ? 'var(--glacial-dark)' : 'var(--slate)',
                    fontSize: '14px', fontWeight: '500',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  Outro
                </button>
              </div>
              {useCustom && (
                <input
                  type="number"
                  placeholder="Minutos"
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  style={{
                    marginTop: '8px', width: '120px',
                    padding: '9px 14px',
                    border: '0.5px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '15px', color: 'var(--slate)',
                    fontFamily: 'var(--font-sans)', outline: 'none',
                  }}
                />
              )}
            </div>

            {/* Currency selector */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '8px',
              }}>
                Moeda cobrada
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {CURRENCY_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCurrency(c.value)}
                    style={{
                      flex: 1, padding: '8px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${currency === c.value ? 'var(--glacial)' : 'var(--border)'}`,
                      background: currency === c.value ? 'var(--glacial-light)' : '#fff',
                      color: currency === c.value ? 'var(--glacial-dark)' : 'var(--mist)',
                      fontSize: '13px',
                      fontWeight: currency === c.value ? '600' : '400',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '8px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>
                  Valor cobrado ({CURRENCY_SYMBOL[currency]})
                </span>
                <div style={{
                  display: 'flex', gap: '2px',
                  background: 'var(--powder)',
                  borderRadius: 'var(--radius-md)', padding: '2px',
                }}>
                  {[
                    { key: 'total',    label: 'Total'  },
                    { key: 'per_hour', label: '/hora'  },
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setPriceMode(m.key as 'total' | 'per_hour')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '5px',
                        border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '11px', fontWeight: '500',
                        background: priceMode === m.key ? '#fff' : 'transparent',
                        color: priceMode === m.key ? 'var(--slate)' : 'var(--mist)',
                        boxShadow: priceMode === m.key
                          ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {priceMode === 'total' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    style={{
                      width: '140px', padding: '10px 14px',
                      border: '0.5px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '20px', fontWeight: '600',
                      color: 'var(--slate)', fontFamily: 'var(--font-sans)',
                      outline: 'none',
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="number"
                      value={pricePerHour}
                      onChange={e => setPricePerHour(Number(e.target.value))}
                      placeholder="R$/hora"
                      style={{
                        width: '140px', padding: '10px 14px',
                        border: '0.5px solid var(--border-strong)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '20px', fontWeight: '600',
                        color: 'var(--slate)', fontFamily: 'var(--font-sans)',
                        outline: 'none',
                      }}
                    />
                    <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
                      / hora
                    </div>
                  </div>
                  {pricePerHour > 0 && finalDuration > 0 && (
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--glacial-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px', color: 'var(--glacial-dark)',
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span>{pricePerHour}/h × {(finalDuration/60).toFixed(1)}h</span>
                      <span style={{ fontWeight: '600' }}>
                        = {new Intl.NumberFormat('pt-BR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPrice)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {currency !== 'BRL' && totalPrice > 0 && (
                <div style={{
                  fontSize: '12px', marginTop: '8px',
                  color: fxSource === 'fallback' ? '#92400E' : 'var(--mist)',
                }}>
                  {totalPriceBRL != null && fxSource === 'fallback' ? (
                    `Convertido: ${fmt(totalPriceBRL, 'BRL')} — usando taxa padrão da escola devido à instabilidade de rede`
                  ) : totalPriceBRL != null ? (
                    `Convertido: ${fmt(totalPriceBRL, 'BRL')} (Cotação: 1 ${currency} = ${fmt(fxRate ?? 0, 'BRL')})`
                  ) : fxError ? (
                    <>
                      Taxa de câmbio indisponível.{' '}
                      <button
                        type="button"
                        onClick={loadFxRates}
                        disabled={fxLoading}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          color: 'var(--glacial-dark)', textDecoration: 'underline',
                          cursor: fxLoading ? 'not-allowed' : 'pointer', fontSize: '12px',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {fxLoading ? 'Tentando...' : 'Tentar novamente'}
                      </button>
                    </>
                  ) : (
                    'Buscando taxa de câmbio…'
                  )}
                </div>
              )}

              {costDeduction > 0 && (
                <div style={{
                  background: 'var(--powder)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginTop: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: '600',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--mist)',
                  }}>
                    Custo variável
                    {' · '}
                    {variableCost?.variableCostMode === 'per_trip' ? 'por trip' : 'por aluno'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--mist)' }}>
                      {variableCost?.variableCostName ?? 'Custo'}
                    </span>
                    <span style={{ color: '#DC2626', fontWeight: '500' }}>
                      − {fmt(costDeduction, currency)}
                    </span>
                  </div>
                  <div style={{ height: '0.5px', background: 'var(--border)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--mist)' }}>
                      Base para comissão
                    </span>
                    <span style={{
                      fontWeight: '600', color: 'var(--slate)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {fmt(netRevenue, currency)}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ fontSize: '13px', color: 'var(--mist)', marginTop: '4px' }}>
                {usesFixedPayout
                  ? `→ repasse do instrutor ${fmt(commissionBRL ?? 0, 'BRL')} (fixo)`
                  : `→ comissão ${commissionBRL != null ? fmt(commissionBRL, 'BRL') : '—'}`}
              </div>
            </div>

            {!showNotes ? (
              <button
                onClick={() => setShowNotes(true)}
                style={{
                  background: 'transparent', border: 'none',
                  fontSize: '13px', color: 'var(--mist)',
                  cursor: 'pointer', padding: '0',
                  fontFamily: 'var(--font-sans)',
                  marginBottom: '24px',
                  textDecoration: 'underline',
                  textDecorationColor: 'var(--border)',
                }}
              >
                + Adicionar observação
              </button>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observações sobre a aula..."
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '0.5px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px', color: 'var(--slate)',
                    fontFamily: 'var(--font-sans)', outline: 'none',
                    minHeight: '72px', resize: 'vertical' as const,
                    boxSizing: 'border-box' as const,
                  }}
                />
              </div>
            )}

            {/* Progression section */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowProgression(!showProgression)}
                style={{
                  background: 'transparent', border: 'none',
                  fontSize: '13px', color: 'var(--mist)',
                  cursor: 'pointer', padding: '0',
                  fontFamily: 'var(--font-sans)',
                  textDecoration: 'underline',
                  textDecorationColor: 'var(--border)',
                }}
              >
                {showProgression ? '− Ocultar progressão' : '+ Atualizar progressão do aluno'}
              </button>

              {showProgression && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    fontSize: '11px', fontWeight: '500',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--mist)', marginBottom: '8px',
                  }}>
                    Nível após esta aula
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    {[
                      { key: 'beginner',     label: 'Iniciante'    },
                      { key: 'intermediate', label: 'Intermediário' },
                      { key: 'advanced',     label: 'Avançado'     },
                    ].map(l => (
                      <button
                        key={l.key}
                        onClick={() => setProgLevel(l.key)}
                        style={{
                          flex: 1, padding: '8px',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${progLevel === l.key ? 'var(--glacial)' : 'var(--border)'}`,
                          background: progLevel === l.key ? 'var(--glacial-light)' : '#fff',
                          color: progLevel === l.key ? 'var(--glacial-dark)' : 'var(--mist)',
                          fontSize: '12px', fontWeight: '500',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={progNotes}
                    onChange={e => setProgNotes(e.target.value)}
                    placeholder="Observações sobre a progressão..."
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: '0.5px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px', color: 'var(--slate)',
                      fontFamily: 'var(--font-sans)', outline: 'none',
                      minHeight: '60px', resize: 'vertical' as const,
                      boxSizing: 'border-box' as const,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '10px',
              }}>
                Forma de pagamento *
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {([
                  { value: 'pix',       label: 'PIX',        icon: '⚡' },
                  { value: 'dinheiro',  label: 'Dinheiro',   icon: '💵' },
                  { value: 'cartao',    label: 'Cartão',     icon: '💳' },
                  { value: 'a_receber', label: 'A receber',  icon: '⏳' },
                ] as const).map(opt => {
                  const active = paymentMethod === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${active ? 'var(--glacial)' : 'var(--border)'}`,
                        background: active ? 'var(--glacial-light, #E0F8F5)' : '#fff',
                        color: active ? 'var(--glacial-dark, #007868)' : 'var(--mist)',
                        fontSize: '13px', fontWeight: active ? '600' : '400',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
              {!paymentMethod && (
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '6px' }}>
                  Selecione a forma de pagamento para confirmar
                </div>
              )}
            </div>

            {confirmError && (
              <div style={{
                marginTop: '12px', padding: '10px 14px',
                background: 'var(--signal-light)', color: 'var(--signal-dark)',
                borderRadius: 'var(--radius-md)', fontSize: '13px',
              }}>
                {confirmError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={close}
                style={{
                  flex: 1, padding: '12px',
                  background: '#fff', color: 'var(--mist)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirm}
                disabled={cantConfirm}
                style={{
                  flex: 2, padding: '12px',
                  background: cantConfirm ? 'var(--border)' : 'var(--glacial)',
                  color: cantConfirm ? 'var(--mist)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: '500',
                  cursor: cantConfirm ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {confirming ? 'Confirmando...' : `Confirmar aula · ${fmt(totalPrice, currency)}`}
              </button>
            </div>

          </div>
        </div>
      )}

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
                  Check-in {fmtTime(fichaModal.checkin_at)} · {fmtRelative(fichaModal.checkin_at)}
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
                fontSize: '11px', fontWeight: '500', color: 'var(--color-pb-glacial-dark)',
                background: 'var(--color-pb-glacial-light)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
              }}>
                ✓ Termo de Responsabilidade Assinado
              </div>
              {/* Moved here from the compact card's button row when that
                  row became [ChameleonButton][⋮] only
                  (picobase_chameleon_button_dossie.md Fase 4) — this is a
                  less time-critical, per-student utility (re-showing the
                  waiver/check-in link, e.g. for a companion), not something
                  that needs to compete for the card's 2-element budget. */}
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
                { label: 'Origem', value: fichaModal.source ? (SOURCE_ICON[fichaModal.source] ? `${SOURCE_ICON[fichaModal.source]} ${fichaModal.source}` : fichaModal.source) : null },
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
