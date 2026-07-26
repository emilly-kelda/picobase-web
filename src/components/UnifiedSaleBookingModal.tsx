'use client'

import { useState, useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/currency'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import CheckinQRButton from '@/components/CheckinQRButton'

export type PackageOption = {
  id: string
  name: string
  sport: string | null
  total_minutes: number
  base_price: number | null
  final_price: number | null
}

type Activity = {
  id: string
  name: string
  default_price: number
  default_duration_min: number
}

type FoundStudent = {
  id: string
  name: string
  whatsapp: string | null
  document_number?: string | null
  document_type?: string | null
}

type PaymentMethod = 'pix' | 'dinheiro' | 'cartao'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix',      label: 'PIX'      },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao',   label: 'Cartão'   },
]

const STEP_LABELS = ['Aluno e Pacote', 'Pagamento', 'Agendamento', 'Check-in']

function documentLabel(type: string | null | undefined) {
  return type === 'cpf' ? 'CPF' : type === 'passport' ? 'Passaporte' : 'Documento'
}

function fmtH(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

function packagePrice(pkg: PackageOption) {
  return pkg.final_price ?? pkg.base_price ?? 0
}

// package_sales has no FK to activities — match the package's free-text sport
// field against the activity catalog by name. Same fuzzy approach as
// ScheduledLessons.tsx's own (unexported) findActivityBySport.
function findActivityBySport(activities: Activity[], sport: string | null): Activity | undefined {
  const needle = (sport ?? '').trim().toLowerCase()
  if (!needle) return undefined
  return activities.find(a => {
    const name = a.name.toLowerCase()
    return name.includes(needle) || needle.includes(name)
  })
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
}

// Solid dark fill on select (not the app's usual light-tint toggle — see
// package picker above) — the light-tint version read as disabled/unpicked
// at a glance for payment method specifically, since 'var(--mist)' text on
// a near-white fill has too little contrast against genuinely disabled
// controls elsewhere in this modal. var(--white)/var(--slate-light)/
// var(--slate-border) don't exist as tokens in this codebase (checked
// tokens.css/globals.css) — using the real equivalents: #fff (the literal
// value every "white" background in this file already uses) and
// var(--border-strong) for a crisper unselected border.
function paymentButtonStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '10px 8px',
    borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${active ? 'var(--slate)' : 'var(--border-strong)'}`,
    background: active ? 'var(--slate)' : '#fff',
    color: active ? '#fff' : 'var(--slate)',
    fontSize: '13px', fontWeight: active ? '600' : '500',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s',
  }
}

// Compact segmented control for the optional card sub-type — same shape as
// paymentButtonStyle but sized for a two-way choice nested under Cartão.
function subChoiceStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '8px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${active ? 'var(--glacial)' : 'var(--border-strong)'}`,
    background: active ? 'var(--glacial-light)' : '#fff',
    color: active ? 'var(--glacial-dark)' : 'var(--slate)',
    fontSize: '12px', fontWeight: active ? '600' : '500',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s',
  }
}

/** Unified "Nova Venda" wizard — Venda Rápida's guided replacement for the
 *  single-block SellPackageFlowModal: sells a package, captures how it was
 *  paid, books the student's first lesson tied to that exact package_sale_id
 *  (never a name-only guess — see checkPackageCapacity's own FIFO fallback in
 *  scheduledLessonRepository.ts for what that guess would otherwise have to
 *  resolve), then hands back a QR/WhatsApp check-in link for it.
 *
 *  Scheduling (Step 3) is skippable — a package doesn't always get its first
 *  lesson booked on the spot. Aguardando Vento's per-card "Vender Pacote"
 *  keeps using the simpler SellPackageFlowModal — that student is already
 *  mid-checkin, so payment/scheduling/QR steps here would be redundant. */
export default function UnifiedSaleBookingModal({
  packageTypes,
  activities,
  schoolSlug,
  schoolName,
  onClose,
  onSold,
}: {
  packageTypes: PackageOption[]
  activities: Activity[]
  schoolSlug: string
  schoolName: string
  onClose: () => void
  onSold: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1 — student
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState<FoundStudent[]>([])
  const [searching, setSearching]     = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<FoundStudent | null>(null)
  const [manualMode, setManualMode]   = useState(false)
  const [manualName, setManualName]   = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 1 — package
  const [packageId, setPackageId] = useState('')

  // Step 2 — payment. cashReceived/cardType are display-only aids (change
  // calc, informational card sub-type) — sell-package/route.ts only stores
  // payment_method as a notes prefix, so neither is sent to the backend.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [cashReceived, setCashReceived] = useState('')
  const [cardType, setCardType] = useState<'debito' | 'credito' | null>(null)

  function selectPaymentMethod(pm: PaymentMethod) {
    setPaymentMethod(pm)
    if (pm !== 'dinheiro') setCashReceived('')
    if (pm !== 'cartao') setCardType(null)
  }

  // Step 3 — scheduling. Replaces free-typed time/instructor inputs (the
  // owner had to guess-and-check against conflict errors) with a fetched
  // list of every actually-free (time, instructor) slot for the chosen
  // date, reusing the same instructor-availability scan getRescheduleSuggestion/
  // getBookingSuggestion already use — see getAvailableSlotsForDate.
  const [scheduleNow, setScheduleNow] = useState(true)
  const [date, setDate]               = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [slots, setSlots]             = useState<Array<{
    time: string; instructor_id: string; instructor_name: string; studentConflict: boolean
  }>>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{
    time: string; instructor_id: string; instructor_name: string; studentConflict: boolean
  } | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Populated once the sale — and optionally the lesson — actually land.
  // Nothing before Step 2's "Registrar venda" is destructive/persisted.
  const [packageSaleId, setPackageSaleId] = useState<string | null>(null)
  const [publicToken, setPublicToken]     = useState<string | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true)
      fetch(`/api/owner/students?q=${encodeURIComponent(query.trim())}`)
        .then(r => r.json())
        .then(data => { setResults(data.students ?? []); setShowResults(true) })
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const studentName     = selectedStudent?.name ?? manualName.trim()
  const studentWhatsapp = selectedStudent?.whatsapp ?? null
  const selectedPackage = packageTypes.find(p => p.id === packageId) ?? null

  const canStep1 = packageId !== '' && (selectedStudent != null || (manualMode && manualName.trim().length >= 2))
  const canStep3 = !scheduleNow || (date !== '' && selectedSlot !== null)

  const scheduleActivity = findActivityBySport(activities, selectedPackage?.sport ?? null)
  const scheduleDuration = scheduleActivity?.default_duration_min ?? 60

  useEffect(() => {
    if (step !== 3 || !scheduleNow || !date) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    const params = new URLSearchParams({
      date,
      durationMin: String(scheduleDuration),
      studentName,
    })
    if (scheduleActivity?.name) params.set('activityName', scheduleActivity.name)
    fetch(`/api/owner/available-slots?${params.toString()}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scheduleNow, date, scheduleActivity?.id, scheduleDuration])

  async function confirmSale() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/owner/sell-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package_id:     packageId,
        student_name:   studentName,
        payment_method: paymentMethod,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || !data.ok) {
      setError(data.error ?? 'Erro ao registrar venda')
      return
    }
    setPackageSaleId(data.package_sale_id ?? null)
    setStep(3)
  }

  async function confirmSchedule() {
    if (!packageSaleId) return
    if (!scheduleNow) { setStep(4); return }
    if (!selectedSlot) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/owner/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name:    studentName,
        activity_id:     scheduleActivity?.id ?? null,
        instructor_id:   selectedSlot.instructor_id,
        scheduled_at:    `${date}T${selectedSlot.time}:00-03:00`,
        duration_min:    scheduleDuration,
        // Fixed to the exact sale just created — never a name-only re-guess.
        package_sale_id: packageSaleId,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || !data.ok) {
      setError(data.error ?? 'Não foi possível agendar a aula.')
      return
    }
    if (data.public_token) setPublicToken(data.public_token)
    setStep(4)
  }

  function skipScheduling() {
    setScheduleNow(false)
    setStep(4)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  // A scheduled first lesson gets the /aula/[token] self-service link
  // (confirm/reschedule/cancel, same as ScheduledLessons.tsx's WhatsApp
  // picker); skipping scheduling falls back to the general check-in link
  // (same URL CheckinQRButton's default pill already points at).
  const checkinUrl = publicToken
    ? `${origin}/aula/${publicToken}`
    : `${origin}/checkin/${schoolSlug}?student=${encodeURIComponent(studentName)}`

  const whatsappMessage = publicToken
    ? `Olá ${studentName}! Sua compra na ${schoolName} foi confirmada e sua primeira aula já está agendada. Confirme sua presença ou peça reagendamento aqui: ${checkinUrl}`
    : `Olá ${studentName}! Sua compra na ${schoolName} foi confirmada. Faça seu check-in aqui: ${checkinUrl}`

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 250, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving && step < 3) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '480px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '16px' }}>
          Nova venda
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3 | 4
            const active = step === n
            const done   = step > n
            return (
              <div key={label} style={{ flex: 1 }}>
                <div style={{
                  height: '4px', borderRadius: '99px',
                  background: active || done ? 'var(--glacial)' : 'var(--border)',
                  marginBottom: '4px',
                }} />
                <div style={{
                  fontSize: '10px', fontWeight: active ? '600' : '400',
                  color: active ? 'var(--slate)' : 'var(--mist)',
                }}>
                  {label}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── STEP 1 — student + package ─────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!manualMode ? (
              <div>
                <label style={labelStyle}>Buscar cliente (Nome ou CPF/Passaporte)</label>
                {selectedStudent ? (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', background: 'var(--glacial-light)',
                    border: '1px solid var(--glacial)', borderRadius: 'var(--radius-md)',
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)' }}>
                        {selectedStudent.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--glacial-dark)' }}>
                        {selectedStudent.whatsapp || 'Sem WhatsApp cadastrado'}
                        {selectedStudent.document_number && (
                          <> · {documentLabel(selectedStudent.document_type)}: {selectedStudent.document_number}</>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      style={{
                        background: 'none', border: 'none', padding: '4px 8px',
                        color: 'var(--mist)', fontSize: '12px', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)', textDecoration: 'underline',
                      }}
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input
                      style={inputStyle}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onFocus={() => { if (results.length > 0) setShowResults(true) }}
                      onBlur={() => setTimeout(() => setShowResults(false), 200)}
                      placeholder="Nome ou CPF/Passaporte..."
                      autoFocus
                    />
                    {searching && (
                      <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
                        Buscando...
                      </div>
                    )}
                    {showResults && results.length > 0 && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: '#fff', border: '0.5px solid var(--border)',
                        borderRadius: 'var(--radius-md)', zIndex: 50,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        maxHeight: '220px', overflowY: 'auto',
                      }}>
                        {results.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={() => { setSelectedStudent(s); setQuery(''); setResults([]); setShowResults(false) }}
                            style={{
                              width: '100%', padding: '10px 14px', cursor: 'pointer',
                              border: 'none', background: 'transparent',
                              borderBottom: '0.5px solid var(--border)',
                              textAlign: 'left', fontFamily: 'var(--font-sans)',
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                              {s.whatsapp || 'Sem WhatsApp cadastrado'}
                              {s.document_number && (
                                <> · {documentLabel(s.document_type)}: {s.document_number}</>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showResults && results.length === 0 && !searching && query.trim().length >= 2 && (
                      <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '6px' }}>
                        Nenhum cliente encontrado com esse nome.
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  style={{
                    marginTop: '10px', background: 'none', border: 'none', padding: 0,
                    color: 'var(--mist)', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', textDecoration: 'underline',
                  }}
                >
                  + Adicionar aluno não cadastrado
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={labelStyle}>Aluno não cadastrado</span>
                  <button
                    type="button"
                    onClick={() => { setManualMode(false); setManualName('') }}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: 'var(--glacial-dark)', fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', textDecoration: 'underline',
                    }}
                  >
                    Buscar cliente cadastrado
                  </button>
                </div>
                <label style={labelStyle}>Nome completo *</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="Nome do cliente"
                  autoFocus
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Pacote</label>
              {packageTypes.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
                  Nenhum pacote cadastrado — crie um em Pacotes primeiro.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {packageTypes.map(pkg => {
                    const active = packageId === pkg.id
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setPackageId(pkg.id)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', textAlign: 'left',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${active ? 'var(--glacial)' : 'var(--border)'}`,
                          background: active ? 'var(--glacial-light)' : '#fff',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)' }}>
                            {pkg.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                            {fmtH(pkg.total_minutes)}{pkg.sport ? ` · ${pkg.sport}` : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(packagePrice(pkg), { decimals: 0 })}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2 — payment ────────────────────────────────────────── */}
        {step === 2 && selectedPackage && (
          <div>
            <div style={{ marginBottom: '20px', padding: '14px', background: 'var(--powder)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '2px' }}>{studentName}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)' }}>{selectedPackage.name}</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--slate)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(packagePrice(selectedPackage))}
              </div>
            </div>
            <label style={labelStyle}>Forma de pagamento</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => selectPaymentMethod(pm.value)}
                  style={paymentButtonStyle(paymentMethod === pm.value)}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'dinheiro' && (
              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Valor recebido em dinheiro</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  step={5}
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder={String(packagePrice(selectedPackage))}
                />
                {cashReceived !== '' && (() => {
                  const troco = Number(cashReceived) - packagePrice(selectedPackage)
                  return (
                    <div style={{
                      marginTop: '8px', fontSize: '13px', fontWeight: '600',
                      color: troco < 0 ? 'var(--signal-dark)' : 'var(--glacial-dark)',
                    }}>
                      {troco < 0
                        ? `Faltam ${formatCurrency(Math.abs(troco))}`
                        : `Troco: ${formatCurrency(troco)}`}
                    </div>
                  )
                })()}
              </div>
            )}

            {paymentMethod === 'cartao' && (
              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Débito ou crédito (opcional)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCardType(t => t === 'debito' ? null : 'debito')}
                    style={subChoiceStyle(cardType === 'debito')}
                  >
                    Débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardType(t => t === 'credito' ? null : 'credito')}
                    style={subChoiceStyle(cardType === 'credito')}
                  >
                    Crédito
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3 — scheduling ─────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--slate)' }}>
                Agendar a primeira aula agora?
              </span>
              <button
                type="button"
                onClick={() => setScheduleNow(v => !v)}
                style={{
                  width: '40px', height: '22px', borderRadius: '99px',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  background: scheduleNow ? 'var(--glacial)' : 'var(--border)',
                  transition: 'background-color 0.15s',
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: scheduleNow ? '20px' : '2px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.15s',
                }} />
              </button>
            </div>

            {scheduleNow && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Data</label>
                  <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                <div>
                  <label style={labelStyle}>Horários disponíveis</label>
                  {slotsLoading ? (
                    <div style={{ fontSize: '12px', color: 'var(--mist)', padding: '8px 0' }}>
                      Buscando horários livres...
                    </div>
                  ) : slots.length === 0 ? (
                    <div style={{
                      fontSize: '12px', color: 'var(--mist)',
                      background: 'var(--powder)', borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                    }}>
                      Nenhum horário livre encontrado nesta data — tente outra data.
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: '8px',
                      maxHeight: '220px', overflowY: 'auto', padding: '2px',
                    }}>
                      {slots.map(slot => {
                        const active = selectedSlot?.time === slot.time
                          && selectedSlot?.instructor_id === slot.instructor_id
                        return (
                          <button
                            key={`${slot.time}-${slot.instructor_id}`}
                            type="button"
                            disabled={slot.studentConflict}
                            onClick={() => setSelectedSlot(slot)}
                            title={slot.studentConflict ? 'Aluno já tem uma aula marcada para este horário' : undefined}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              border: `1.5px solid ${
                                slot.studentConflict ? 'var(--border)' : active ? 'var(--glacial)' : 'var(--border-strong)'
                              }`,
                              background: slot.studentConflict ? 'var(--powder)' : active ? 'var(--glacial-light)' : '#fff',
                              color: slot.studentConflict ? 'var(--mist)' : active ? 'var(--glacial-dark)' : 'var(--slate)',
                              fontSize: '12px', fontWeight: active ? '600' : '500',
                              cursor: slot.studentConflict ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--font-sans)',
                              textDecoration: slot.studentConflict ? 'line-through' : 'none',
                              opacity: slot.studentConflict ? 0.6 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {slot.time} · {slot.instructor_name}
                            {slot.studentConflict && ' (aluno ocupado)'}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!scheduleNow && (
              <div style={{
                fontSize: '12px', color: 'var(--mist)',
                background: 'var(--powder)', borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
              }}>
                Sem problema — o crédito já está registrado. A aula pode ser agendada depois em Aulas Agendadas.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4 — check-in / confirmation ────────────────────────── */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)', marginBottom: '4px' }}>
              Venda registrada
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '16px' }}>
              {publicToken
                ? 'Confirme a presença do cliente escaneando o QR abaixo'
                : 'Peça para o cliente escanear para fazer o check-in'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <CheckinQRButton
                slug={schoolSlug}
                schoolName={schoolName}
                studentName={studentName}
                activityName={selectedPackage?.sport ?? null}
                token={publicToken ?? undefined}
                defaultOpen
                compact
              />
            </div>

            <a
              href={studentWhatsapp ? buildWhatsAppUrl(studentWhatsapp, whatsappMessage) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => { if (!studentWhatsapp) e.preventDefault() }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '11px', marginBottom: '10px',
                borderRadius: 'var(--radius-md)',
                background: studentWhatsapp ? 'rgba(37,211,102,0.1)' : 'var(--powder)',
                color: studentWhatsapp ? '#128C4A' : 'var(--mist)',
                fontSize: '13px', fontWeight: '500', textDecoration: 'none',
                cursor: studentWhatsapp ? 'pointer' : 'not-allowed',
              }}
            >
              {studentWhatsapp ? 'Enviar link por WhatsApp' : 'Cliente sem WhatsApp cadastrado'}
            </a>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Nav */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          {step === 1 && (
            <>
              <button onClick={onClose} style={navSecondaryStyle}>Cancelar</button>
              <button
                onClick={() => setStep(2)}
                disabled={!canStep1}
                style={navPrimaryStyle(canStep1)}
              >
                Continuar
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} disabled={saving} style={navSecondaryStyle}>Voltar</button>
              <button
                onClick={confirmSale}
                disabled={!paymentMethod || saving}
                style={navPrimaryStyle(!!paymentMethod && !saving)}
              >
                {saving ? 'Registrando...' : 'Confirmar Pagamento e Prosseguir ➔'}
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button onClick={skipScheduling} disabled={saving} style={navSecondaryStyle}>Pular</button>
              <button
                onClick={confirmSchedule}
                disabled={!canStep3 || saving}
                style={navPrimaryStyle(canStep3 && !saving)}
              >
                {saving ? 'Agendando...' : scheduleNow ? 'Agendar e continuar' : 'Continuar'}
              </button>
            </>
          )}
          {step === 4 && (
            <button onClick={onSold} style={{ ...navPrimaryStyle(true), flex: 1 }}>
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const navSecondaryStyle: React.CSSProperties = {
  flex: 1, padding: '11px',
  background: '#fff', color: 'var(--mist)',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
}

function navPrimaryStyle(enabled: boolean): React.CSSProperties {
  return {
    flex: 2, padding: '11px',
    background: enabled ? 'var(--slate)' : 'var(--border)',
    color: enabled ? '#fff' : 'var(--mist)',
    border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: '14px', fontWeight: '500',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'var(--font-sans)',
  }
}
