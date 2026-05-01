'use client'

import React, { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/dashboard/sessions').then(r => r.json()),
      fetch('/api/dashboard/payments').then(r => r.json()),
    ]).then(([kpis, sess, pays]) => {
      setData(kpis)
      setSessions(sess.sessions || [])
      setPayments(pays.payments || [])
      setLoading(false)
    })
  }, [])

  function fmt(n: number) {
    return 'R$ ' + (n || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })
  }

  if (loading) return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Pico Base</div>
      </div>
      <div style={styles.loading}>Loading Base Camp...</div>
    </div>
  )

  const runway = data?.winter_runway_months || 0
  const runwayColor = runway >= 6 ? '#1D9E75'
    : runway >= 3 ? '#BA7517'
    : '#c53030'

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>Pico Base</div>
          <div style={styles.headerSub}>
            {data?.school_name} · Base Camp
          </div>
        </div>
      </div>

      <div style={styles.body}>

        {/* Winter Runway — hero metric */}
        <div style={{ ...styles.runwayCard, borderColor: runwayColor }}>
          <div style={styles.runwayLabel}>Winter Runway</div>
          <div style={{ ...styles.runwayNum, color: runwayColor }}>
            {runway.toFixed(1)}
          </div>
          <div style={styles.runwaySub}>months of off-season covered</div>
          <div style={{ ...styles.runwayBadge, background: runwayColor }}>
            {runway >= 6
              ? 'Healthy — full off-season covered'
              : runway >= 3
              ? `${(6 - runway).toFixed(1)} months uncovered`
              : 'At risk — review costs or revenue'}
          </div>
        </div>

        {/* KPI grid */}
        <div style={styles.kpiGrid}>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Season revenue</div>
            <div style={styles.kpiValue}>{fmt(data?.season_revenue)}</div>
          </div>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Crew commissions</div>
            <div style={styles.kpiValue}>{fmt(data?.crew_commissions)}</div>
          </div>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Total sessions</div>
            <div style={styles.kpiValue}>{data?.total_sessions || 0}</div>
          </div>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Avg ticket</div>
            <div style={styles.kpiValue}>{fmt(data?.avg_ticket)}</div>
          </div>
        </div>

        {/* Pending payments */}
        {payments.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              Pending payments ({payments.length})
            </div>
            {payments.map((p: any) => (
              <div key={p.id} style={styles.paymentRow}>
                <div>
                  <div style={styles.paymentName}>{p.users?.name}</div>
                  <div style={styles.paymentMeta}>
                    {p.sessions_count} sessions · {p.period}
                  </div>
                </div>
                <div style={styles.paymentAmount}>
                  {fmt(p.total_to_pay)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent sessions */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Recent sessions</div>
          {sessions.length === 0 ? (
            <div style={styles.empty}>No sessions yet this season.</div>
          ) : (
            sessions.slice(0, 10).map((s: any) => (
              <div key={s.id} style={styles.sessionRow}>
                <div>
                  <div style={styles.sessionStudent}>
                    {s.checkins?.student_name}
                  </div>
                  <div style={styles.sessionMeta}>
                    {s.activities?.name} · {s.duration_min}min ·{' '}
                    {s.users?.name}
                  </div>
                </div>
                <div style={styles.sessionPrice}>{fmt(s.price)}</div>
              </div>
            ))
          )}
        </div>

        <a href="/dashboard/close-month" style={styles.closeMonthBtn}>
          → Close the month & pay crew
        </a>

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f7f4ee',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    background: '#1a1a1a',
    color: '#fff',
    padding: '16px 20px',
  },
  logo: {
    fontSize: '16px',
    fontWeight: 600,
  },
  headerSub: {
    fontSize: '11px',
    color: '#888',
    marginTop: '2px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#888',
  },
  body: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '20px 16px',
  },
  runwayCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '16px',
    border: '2px solid',
  },
  runwayLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px',
  },
  runwayNum: {
    fontSize: '56px',
    fontWeight: 600,
    lineHeight: 1,
    marginBottom: '6px',
  },
  runwaySub: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '12px',
  },
  runwayBadge: {
    display: 'inline-block',
    color: '#fff',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '20px',
  },
  kpi: {
    background: '#fff',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  kpiLabel: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  kpiValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  section: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '12px',
  },
  empty: {
    color: '#aaa',
    fontSize: '13px',
    textAlign: 'center',
    padding: '20px 0',
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  paymentName: {
    fontSize: '14px',
    fontWeight: 500,
  },
  paymentMeta: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px',
  },
  paymentAmount: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  sessionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  sessionStudent: {
    fontSize: '14px',
    fontWeight: 500,
  },
  sessionMeta: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px',
  },
  sessionPrice: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
  },
  closeMonthBtn: {
    display: 'block',
    textAlign: 'center' as const,
    padding: '14px',
    background: '#1a1a1a',
    color: '#fff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    marginTop: '8px',
  },
}