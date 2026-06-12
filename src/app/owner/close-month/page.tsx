'use client'

import React, { useState, useEffect } from 'react'

export default function CloseMonthPage() {
  const [period, setPeriod] = useState(
    new Date().toISOString().slice(0, 7)
  )
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPayments()
  }, [period])

  async function loadPayments() {
    setLoading(true)
    const res = await fetch(`/api/dashboard/close-month?period=${period}`)
    const data = await res.json()
    setPayments(data.payments || [])
    setLoading(false)
  }

  async function closeMonth() {
    setClosing(true)
    setMessage('')
    const res = await fetch('/api/dashboard/close-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    })
    const data = await res.json()
    if (data.ok) {
      setMessage(`✅ ${data.payments_created} payment records created`)
      loadPayments()
    } else {
      setMessage('❌ ' + data.error)
    }
    setClosing(false)
  }

  async function approvePayment(id: string) {
    await fetch('/api/dashboard/approve-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: id }),
    })
    loadPayments()
  }

  async function approveAll() {
    const pending = payments.filter(p => p.status === 'pending')
    for (const p of pending) {
      await approvePayment(p.id)
    }
  }

  function fmt(n: number) {
    return 'R$ ' + (n || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })
  }

  const totalPending  = payments
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + p.total_to_pay, 0)

  const totalApproved = payments
    .filter(p => p.status === 'approved')
    .reduce((s, p) => s + p.total_to_pay, 0)

  const allApproved = payments.length > 0 &&
    payments.every(p => p.status === 'approved' || p.status === 'paid')

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>Pico Base</div>
          <div style={styles.headerSub}>Close the month</div>
        </div>
        <a href="/dashboard" style={styles.backBtn}>← Dashboard</a>
      </div>

      <div style={styles.body}>

        {/* Period selector */}
        <div style={styles.periodRow}>
          <div style={styles.periodLabel}>Period</div>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={styles.periodInput}
          />
        </div>

        {message && (
          <div style={styles.messageBanner}>{message}</div>
        )}

        {/* Close month button */}
        {payments.length === 0 && !loading && (
          <div style={styles.section}>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '16px' }}>
              No payment records for {period} yet.
              Click below to calculate commissions from all confirmed sessions.
            </p>
            <button
              style={{
                ...styles.primaryBtn,
                opacity: closing ? 0.7 : 1
              }}
              onClick={closeMonth}
              disabled={closing}
            >
              {closing ? 'Calculating...' : `Close ${period} →`}
            </button>
          </div>
        )}

        {/* Payment records */}
        {payments.length > 0 && (
          <>
            {/* Summary */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Pending approval</div>
                <div style={{ ...styles.summaryValue, color: '#BA7517' }}>
                  {fmt(totalPending)}
                </div>
              </div>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Approved</div>
                <div style={{ ...styles.summaryValue, color: '#1D9E75' }}>
                  {fmt(totalApproved)}
                </div>
              </div>
            </div>

            {/* Approve all button */}
            {!allApproved && (
              <button style={styles.primaryBtn} onClick={approveAll}>
                ✓ Approve all payments
              </button>
            )}

            {/* Export buttons */}
            {allApproved && (
              <div style={styles.exportRow}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
                  All payments approved. Export for payment:
                </div>
                <div style={styles.exportBtns}>
                  <a
                    href={`/api/dashboard/export?period=${period}&format=wise`}
                    style={styles.exportBtn}
                  >
                    ↓ Wise CSV
                  </a>
                  <a
                    href={`/api/dashboard/export?period=${period}&format=btg`}
                    style={styles.exportBtnSecondary}
                  >
                    ↓ BTG PIX CSV
                  </a>
                </div>
              </div>
            )}

            {/* Payment list */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                Crew payments — {period}
              </div>
              {payments.map(p => (
                <div key={p.id} style={styles.paymentCard}>
                  <div style={styles.paymentTop}>
                    <div>
                      <div style={styles.paymentName}>
                        {p.users?.name}
                      </div>
                      <div style={styles.paymentMeta}>
                        {p.sessions_count} sessions ·{' '}
                        {(p.commission_pct * 100).toFixed(0)}% commission
                      </div>
                    </div>
                    <div style={styles.paymentRight}>
                      <div style={styles.paymentTotal}>
                        {fmt(p.total_to_pay)}
                      </div>
                      <div style={{
                        ...styles.statusBadge,
                        background: p.status === 'approved' ? '#EAF3DE'
                          : p.status === 'paid' ? '#E6F1FB' : '#FAEEDA',
                        color: p.status === 'approved' ? '#3B6D11'
                          : p.status === 'paid' ? '#185FA5' : '#854F0B',
                      }}>
                        {p.status}
                      </div>
                    </div>
                  </div>

                  <div style={styles.paymentDetails}>
                    <span>Revenue: {fmt(p.revenue_generated)}</span>
                    <span>Commission: {fmt(p.commission_amount)}</span>
                    {p.bonus > 0 && <span>Bonus: {fmt(p.bonus)}</span>}
                  </div>

                  {p.users?.pix_key && (
                    <div style={styles.pixKey}>
                      PIX: {p.users.pix_key}
                    </div>
                  )}

                  <div style={styles.paymentActions}>
                    {p.status === 'pending' && (
                      <button
                        style={styles.approveBtn}
                        onClick={() => approvePayment(p.id)}
                      >
                        ✓ Approve
                      </button>
                    )}
                    <a
                      href={`/api/receipt/${p.users?.id}?period=${period}`}
                      target="_blank"
                      style={styles.receiptLink}
                    >
                      ↓ Receipt PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { fontSize: '16px', fontWeight: 600 },
  headerSub: { fontSize: '11px', color: '#888', marginTop: '2px' },
  backBtn: {
    color: '#888',
    fontSize: '13px',
    textDecoration: 'none',
  },
  body: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '20px 16px',
  },
  periodRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  periodLabel: { fontSize: '14px', fontWeight: 500 },
  periodInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'system-ui, sans-serif',
  },
  messageBanner: {
    background: '#f0f0f0',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  section: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '12px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '12px',
  },
  summaryCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: 600,
  },
  primaryBtn: {
    width: '100%',
    padding: '13px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    marginBottom: '12px',
    display: 'block',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  exportRow: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  exportBtns: {
    display: 'flex',
    gap: '10px',
  },
  exportBtn: {
    flex: 1,
    padding: '12px',
    background: '#1D9E75',
    color: '#fff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'center' as const,
  },
  exportBtnSecondary: {
    flex: 1,
    padding: '12px',
    background: '#f0f0f0',
    color: '#1a1a1a',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'center' as const,
  },
  paymentCard: {
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '14px',
    marginBottom: '14px',
  },
  paymentTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
  },
  paymentName: { fontSize: '15px', fontWeight: 600 },
  paymentMeta: { fontSize: '12px', color: '#888', marginTop: '2px' },
  paymentRight: { textAlign: 'right' as const },
  paymentTotal: { fontSize: '16px', fontWeight: 600 },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: 500,
    marginTop: '4px',
  },
  paymentDetails: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#888',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
  },
  pixKey: {
    fontSize: '11px',
    color: '#aaa',
    fontFamily: 'monospace',
    marginBottom: '8px',
  },
  paymentActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  approveBtn: {
    padding: '7px 16px',
    background: '#1D9E75',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
  },
  receiptLink: {
    padding: '7px 16px',
    background: '#f0f0f0',
    color: '#1a1a1a',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
  },
}

