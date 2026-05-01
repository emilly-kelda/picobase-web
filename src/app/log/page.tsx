'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  enqueueSession,
  getQueuedSessions,
  removeQueuedSession,
  getQueueCount,
  type QueuedSession,
} from '@/lib/offline-queue'

export default function LogPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [instructor, setInstructor] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [durations, setDurations] = useState<Record<string, string>>({})
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [confirmed, setConfirmed] = useState<string[]>([])
  const [error, setError] = useState('')
  const [authError, setAuthError] = useState(false)
  const [medicalAlert, setMedicalAlert] = useState<any>(null)
  const acknowledgedAlertsRef = React.useRef<string[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!token) {
      setAuthError(true)
      setLoading(false)
      return
    }

    fetchPending()

    // Auto-refresh every 10 seconds — works without auth
    const interval = setInterval(() => {
      fetchPending()
    }, 10000)

    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    setIsOnline(navigator.onLine)

    function handleOnline() {
      setIsOnline(true)
      syncQueue()
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    getQueueCount().then(setQueueCount)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [token])

  async function fetchPending() {
    setLoading(true)
    const res = await fetch(`/api/log?token=${token}`)
    const data = await res.json()

    if (!res.ok) {
      setAuthError(true)
      setLoading(false)
      return
    }

    setInstructor(data.instructor)
    setCheckins(data.checkins || [])
    setLoading(false)

    // Check for unacknowledged medical alerts
    const alerts = (data.checkins || []).filter(
      (c: any) =>
        c.health_condition &&
        !confirmed.includes(c.id) &&
        !acknowledgedAlertsRef.current.includes(c.id)
    )
    if (alerts.length > 0) {
      setMedicalAlert(alerts[0])
    }
  }

  async function syncQueue() {
    if (!token) return
    const queued = await getQueuedSessions()
    if (queued.length === 0) return

    setSyncing(true)

    for (const session of queued) {
      try {
        const res = await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token:        session.token,
            checkin_id:   session.checkin_id,
            duration_min: session.duration_min,
            price:        session.price,
          }),
        })

        if (res.ok) {
          await removeQueuedSession(session.id)
          setConfirmed(prev => [...prev, session.checkin_id])
        }
      } catch (e) {
        // Still offline — leave in queue
      }
    }

    const remaining = await getQueueCount()
    setQueueCount(remaining)
    setSyncing(false)

    if (remaining === 0) fetchPending()
  }

  async function confirmSession(checkinId: string, defaultPrice: number) {
    setError('')
    const durationRaw = durations[checkinId] === 'other' ? '' : durations[checkinId]

    if (!durationRaw || durationRaw === 'other') {
      setError('Please enter a custom duration.')
      return
    }

    const duration = parseDuration(durationRaw)
    if (!duration) {
      setError('Invalid duration. Try: 45, 90, 1h30, 1.5h')
      return
    }

    const price = parseFloat(prices[checkinId]) || defaultPrice
    setConfirming(checkinId)

    if (!isOnline) {
      await enqueueSession({
        id:           checkinId + '_' + Date.now(),
        token:        token!,
        checkin_id:   checkinId,
        duration_min: duration,
        price,
        queued_at:    new Date().toISOString(),
        student_name: checkins.find(c => c.id === checkinId)?.student_name || '',
      })

      setConfirmed(prev => [...prev, checkinId])
      setQueueCount(prev => prev + 1)
      setConfirming(null)
      return
    }

    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, checkin_id: checkinId, duration_min: duration, price }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setConfirming(null)
      return
    }

    setConfirmed(prev => [...prev, checkinId])
    setConfirming(null)
  }

  function parseDuration(input: string): number | null {
    const t = input.toLowerCase().trim()
    const hmMatch = t.match(/^(\d+)h\s*(\d+)?/)
    if (hmMatch) return parseInt(hmMatch[1]) * 60 + parseInt(hmMatch[2] || '0')
    const decMatch = t.match(/^(\d+[.,]\d+)h?/)
    if (decMatch) return Math.round(parseFloat(decMatch[1].replace(',', '.')) * 60)
    const numMatch = t.match(/^(\d+)(min)?$/)
    if (numMatch) return parseInt(numMatch[1])
    return null
  }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (diff < 1) return 'just now'
    if (diff === 1) return '1 min ago'
    if (diff < 60) return `${diff} min ago`
    return `${Math.floor(diff / 60)}h ago`
  }

  // ── Auth error ──
  if (authError) return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Pico Base</div>
      </div>
      <div style={styles.empty}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div>Invalid or missing link.</div>
        <div style={{ fontSize: '13px', color: '#aaa', marginTop: '6px' }}>
          Ask your school manager for your personal log link.
        </div>
      </div>
    </div>
  )

  const pending = checkins.filter(c => !confirmed.includes(c.id))
  const done = checkins.filter(c => confirmed.includes(c.id))

  return (
    <div style={styles.container}>

      {/* Full-screen medical alert */}
      {medicalAlert && (
        <div style={styles.alertOverlay}>
          <div style={styles.alertBox}>
            <div style={styles.alertIcon}>🚨</div>
            <div style={styles.alertTitle}>Medical Alert</div>
            <div style={styles.alertStudent}>{medicalAlert.student_name}</div>
            <div style={styles.alertCondition}>
              {medicalAlert.health_condition}
            </div>
            {medicalAlert.checkins?.emergency_name && (
              <div style={styles.alertEmergency}>
                Emergency contact: {medicalAlert.checkins.emergency_name}
                {' · '}
                {medicalAlert.checkins.emergency_phone}
              </div>
            )}
            <button
              style={styles.alertBtn}
              onClick={() => {
                acknowledgedAlertsRef.current = [...acknowledgedAlertsRef.current, medicalAlert.id]
                setMedicalAlert(null)
              }}
            >
              I've noted this — continue
            </button>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <div style={styles.logo}>Pico Base</div>
          <div style={styles.headerSub}>
            {instructor ? `Hi ${instructor.name.split(' ')[0]} 👋` : 'Session log'}
          </div>
        </div>
        <button style={styles.refreshBtn} onClick={fetchPending}>
          ↻ Refresh
        </button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Offline banner */}
      {!isOnline && (
        <div style={styles.offlineBanner}>
          📵 You're offline — sessions will sync when signal returns
        </div>
      )}

      {/* Syncing banner */}
      {syncing && (
        <div style={styles.syncingBanner}>
          ↑ Syncing {queueCount} queued session{queueCount !== 1 ? 's' : ''}...
        </div>
      )}

      {/* Queue count badge */}
      {isOnline && queueCount > 0 && !syncing && (
        <div style={styles.queueBanner}>
          ⚠️ {queueCount} session{queueCount !== 1 ? 's' : ''} pending sync
          <button style={styles.syncBtn} onClick={syncQueue}>
            Sync now
          </button>
        </div>
      )}

      {loading ? (
        <div style={styles.empty}>Loading...</div>
      ) : pending.length === 0 && done.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏄</div>
          <div>No check-ins yet today.</div>
          <div style={{ fontSize: '13px', color: '#aaa', marginTop: '6px' }}>
            Students scan the QR code to appear here.
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {pending.length > 0 && (
            <>
              <div style={styles.sectionLabel}>
                Pending confirmation ({pending.length})
              </div>
              {pending.map(c => (
                <div key={c.id} style={styles.card}>
                  {c.health_condition && (
                    <div style={styles.medicalAlert}>
                      ⚠️ {c.health_condition}
                    </div>
                  )}
                  <div style={styles.studentName}>{c.student_name}</div>
                  <div style={styles.studentMeta}>
                    {c.activities?.name || 'No activity'} · {timeAgo(c.checkin_at)}
                  </div>

                  {/* Package balance */}
                  {c.package_sales && (
                    <div style={styles.packageBadge}>
                      <div style={styles.packageName}>
                        {c.package_sales.packages?.name}
                      </div>
                      <div style={styles.packageBar}>
                        <div
                          style={{
                            ...styles.packageFill,
                            width: `${Math.min(100, Math.round(
                              (c.package_sales.minutes_used / c.package_sales.minutes_purchased) * 100
                            ))}%`,
                            background: c.package_sales.minutes_used >= c.package_sales.minutes_purchased
                              ? '#c53030' : '#1D9E75',
                          }}
                        />
                      </div>
                      <div style={styles.packageMeta}>
                        <span>
                          {Math.round(c.package_sales.minutes_used / 60 * 10) / 10}h used
                          {' of '}
                          {Math.round(c.package_sales.minutes_purchased / 60)}h
                        </span>
                        <span style={{
                          color: c.package_sales.minutes_used >= c.package_sales.minutes_purchased
                            ? '#c53030' : '#888'
                        }}>
                          {c.package_sales.minutes_used >= c.package_sales.minutes_purchased
                            ? '⚠️ Package complete'
                            : `${Math.round((c.package_sales.minutes_purchased - c.package_sales.minutes_used) / 60 * 10) / 10}h remaining`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Duration quick-tap buttons */}
                  <label style={styles.inputLabel}>Duration</label>
                  <div style={styles.quickBtns}>
                    {['45', '60', '90', '120'].map(min => (
                      <button
                        key={min}
                        style={{
                          ...styles.quickBtn,
                          background: durations[c.id] === min ? '#1a1a1a' : '#f0f0f0',
                          color: durations[c.id] === min ? '#fff' : '#1a1a1a',
                        }}
                        onClick={() => setDurations(prev => ({ ...prev, [c.id]: min }))}
                      >
                        {min === '60' ? '1h' : min === '90' ? '1h30' : min === '120' ? '2h' : '45min'}
                      </button>
                    ))}
                    <button
                      style={{
                        ...styles.quickBtn,
                        background: durations[c.id] && !['45','60','90','120'].includes(durations[c.id])
                          ? '#1a1a1a' : '#f0f0f0',
                        color: durations[c.id] && !['45','60','90','120'].includes(durations[c.id])
                          ? '#fff' : '#1a1a1a',
                      }}
                      onClick={() => setDurations(prev => ({ ...prev, [c.id]: 'other' }))}
                    >
                      other
                    </button>
                  </div>

                  {/* Free input — only shown when "other" is selected */}
                  {durations[c.id] === 'other' || (durations[c.id] && !['45','60','90','120'].includes(durations[c.id])) ? (
                    <input
                      style={{ ...styles.input, marginTop: '8px' }}
                      placeholder="e.g. 75, 1h15"
                      autoFocus
                      value={['45','60','90','120','other'].includes(durations[c.id]) ? '' : durations[c.id]}
                      onChange={e => setDurations(prev => ({ ...prev, [c.id]: e.target.value }))}
                    />
                  ) : null}

                  {/* Price — pre-filled, editable */}
                  <label style={styles.inputLabel}>Price</label>
                  <input
                    style={styles.input}
                    value={prices[c.id] ?? String(c.activities?.default_price || '')}
                    onChange={e => setPrices(prev => ({ ...prev, [c.id]: e.target.value }))}
                  />

                  <button
                    style={{ ...styles.confirmBtn, opacity: confirming === c.id ? 0.6 : 1 }}
                    onClick={() => confirmSession(c.id, c.activities?.default_price || 0)}
                    disabled={confirming === c.id}
                  >
                    {confirming === c.id ? 'Saving...' : '✓ Confirm session'}
                  </button>
                </div>
              ))}
            </>
          )}
          {done.length > 0 && (
            <>
              <div style={{ ...styles.sectionLabel, marginTop: '24px' }}>
                Confirmed today ({done.length})
              </div>
              {done.map(c => (
                <div key={c.id} style={styles.cardDone}>
                  <div style={styles.studentName}>{c.student_name}</div>
                  <div style={styles.studentMeta}>
                    {c.activities?.name} · ✓ Confirmed
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Download receipt */}
      {instructor && (
        <div style={{ padding: '16px', borderTop: '1px solid #eee', marginTop: '8px' }}>
          <a
            href={`/api/receipt/${instructor.id}?period=${new Date().toISOString().slice(0,7)}`}
            target="_blank"
            style={styles.receiptBtn}
          >
            ↓ Download this month's receipt
          </a>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f7f4ee', fontFamily: 'system-ui, sans-serif', maxWidth: '480px', margin: '0 auto' },
  header: { background: '#1a1a1a', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: '16px', fontWeight: 600 },
  headerSub: { fontSize: '11px', color: '#888', marginTop: '2px' },
  refreshBtn: { background: 'none', border: '1px solid #444', color: '#aaa', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  errorBanner: { background: '#fff3cd', color: '#856404', padding: '10px 20px', fontSize: '13px' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#888', fontSize: '15px' },
  list: { padding: '16px' },
  sectionLabel: { fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' },
  card: { background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardDone: { background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px', opacity: 0.6 },
  medicalAlert: { background: '#fff3cd', color: '#856404', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', marginBottom: '12px', fontWeight: 500 },
  studentName: { fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' },
  studentMeta: { fontSize: '12px', color: '#888', marginBottom: '14px' },
  inputLabel: { display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', marginTop: '12px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', background: '#fafafa', boxSizing: 'border-box' as const },
  confirmBtn: { width: '100%', padding: '12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', marginTop: '16px' },
  quickBtns: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '4px' },
  quickBtn: { flex: '1', padding: '10px 4px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'system-ui, sans-serif', minWidth: '48px' },
  packageBadge: { background: '#f8f8f8', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' },
  packageName: { fontSize: '12px', fontWeight: 500, color: '#1a1a1a', marginBottom: '6px' },
  packageBar: { height: '4px', background: '#e0e0e0', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' },
  packageFill: { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease' },
  packageMeta: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' },
  offlineBanner: { background: '#1a1a1a', color: '#fff', padding: '10px 20px', fontSize: '13px', textAlign: 'center' as const },
  syncingBanner: { background: '#1D9E75', color: '#fff', padding: '10px 20px', fontSize: '13px', textAlign: 'center' as const },
  queueBanner: { background: '#FAEEDA', color: '#854F0B', padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  syncBtn: { background: '#BA7517', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif' },
  receiptBtn: { display: 'block', textAlign: 'center' as const, padding: '12px', background: '#f0f0f0', color: '#1a1a1a', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 },
  alertOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(197, 48, 48, 0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
  alertBox: { background: '#fff', borderRadius: '16px', padding: '32px 24px', maxWidth: '380px', width: '100%', textAlign: 'center' },
  alertIcon: { fontSize: '48px', marginBottom: '12px' },
  alertTitle: { fontSize: '22px', fontWeight: 700, color: '#c53030', marginBottom: '6px' },
  alertStudent: { fontSize: '18px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' },
  alertCondition: { fontSize: '15px', color: '#444', background: '#fff5f5', borderRadius: '8px', padding: '12px', marginBottom: '16px', lineHeight: '1.5' },
  alertEmergency: { fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.5' },
  alertBtn: { width: '100%', padding: '14px', background: '#c53030', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' },
}
