'use client'

import { useState, useEffect } from 'react'
import { isLevel, LEVEL_LABELS, type Level } from '@/lib/levels'
import LevelPicker from '@/components/LevelPicker'
import type { VariableCostInfo } from '@/lib/commission'

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

const CURRENCY_OPTIONS: Array<{ value: Currency; symbol: string; flag: string }> = [
  { value: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { value: 'EUR', symbol: '€',  flag: '🇪🇺' },
  { value: 'USD', symbol: '$',  flag: '🇺🇸' },
]
const CURRENCY_SYMBOL: Record<Currency, string> = { BRL: 'R$', EUR: '€', USD: '$' }

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

export type LessonToConfirm = {
  id: string
  student_name: string | null
  scheduled_at: string
  duration_min: number
  level: string | null
  activities: ActivityRef | null
  instructor: { id: string; name: string } | null
}

/** "Confirmar / Iniciar Aula" for a scheduled lesson — same pricing/payment
 *  decision Sala de Espera's confirm modal makes (activity, level,
 *  instructor, duration, currency, price, payment method), just triggered
 *  from Aulas Agendadas instead, via scheduled_lesson_id rather than a
 *  checkin_id (confirm-lesson already supports confirming either way — see
 *  its studentName/scheduledLesson derivation). Used for a lesson that was
 *  either pre-booked in advance or deferred here from Sala de Espera via
 *  "Agendar Aula"; either way, the student is now actually starting it.
 *
 *  Deliberately smaller than PendingLessons' inline modal: no health-alert
 *  banner (that's checkin-specific data, not on scheduled_lessons) and no
 *  progression tracker (student skill updates stay on the student profile
 *  page — not duplicating that editor here). */
export default function ConfirmLessonModal({
  lesson,
  activities,
  instructors,
  payoutModel = 'percentage',
  fixedPayoutValue = null,
  onClose,
  onConfirmed,
}: {
  lesson: LessonToConfirm
  activities: ActivityRef[]
  instructors: Instructor[]
  payoutModel?: string
  fixedPayoutValue?: number | null
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
  const totalPrice         = priceMode === 'per_hour'
    ? Math.round(pricePerHour * (finalDuration / 60))
    : price
  const costDeduction = variableCost?.hasVariableCost ? variableCost.variableCostAmount : 0
  const netRevenue    = Math.max(0, totalPrice - costDeduction)
  const cantConfirm = confirming || !instructorId || totalPrice <= 0 || finalDuration <= 0 || !paymentMethod

  const fxRate           = currency === 'BRL' ? 1 : fxRates?.[currency] ?? null
  const totalPriceBRL    = fxRate != null ? totalPrice * fxRate : null
  const netRevenueBRL    = totalPriceBRL != null ? Math.max(0, totalPriceBRL - costDeduction) : null
  const commissionBRL    = usesFixedPayout
    ? (fixedPayoutValue ?? 0)
    : (netRevenueBRL != null ? netRevenueBRL * commissionPct : null)

  async function confirm() {
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
      onConfirmed()
    } else {
      setError(data.error ?? 'Erro ao confirmar aula')
    }
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
            {lesson.student_name ?? 'Aluno'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Agendada para {new Date(lesson.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' })}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            Atividade
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
            <option value="">Selecionar atividade</option>
            {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {activityId && (
          <div style={{ marginBottom: '20px' }}>
            <LevelPicker value={level} experimentalDisabled={experimentalDisabled} onChange={setLevel} />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            Instrutor
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
            <option value="">Selecionar instrutor</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name} · {Math.round((i.commission_pct ?? 0) * 100)}%</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            Data da aula
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
            Duração
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
              Outro
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

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
            Moeda cobrada
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
                <span>{c.flag}</span><span>{c.value}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>Valor cobrado ({CURRENCY_SYMBOL[currency]})</span>
            <div style={{ display: 'flex', gap: '2px', background: 'var(--powder)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
              {[{ key: 'total', label: 'Total' }, { key: 'per_hour', label: '/hora' }].map(m => (
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
                  placeholder="R$/hora"
                  style={{
                    width: '140px', padding: '10px 14px', border: '0.5px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)', fontSize: '20px', fontWeight: '600',
                    color: 'var(--slate)', fontFamily: 'var(--font-sans)', outline: 'none',
                  }}
                />
                <div style={{ fontSize: '13px', color: 'var(--mist)' }}>/ hora</div>
              </div>
              {pricePerHour > 0 && finalDuration > 0 && (
                <div style={{
                  padding: '10px 14px', background: 'var(--glacial-light)', borderRadius: 'var(--radius-md)',
                  fontSize: '13px', color: 'var(--glacial-dark)', display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>{pricePerHour}/h × {(finalDuration / 60).toFixed(1)}h</span>
                  <span style={{ fontWeight: '600' }}>= {fmt(totalPrice, currency)}</span>
                </div>
              )}
            </div>
          )}

          {currency !== 'BRL' && totalPrice > 0 && (
            <div style={{ fontSize: '12px', marginTop: '8px', color: fxSource === 'fallback' ? '#92400E' : 'var(--mist)' }}>
              {totalPriceBRL != null && fxSource === 'fallback' ? (
                `Convertido: ${fmt(totalPriceBRL, 'BRL')} — usando taxa padrão da escola devido à instabilidade de rede`
              ) : totalPriceBRL != null ? (
                `Convertido: ${fmt(totalPriceBRL, 'BRL')} (Cotação: 1 ${currency} = ${fmt(fxRate ?? 0, 'BRL')})`
              ) : fxError ? (
                <>
                  Taxa de câmbio indisponível.{' '}
                  <button
                    type="button" onClick={loadFxRates} disabled={fxLoading}
                    style={{
                      background: 'none', border: 'none', padding: 0, color: 'var(--glacial-dark)',
                      textDecoration: 'underline', cursor: fxLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {fxLoading ? 'Tentando...' : 'Tentar novamente'}
                  </button>
                </>
              ) : 'Buscando taxa de câmbio…'}
            </div>
          )}

          {costDeduction > 0 && (
            <div style={{
              background: 'var(--powder)', borderRadius: '10px', padding: '12px 14px', marginTop: '14px',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)' }}>
                Custo variável {variableCost?.variableCostMode === 'per_trip' ? '· por trip' : '· por aluno'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--mist)' }}>{variableCost?.variableCostName ?? 'Custo'}</span>
                <span style={{ color: '#DC2626', fontWeight: '500' }}>− {fmt(costDeduction, currency)}</span>
              </div>
              <div style={{ height: '0.5px', background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--mist)' }}>Base para comissão</span>
                <span style={{ fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
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
              background: 'transparent', border: 'none', fontSize: '13px', color: 'var(--mist)',
              cursor: 'pointer', padding: '0', fontFamily: 'var(--font-sans)', marginBottom: '24px',
              textDecoration: 'underline', textDecorationColor: 'var(--border)',
            }}
          >
            + Adicionar observação
          </button>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações sobre a aula..."
              style={{
                width: '100%', padding: '10px 14px', border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--slate)',
                fontFamily: 'var(--font-sans)', outline: 'none', minHeight: '72px',
                resize: 'vertical' as const, boxSizing: 'border-box' as const,
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '10px' }}>
            Forma de pagamento *
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {([
              { value: 'pix',       label: 'PIX',       icon: '⚡' },
              { value: 'dinheiro',  label: 'Dinheiro',  icon: '💵' },
              { value: 'cartao',    label: 'Cartão',    icon: '💳' },
              { value: 'a_receber', label: 'A receber', icon: '⏳' },
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
                  <span>{opt.icon}</span><span>{opt.label}</span>
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
            style={{
              flex: 1, padding: '12px', background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
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
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: cantConfirm ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            {confirming ? 'Confirmando...' : `Confirmar aula · ${fmt(totalPrice, currency)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
