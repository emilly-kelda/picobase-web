'use client'

import { useState, useEffect } from 'react'
import { isLevel, LEVEL_LABELS, type Level } from '@/lib/levels'
import { translateModalityName } from '@/lib/modality'
import LevelPicker from '@/components/LevelPicker'
import type { VariableCostInfo } from '@/lib/commission'
import PackageReceiptModal from '@/components/PackageReceiptModal'

type ActivityRef = {
  id: string
  name: string
  default_price: number
  default_duration_min: number
}

type Instructor = {
  id: string
  name: string
  commission_pct: number | null
}

type Currency = 'BRL' | 'EUR' | 'USD'

const CURRENCY_OPTIONS: Array<{ value: Currency; symbol: string }> = [
  { value: 'BRL', symbol: 'R$' },
  { value: 'EUR', symbol: '€'  },
  { value: 'USD', symbol: '$'  },
]
const CURRENCY_SYMBOL: Record<Currency, string> = { BRL: 'R$', EUR: '€', USD: '$' }

// Same duration values everywhere else in the app uses (ScheduledLessons.tsx's
// own "+ Agendar" form, ScheduleFromCheckinModal.tsx) — labels aren't
// translated since "1h"/"1h30" reads the same in both languages.
const DURATIONS = [
  { label: '1h',   value: 60  },
  { label: '1h30', value: 90  },
  { label: '2h',   value: 120 },
  { label: '3h',   value: 180 },
]

function fmt(n: number, currency: Currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n)
}

// Small stroke icons for the payment-method picker — same 24x24/
// stroke=currentColor convention as nav-icons.tsx/weather-icons.tsx, in
// place of the ⚡💵💳⏳ emoji this used to show (no-emoji pass).
function PaymentMethodIcon({ method }: { method: 'pix' | 'dinheiro' | 'cartao' | 'a_receber' }) {
  const props = {
    width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none' as const,
    stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  switch (method) {
    case 'pix':
      return <svg {...props}><path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" /></svg>
    case 'dinheiro':
      return <svg {...props}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>
    case 'cartao':
      return <svg {...props}><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19" /></svg>
    case 'a_receber':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
  }
}

function fmtHoursMin(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

export type LessonToConfirm = {
  id: string
  student_name: string | null
  scheduled_at: string
  duration_min: number
  level: string | null
  activities: ActivityRef | null
  instructor: { id: string; name: string } | null
  // Whichever package_sales row was actually attached to this lesson at
  // scheduling time — the exact one confirm-lesson/route.ts will enforce
  // capacity against server-side. Passed through so the balance shown
  // here (package-balance/route.ts) reads that SAME row instead of
  // independently re-picking "the student's oldest active package by
  // name," which can silently be a different sale — see the comment on
  // the balance-loading effect below for why that mismatch used to let
  // this modal show a healthy balance right before the server rejected
  // the confirm for insufficient capacity.
  package_sale_id?: string | null
}

/** "Confirmar / Iniciar Aula" for a scheduled lesson. Two very different
 *  jobs share this one modal depending on whether the student has an
 *  active pre-paid package covering this lesson's duration:
 *
 *  - Package covers it, not the last lesson: pure operational confirm
 *    (instructor/date/duration/level) — no pricing UI at all. Price is
 *    auto pro-rated from the package's own price_paid/minutes_purchased
 *    (purely so instructor commission still computes correctly), payment
 *    method is fixed to 'pacote', never shown or asked.
 *  - Package covers it AND this is the last lesson (balance would hit
 *    zero): same operational confirm, plus a highlighted prompt to open
 *    the closing "Extrato do Pacote" (PackageReceiptModal) afterward.
 *  - No package, or the "Realizar cobrança agora" toggle is on
 *    (drop-in/trial add-on sold on top of an existing package): the full
 *    financial form (currency, price, payment method) — this is the
 *    entire modal's behavior before this split existed.
 *
 *  Triggered from Aulas Agendadas via scheduled_lesson_id rather than a
 *  checkin_id (confirm-lesson already supports confirming either way — see
 *  its studentName/scheduledLesson derivation). Used for a lesson that was
 *  either pre-booked in advance or deferred here from Aguardando Vento via
 *  "Agendar Aula"; either way, the student is now actually starting it.
 *
 *  This is now the only closing/charging modal in the app — Aguardando
 *  Vento's own inline confirm modal (PendingLessons.tsx) was removed
 *  entirely; that queue no longer has any close/charge action of its own.
 *  No health-alert banner here (that's checkin-specific data, not on
 *  scheduled_lessons) and no progression tracker (student skill updates
 *  stay on the student profile page — not duplicating that editor here). */
export default function ConfirmLessonModal({
  lesson,
  activities,
  instructors,
  payoutModel = 'percentage',
  fixedPayoutValue = null,
  t,
  lang = 'pt',
  onClose,
  onConfirmed,
}: {
  lesson: LessonToConfirm
  activities: ActivityRef[]
  instructors: Instructor[]
  payoutModel?: string
  fixedPayoutValue?: number | null
  t: Record<string, string>
  lang?: 'en' | 'pt'
  onClose: () => void
  onConfirmed: () => void
}) {
  const [activityId, setActivityId]     = useState(lesson.activities?.id ?? '')
  const [duration, setDuration]         = useState(lesson.duration_min || 60)
  const [useCustom, setUseCustom]       = useState(false)
  const [custom, setCustom]             = useState('')
  const [price, setPrice]               = useState(lesson.activities?.default_price ?? 0)
  const [instructorId, setInstructorId] = useState(lesson.instructor?.id ?? '')
  const [notes, setNotes]               = useState('')
  const [showNotes, setShowNotes]       = useState(false)
  const [confirming, setConfirming]     = useState(false)
  const [priceMode, setPriceMode]       = useState<'total' | 'per_hour'>('total')
  const [pricePerHour, setPricePerHour] = useState(0)
  const [sessionDate, setSessionDate]   = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao' | 'a_receber' | null>(null)
  const [level, setLevel]               = useState<Level>(isLevel(lesson.level) ? lesson.level as Level : 'experimental')
  const [experimentalDisabled, setExperimentalDisabled] = useState(false)
  const [currency, setCurrency]         = useState<Currency>('BRL')
  const [variableCost, setVariableCost] = useState<VariableCostInfo | null>(null)
  const [fxRates, setFxRates]           = useState<{ USD: number; EUR: number } | null>(null)
  const [fxError, setFxError]           = useState(false)
  const [fxLoading, setFxLoading]       = useState(false)
  const [fxSource, setFxSource]         = useState<'live' | 'stale-cache' | 'fallback' | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [packageBalance, setPackageBalance] = useState<{
    hasPackage: boolean; packageSaleId: string | null
    minutesRemaining: number; minutesPurchased: number; pricePaid: number
  } | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [chargeNow, setChargeNow]       = useState(false)
  const [receiptFor, setReceiptFor]     = useState<string | null>(null)

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
    if (lesson.student_name) {
      fetch(`/api/owner/package-variable-cost?student_name=${encodeURIComponent(lesson.student_name)}`)
        .then(r => r.json())
        .then(data => setVariableCost(data))
        .catch(() => {})
      // package_sale_id + exclude_lesson_id: read the balance for the
      // EXACT sale this lesson is tied to (not a fresh "oldest active
      // package by name" guess, which can land on a different sale — see
      // the LessonToConfirm.package_sale_id comment), net of capacity
      // already reserved by this student's OTHER pending lessons against
      // that same sale — the same accounting confirm-lesson/route.ts's
      // checkPackageCapacity enforces. Without this, the balance shown
      // here could read "10h left" while several other not-yet-confirmed
      // lessons already have that package's real remaining capacity
      // mostly spoken for, so confirming this one still got rejected.
      const balanceParams = new URLSearchParams({ student_name: lesson.student_name })
      if (lesson.package_sale_id) balanceParams.set('package_sale_id', lesson.package_sale_id)
      balanceParams.set('exclude_lesson_id', lesson.id)
      fetch(`/api/owner/package-balance?${balanceParams}`)
        .then(r => r.json())
        .then(data => setPackageBalance(data))
        .catch(() => setPackageBalance(null))
        .finally(() => setBalanceLoading(false))
    } else {
      setBalanceLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Same re-fire-on-activity-change convention as PendingLessons/ScheduledLessons'
  // own scheduling modal — recompute the level default whenever activity is known.
  useEffect(() => {
    if (!lesson.student_name || !activityId) return
    fetch(`/api/owner/default-level?student_name=${encodeURIComponent(lesson.student_name)}&activity_id=${activityId}`)
      .then(r => r.json())
      .then(data => {
        if (!data?.level) return
        setExperimentalDisabled(!!data.experimentalDisabled)
        if (!isLevel(lesson.level)) setLevel(data.level)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId])

  const usesFixedPayout    = payoutModel === 'fixed'
  const selectedInstructor = instructors.find(i => i.id === instructorId)
  const commissionPct      = selectedInstructor?.commission_pct ?? 0.38
  const finalDuration      = useCustom ? parseInt(custom) || 0 : duration

  // hasPackage/willExhaust drive the three-state render below (simple /
  // last-lesson / financial). packagePrice pro-rates this lesson's share of
  // the package's own price_paid — needed only so percentage-mode
  // instructor commission still computes correctly without asking the
  // owner to type a price for a lesson that's already paid for.
  const hasPackage        = !!packageBalance?.hasPackage
  const willExhaust        = hasPackage && packageBalance!.minutesRemaining <= finalDuration
  const showFinancialForm  = chargeNow || !hasPackage
  const packagePrice       = hasPackage && packageBalance!.minutesPurchased > 0
    ? Math.round((packageBalance!.pricePaid / packageBalance!.minutesPurchased) * finalDuration)
    : 0

  const totalPrice = showFinancialForm
    ? (priceMode === 'per_hour' ? Math.round(pricePerHour * (finalDuration / 60)) : price)
    : packagePrice
  const effectiveCurrency = showFinancialForm ? currency : 'BRL'
  const costDeduction = variableCost?.hasVariableCost ? variableCost.variableCostAmount : 0
  const netRevenue    = Math.max(0, totalPrice - costDeduction)
  const cantConfirm = confirming || balanceLoading || !instructorId || finalDuration <= 0
    || (showFinancialForm && (totalPrice <= 0 || !paymentMethod))

  const fxRate           = effectiveCurrency === 'BRL' ? 1 : fxRates?.[effectiveCurrency] ?? null
  const totalPriceBRL    = fxRate != null ? totalPrice * fxRate : null
  const netRevenueBRL    = totalPriceBRL != null ? Math.max(0, totalPriceBRL - costDeduction) : null
  const commissionBRL    = usesFixedPayout
    ? (fixedPayoutValue ?? 0)
    : (netRevenueBRL != null ? netRevenueBRL * commissionPct : null)

  // openReceipt: only true for "Encerrar Pacote e Cobrar" — the lesson
  // still confirms (and still auto-debits the package down to zero) the
  // same way the plain simple-flow confirm does; the only difference is
  // what happens on success (open the closing receipt instead of just
  // closing this modal).
  async function confirm(openReceipt = false) {
    if (!instructorId) return
    setConfirming(true)
    setError(null)

    const res = await fetch('/api/owner/confirm-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduled_lesson_id: lesson.id,
        instructor_id:  instructorId,
        activity_id:    activityId || null,
        duration_min:   finalDuration,
        price:          totalPrice,
        price_original: totalPrice,
        currency:       effectiveCurrency,
        notes,
        commission_pct: commissionPct,
        session_date:   sessionDate,
        payment_method: showFinancialForm ? paymentMethod : 'pacote',
        level,
      }),
    })

    const data = await res.json()
    setConfirming(false)

    if (data.ok) {
      if (openReceipt && packageBalance?.packageSaleId) {
        setReceiptFor(packageBalance.packageSaleId)
      } else {
        onConfirmed()
      }
    } else {
      setError(data.error ?? 'Erro ao confirmar aula')
    }
  }

  if (receiptFor) {
    return (
      <PackageReceiptModal
        packageSaleId={receiptFor}
        t={t}
        onClose={onConfirmed}
        onFinalized={onConfirmed}
      />
    )
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 250, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !confirming) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '480px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
            {lesson.student_name ?? t.th_student}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
            {t.scheduled_for_label} {new Date(lesson.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' })}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            {t.confirm_activity}
          </div>
          <select
            value={activityId}
            onChange={e => setActivityId(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
              fontSize: '14px', color: 'var(--slate)', background: '#fff',
              fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">{t.select_activity}</option>
            {activities.map(a => <option key={a.id} value={a.id}>{translateModalityName(a.name, lang)}</option>)}
          </select>
        </div>

        {activityId && (
          <div style={{ marginBottom: '20px' }}>
            <LevelPicker value={level} experimentalDisabled={experimentalDisabled} onChange={setLevel} lang={lang} />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            {t.confirm_instructor}
          </div>
          <select
            value={instructorId}
            onChange={e => setInstructorId(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
              fontSize: '14px', color: 'var(--slate)', background: '#fff',
              fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">{t.select_instructor}</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name} · {Math.round((i.commission_pct ?? 0) * 100)}%</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            {t.lesson_date_label}
          </div>
          <input
            type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
            style={{
              padding: '9px 12px', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
              fontSize: '14px', color: 'var(--slate)', fontFamily: 'var(--font-sans)', outline: 'none',
              background: '#fff', cursor: 'pointer',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            {t.duration_label}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => { setDuration(d.value); setUseCustom(false) }}
                style={{
                  padding: '9px 16px', borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${!useCustom && duration === d.value ? 'var(--glacial)' : 'var(--border)'}`,
                  background: !useCustom && duration === d.value ? 'var(--glacial-light)' : '#fff',
                  color: !useCustom && duration === d.value ? 'var(--glacial-dark)' : 'var(--slate)',
                  fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {d.label}
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              style={{
                padding: '9px 16px', borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${useCustom ? 'var(--glacial)' : 'var(--border)'}`,
                background: useCustom ? 'var(--glacial-light)' : '#fff',
                color: useCustom ? 'var(--glacial-dark)' : 'var(--slate)',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              {t.duration_other}
            </button>
          </div>
          {useCustom && (
            <input
              type="number" placeholder="Minutos" value={custom} onChange={e => setCustom(e.target.value)}
              style={{
                marginTop: '8px', width: '120px', padding: '9px 14px',
                border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
                fontSize: '15px', color: 'var(--slate)', fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            />
          )}
        </div>

        {hasPackage && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--slate)' }}>
              <input
                type="checkbox" checked={chargeNow}
                onChange={e => setChargeNow(e.target.checked)}
                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
              />
              {t.charge_now_toggle}
            </label>
          </div>
        )}

        {/* Package-covered, non-financial states — no pricing UI at all.
            willExhaust swaps the plain balance line for a highlighted
            prompt into the closing receipt (see the button row below,
            which calls confirm(true) instead of confirm(false) here). */}
        {!showFinancialForm && !balanceLoading && (
          willExhaust ? (
            <div style={{
              marginBottom: '20px', padding: '14px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--powder)', border: '0.5px solid var(--border-strong)',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
                {t.last_lesson_banner_title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                {t.will_consume_label} {fmtHoursMin(finalDuration)}
              </div>
            </div>
          ) : (
            <div style={{
              marginBottom: '20px', padding: '12px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--glacial-light)', color: 'var(--glacial-dark)', fontSize: '13px',
            }}>
              {t.will_consume_label} {fmtHoursMin(finalDuration)} — {t.remaining_after_label}{' '}
              {fmtHoursMin(Math.max(0, (packageBalance?.minutesRemaining ?? 0) - finalDuration))} {t.in_package_label}
            </div>
          )
        )}

        {showFinancialForm && (
        <>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            {t.currency_charged}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {CURRENCY_OPTIONS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCurrency(c.value)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${currency === c.value ? 'var(--glacial)' : 'var(--border)'}`,
                  background: currency === c.value ? 'var(--glacial-light)' : '#fff',
                  color: currency === c.value ? 'var(--glacial-dark)' : 'var(--mist)',
                  fontSize: '13px', fontWeight: currency === c.value ? '600' : '400',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <span>{c.value}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{t.amount_charged} ({CURRENCY_SYMBOL[currency]})</span>
            <div style={{ display: 'flex', gap: '2px', background: 'var(--powder)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
              {[{ key: 'total', label: t.price_mode_total }, { key: 'per_hour', label: t.price_mode_hour }].map(m => (
                <button
                  key={m.key}
                  onClick={() => setPriceMode(m.key as 'total' | 'per_hour')}
                  style={{
                    padding: '3px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: '500',
                    background: priceMode === m.key ? '#fff' : 'transparent',
                    color: priceMode === m.key ? 'var(--slate)' : 'var(--mist)',
                    boxShadow: priceMode === m.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {priceMode === 'total' ? (
            <input
              type="number" value={price} onChange={e => setPrice(Number(e.target.value))}
              style={{
                width: '140px', padding: '10px 14px', border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)', fontSize: '20px', fontWeight: '600',
                color: 'var(--slate)', fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            />
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <input
                  type="number" value={pricePerHour} onChange={e => setPricePerHour(Number(e.target.value))}
                  placeholder={`R$${t.price_mode_hour}`}
                  style={{
                    width: '140px', padding: '10px 14px', border: '0.5px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)', fontSize: '20px', fontWeight: '600',
                    color: 'var(--slate)', fontFamily: 'var(--font-sans)', outline: 'none',
                  }}
                />
                <div style={{ fontSize: '13px', color: 'var(--mist)' }}>{t.price_mode_hour}</div>
              </div>
              {pricePerHour > 0 && finalDuration > 0 && (
                <div style={{
                  padding: '10px 14px', background: 'var(--glacial-light)', borderRadius: 'var(--radius-md)',
                  fontSize: '13px', color: 'var(--glacial-dark)', display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>{pricePerHour}{t.price_mode_hour} × {(finalDuration / 60).toFixed(1)}h</span>
                  <span style={{ fontWeight: '600' }}>= {fmt(totalPrice, currency)}</span>
                </div>
              )}
            </div>
          )}

          {currency !== 'BRL' && totalPrice > 0 && (
            <div style={{ fontSize: '12px', marginTop: '8px', color: fxSource === 'fallback' ? '#92400E' : 'var(--mist)' }}>
              {totalPriceBRL != null && fxSource === 'fallback' ? (
                `${t.converted_label} ${fmt(totalPriceBRL, 'BRL')} — ${t.fx_fallback_note}`
              ) : totalPriceBRL != null ? (
                `${t.converted_label} ${fmt(totalPriceBRL, 'BRL')} (${t.fx_rate_label} ${currency} = ${fmt(fxRate ?? 0, 'BRL')})`
              ) : fxError ? (
                <>
                  {t.fx_unavailable}{' '}
                  <button
                    type="button" onClick={loadFxRates} disabled={fxLoading}
                    style={{
                      background: 'none', border: 'none', padding: 0, color: 'var(--glacial-dark)',
                      textDecoration: 'underline', cursor: fxLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {fxLoading ? t.fx_trying : t.fx_retry}
                  </button>
                </>
              ) : t.fx_loading}
            </div>
          )}

          {costDeduction > 0 && (
            <div style={{
              background: 'var(--powder)', borderRadius: '10px', padding: '12px 14px', marginTop: '14px',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)' }}>
                {t.variable_cost_label} {variableCost?.variableCostMode === 'per_trip' ? `· ${t.per_trip}` : `· ${t.per_student}`}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--mist)' }}>{variableCost?.variableCostName ?? t.variable_cost_label}</span>
                <span style={{ color: '#DC2626', fontWeight: '500' }}>− {fmt(costDeduction, currency)}</span>
              </div>
              <div style={{ height: '0.5px', background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--mist)' }}>{t.commission_base}</span>
                <span style={{ fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(netRevenue, currency)}
                </span>
              </div>
            </div>
          )}

          <div style={{ fontSize: '13px', color: 'var(--mist)', marginTop: '4px' }}>
            {usesFixedPayout
              ? `→ ${t.instructor_payout_fixed} ${fmt(commissionBRL ?? 0, 'BRL')}`
              : `→ ${t.commission_arrow_label} ${commissionBRL != null ? fmt(commissionBRL, 'BRL') : '—'}`}
          </div>
        </div>
        </>
        )}

        {!showNotes ? (
          <button
            onClick={() => setShowNotes(true)}
            style={{
              background: 'transparent', border: 'none', fontSize: '13px', color: 'var(--mist)',
              cursor: 'pointer', padding: '0', fontFamily: 'var(--font-sans)', marginBottom: '24px',
              textDecoration: 'underline', textDecorationColor: 'var(--border)',
            }}
          >
            {t.add_note_btn}
          </button>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.note_placeholder}
              style={{
                width: '100%', padding: '10px 14px', border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--slate)',
                fontFamily: 'var(--font-sans)', outline: 'none', minHeight: '72px',
                resize: 'vertical' as const, boxSizing: 'border-box' as const,
              }}
            />
          </div>
        )}

        {showFinancialForm && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '10px' }}>
            {t.payment_method_label} *
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {([
              { value: 'pix',       label: t.payment_pix },
              { value: 'dinheiro',  label: t.payment_cash },
              { value: 'cartao',    label: t.payment_card },
              { value: 'a_receber', label: t.payment_receivable },
            ] as const).map(opt => {
              const active = paymentMethod === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${active ? 'var(--glacial)' : 'var(--border)'}`,
                    background: active ? 'var(--glacial-light, #E0F8F5)' : '#fff',
                    color: active ? 'var(--glacial-dark, #007868)' : 'var(--mist)',
                    fontSize: '13px', fontWeight: active ? '600' : '400',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  <PaymentMethodIcon method={opt.value} /><span>{opt.label}</span>
                </button>
              )
            })}
          </div>
          {!paymentMethod && (
            <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '6px' }}>
              {t.select_payment_hint}
            </div>
          )}
        </div>
        )}

        {error && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px', background: 'var(--signal-light)',
            color: 'var(--signal-dark)', borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            className="flex-1 bg-white text-zinc-500 border border-zinc-200 rounded-md px-3 py-3 text-sm cursor-pointer"
          >
            {t.cancel_btn}
          </button>
          {!showFinancialForm && willExhaust ? (
            <button
              onClick={() => confirm(true)}
              disabled={cantConfirm}
              className="flex-[2] bg-zinc-900 hover:bg-zinc-800 text-white rounded-md px-3 py-3 text-sm font-medium border-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-900"
            >
              {confirming ? t.confirming_btn : t.close_package_btn}
            </button>
          ) : !showFinancialForm ? (
            <button
              onClick={() => confirm(false)}
              disabled={cantConfirm}
              className="flex-[2] bg-zinc-900 hover:bg-zinc-800 text-white rounded-md px-3 py-3 text-sm font-medium border-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-900"
            >
              {confirming ? t.confirming_btn : t.confirm_lesson_simple_btn}
            </button>
          ) : (
            <button
              onClick={() => confirm(false)}
              disabled={cantConfirm}
              className="flex-[2] bg-zinc-900 hover:bg-zinc-800 text-white rounded-md px-3 py-3 text-sm font-medium border-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-900"
            >
              {confirming ? t.confirming_btn : `${t.confirm_lesson_btn} ${fmt(totalPrice, currency)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
