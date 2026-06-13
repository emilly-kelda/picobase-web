'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Instructor = {
  id: string
  name: string
  school_id: string
  commission_pct: number | null
}

type Checkin = {
  id: string
  student_name: string
  student_nationality: string | null
  health_condition: string | null
  checkin_at: string
  activity_id: string | null
  activities: {
    id: string
    name: string
    default_price: number
    default_duration_min: number
  } | null
}

type Stats = {
  todayCommission: number
  todayRevenue: number
  seasonTotal: number
  todayCount: number
}

const DURATIONS = [
  { label: '45min', value: 45 },
  { label: '1h',    value: 60 },
  { label: '1h30',  value: 90 },
  { label: '2h',    value: 120 },
]

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function InstructorPWA({
  instructor,
  checkins: initialCheckins,
  stats: initialStats,
  token,
}: {
  instructor: Instructor
  checkins: Checkin[]
  stats: Stats
  token: string
}) {
  void token

  const router = useRouter()
  const [checkins, setCheckins]     = useState(initialCheckins)
  const [stats, setStats]           = useState(initialStats)
  const [selected, setSelected]     = useState<Checkin | null>(null)
  const [duration, setDuration]     = useState<number>(60)
  const [customDuration, setCustom] = useState('')
  const [useCustom, setUseCustom]   = useState(false)
  const [price, setPrice]           = useState<number>(0)
  const [notes, setNotes]           = useState('')
  const [showFull, setShowFull]     = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed]   = useState<string | null>(null)

  function openCheckin(checkin: Checkin) {
    setSelected(checkin)
    const defaultDuration = checkin.activities?.default_duration_min ?? 60
    const defaultPrice    = checkin.activities?.default_price ?? 0
    setDuration(defaultDuration)
    setPrice(defaultPrice)
    setCustom('')
    setUseCustom(!DURATIONS.find(d => d.value === defaultDuration))
    setNotes('')
    setShowFull(false)
  }

  function close() {
    setSelected(null)
  }

  async function confirm() {
    if (!selected) return
    setConfirming(true)

    const finalDuration = useCustom ? parseInt(customDuration) || 60 : duration
    const commissionPct = instructor.commission_pct ?? 0.38

    const res = await fetch('/api/instructor/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkin_id:     selected.id,
        instructor_id:  instructor.id,
        school_id:      instructor.school_id,
        activity_id:    selected.activity_id,
        duration_min:   finalDuration,
        price,
        notes,
        commission_pct: commissionPct,
      }),
    })

    const data = await res.json()
    setConfirming(false)

    if (data.ok) {
      setConfirmed(selected.student_name)
      setCheckins(prev => prev.filter(c => c.id !== selected.id))
      setStats(prev => ({
        ...prev,
        todayCount:      prev.todayCount + 1,
        todayCommission: prev.todayCommission + (price * commissionPct),
        todayRevenue:    prev.todayRevenue + price,
        seasonTotal:     prev.seasonTotal + (price * commissionPct),
      }))
      setSelected(null)
      setTimeout(() => setConfirmed(null), 3000)
    }
  }

  const finalDuration = useCustom ? parseInt(customDuration) || 0 : duration
  const commission    = price * (instructor.commission_pct ?? 0.38)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0EEE9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '480px',
      margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderBottom: '0.5px solid #E4E0D8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1C22' }}>
            {instructor.name}
          </div>
          <div style={{ fontSize: '11px', color: '#8A8C98', marginTop: '1px' }}>
            {Math.round((instructor.commission_pct ?? 0) * 100)}% commission
          </div>
        </div>
        <button
          onClick={() => router.refresh()}
          style={{
            padding: '8px 14px',
            background: '#F0EEE9',
            border: '0.5px solid #E4E0D8',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#8A8C98',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Confirmed toast */}
        {confirmed && (
          <div style={{
            background: '#E0F8F5',
            border: '0.5px solid #00A896',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#007868',
          }}>
            <span>✓</span>
            <span>Session confirmed — {confirmed}</span>
          </div>
        )}

        {/* Stats bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '20px',
        }}>
          {[
            { label: 'Today',        value: String(stats.todayCount)          },
            { label: 'Earned today', value: fmt(stats.todayCommission)        },
            { label: 'Season',       value: fmt(stats.seasonTotal)            },
          ].map(card => (
            <div key={card.label} style={{
              background: '#fff',
              border: '0.5px solid #E4E0D8',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '16px', fontWeight: '600',
                color: '#1A1C22', fontVariantNumeric: 'tabular-nums',
              }}>
                {card.value}
              </div>
              <div style={{
                fontSize: '10px', color: '#8A8C98', marginTop: '2px',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Students list */}
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#8A8C98', marginBottom: '10px',
        }}>
          Waiting for confirmation · {checkins.length}
        </div>

        {checkins.length === 0 ? (
          <div style={{
            background: '#fff',
            border: '0.5px solid #E4E0D8',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🪁</div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1A1C22', marginBottom: '4px' }}>
              No students waiting
            </div>
            <div style={{ fontSize: '13px', color: '#8A8C98' }}>
              Students will appear here after check-in
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {checkins.map(checkin => (
              <button
                key={checkin.id}
                onClick={() => openCheckin(checkin)}
                style={{
                  background: '#fff',
                  border: checkin.health_condition
                    ? '1.5px solid #E8471A'
                    : '0.5px solid #E4E0D8',
                  borderRadius: '16px',
                  padding: '16px',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    borderRadius: '50%',
                    background: checkin.health_condition ? '#FDF0EC' : '#E0F8F5',
                    color: checkin.health_condition ? '#E8471A' : '#00A896',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '600',
                    flexShrink: 0,
                  }}>
                    {getInitials(checkin.student_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: '#1A1C22', marginBottom: '2px' }}>
                      {checkin.student_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8A8C98' }}>
                      {checkin.activities?.name ?? 'No activity selected'}
                      {' · '}
                      {fmtTime(checkin.checkin_at)}
                    </div>
                  </div>
                  {checkin.health_condition && (
                    <div style={{
                      fontSize: '11px', fontWeight: '500',
                      color: '#E8471A', background: '#FDF0EC',
                      padding: '4px 10px', borderRadius: '20px',
                      flexShrink: 0,
                    }}>
                      ⚠ Health
                    </div>
                  )}
                  <div style={{ fontSize: '18px', color: '#C8C6C0' }}>›</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm bottom sheet */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end',
            zIndex: 100,
          }}
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div style={{
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            width: '100%',
            maxWidth: '480px',
            margin: '0 auto',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 20px 40px',
          }}>

            {/* Handle */}
            <div style={{
              width: '36px', height: '4px',
              background: '#E4E0D8', borderRadius: '2px',
              margin: '0 auto 20px',
            }} />

            {/* Health alert */}
            {selected.health_condition && (
              <div style={{
                background: '#FDF0EC',
                border: '1px solid #E8471A',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#8B1818', marginBottom: '3px' }}>
                    Medical alert
                  </div>
                  <div style={{ fontSize: '13px', color: '#8B1818', lineHeight: '1.5' }}>
                    {selected.health_condition}
                  </div>
                </div>
              </div>
            )}

            {/* Student info */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#1A1C22', marginBottom: '4px' }}>
                {selected.student_name}
              </div>
              <div style={{ fontSize: '13px', color: '#8A8C98' }}>
                {selected.activities?.name ?? '—'} · checked in at {fmtTime(selected.checkin_at)}
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#8A8C98', marginBottom: '10px',
              }}>
                Duration
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => { setDuration(d.value); setUseCustom(false) }}
                    style={{
                      padding: '10px 18px', borderRadius: '10px',
                      border: `1.5px solid ${!useCustom && duration === d.value ? '#00A896' : '#E4E0D8'}`,
                      background: !useCustom && duration === d.value ? '#E0F8F5' : '#fff',
                      color: !useCustom && duration === d.value ? '#007868' : '#1A1C22',
                      fontSize: '15px', fontWeight: '500',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
                <button
                  onClick={() => setUseCustom(true)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px',
                    border: `1.5px solid ${useCustom ? '#00A896' : '#E4E0D8'}`,
                    background: useCustom ? '#E0F8F5' : '#fff',
                    color: useCustom ? '#007868' : '#1A1C22',
                    fontSize: '15px', fontWeight: '500',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Custom
                </button>
              </div>
              {useCustom && (
                <input
                  type="number"
                  placeholder="Minutes"
                  value={customDuration}
                  onChange={e => setCustom(e.target.value)}
                  style={{
                    marginTop: '10px', width: '120px',
                    padding: '10px 14px',
                    border: '0.5px solid #D8D2C8', borderRadius: '10px',
                    fontSize: '16px', color: '#1A1C22',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
              )}
            </div>

            {/* Price */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#8A8C98', marginBottom: '10px',
              }}>
                Price
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  style={{
                    width: '140px', padding: '12px 14px',
                    border: '0.5px solid #D8D2C8', borderRadius: '10px',
                    fontSize: '20px', fontWeight: '600',
                    color: '#1A1C22', fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <div style={{ fontSize: '13px', color: '#8A8C98' }}>
                  → commission {fmt(commission)}
                </div>
              </div>
            </div>

            {/* Notes toggle */}
            {!showFull ? (
              <button
                onClick={() => setShowFull(true)}
                style={{
                  background: 'transparent', border: 'none',
                  fontSize: '13px', color: '#8A8C98',
                  cursor: 'pointer', padding: '0', fontFamily: 'inherit',
                  marginBottom: '20px',
                  textDecoration: 'underline', textDecorationColor: '#D8D2C8',
                }}
              >
                + Add notes
              </button>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: '500',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#8A8C98', marginBottom: '8px',
                }}>
                  Notes
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any notes about this session..."
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '0.5px solid #D8D2C8', borderRadius: '10px',
                    fontSize: '14px', color: '#1A1C22',
                    fontFamily: 'inherit', outline: 'none',
                    minHeight: '80px', resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Confirm button */}
            <button
              onClick={confirm}
              disabled={confirming || price <= 0 || finalDuration <= 0}
              style={{
                width: '100%', padding: '18px',
                background: confirming || price <= 0 || finalDuration <= 0 ? '#E4E0D8' : '#00A896',
                color: confirming || price <= 0 || finalDuration <= 0 ? '#8A8C98' : '#fff',
                border: 'none', borderRadius: '14px',
                fontSize: '17px', fontWeight: '600',
                cursor: confirming || price <= 0 || finalDuration <= 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginBottom: '10px',
              }}
            >
              {confirming ? 'Confirming...' : `Confirm session · ${fmt(price)}`}
            </button>

            <button
              onClick={close}
              style={{
                width: '100%', padding: '14px',
                background: 'transparent', color: '#8A8C98',
                border: 'none', borderRadius: '14px',
                fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}


