'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function PartnerPortal() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/partner/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
  }, [id])

  function fmt(n: number) {
    return 'R$ ' + (n || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR')
  }

  if (loading) return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Pico Base</div>
      </div>
      <div style={styles.empty}>Loading...</div>
    </div>
  )

  if (error) return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>Pico Base</div>
      </div>
      <div style={styles.empty}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div>Portal not found.</div>
        <div style={{ fontSize: '13px', color: '#aaa', marginTop: '6px' }}>
          Contact the school for your access link.
        </div>
      </div>
    </div>
  )

  const totalPending = data.referrals
    .filter((r: any) => r.status === 'pending')
    .reduce((s: number, r: any) => s + r.commission_amount, 0)

  const totalPaid = data.referrals
    .filter((r: any) => r.status === 'paid')
    .reduce((s: number, r: any) => s + r.commission_amount, 0)

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>Pico Base</div>
          <div style={styles.headerSub}>Partner Portal</div>
        </div>
      </div>

      <div style={styles.body}>

        {/* Partner info */}
        <div style={styles.partnerCard}>
          <div style={styles.partnerName}>{data.partner.name}</div>
          <div style={styles.partnerMeta}>
            {data.partner.type} · {data.partner.commission_pct * 100}% commission
          </div>
          <div style={styles.partnerSchool}>
            Partner of {data.school.name}
          </div>
        </div>

        {/* KPI grid */}
        <div style={styles.kpiGrid}>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Pending payment</div>
            <div style={{ ...styles.kpiValue, color: totalPending > 0 ? '#BA7517' : '#1a1a1a' }}>
              {fmt(totalPending)}
            </div>
          </div>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Total paid</div>
            <div style={{ ...styles.kpiValue, color: '#1D9E75' }}>
              {fmt(totalPaid)}
            </div>
          </div>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Students referred</div>
            <div style={styles.kpiValue}>{data.referrals.length}</div>
          </div>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Commission rate</div>
            <div style={styles.kpiValue}>
              {data.partner.commission_pct * 100}%
            </div>
          </div>
        </div>

        {/* Referrals list */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Referrals</div>
          {data.referrals.length === 0 ? (
            <div style={styles.empty}>No referrals yet.</div>
          ) : (
            data.referrals.map((r: any) => (
              <div key={r.id} style={styles.referralRow}>
                <div>
                  <div style={styles.referralStudent}>
                    {r.package_sales?.student_name || 'Student'}
                  </div>
                  <div style={styles.referralMeta}>
                    {r.period} · {r.package_sales?.packages?.name || 'Package'}
                  </div>
                </div>
                <div style={styles.referralRight}>
                  <div style={styles.referralAmount}>
                    {fmt(r.commission_amount)}
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    background: r.status === 'paid' ? '#EAF3DE' : '#FAEEDA',
                    color: r.status === 'paid' ? '#3B6D11' : '#854F0B',
                  }}>
                    {r.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Monthly summary */}
        {data.monthly.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Monthly summary</div>
            {data.monthly.map((m: any) => (
              <div key={m.period} style={styles.monthRow}>
                <div style={styles.monthPeriod}>{m.period}</div>
                <div style={styles.monthStudents}>{m.count} students</div>
                <div style={styles.monthAmount}>{fmt(m.total)}</div>
                <div style={{
                  ...styles.statusBadge,
                  background: m.status === 'paid' ? '#EAF3DE' : '#FAEEDA',
                  color: m.status === 'paid' ? '#3B6D11' : '#854F0B',
                }}>
                  {m.status}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.footer}>
          Questions about your commissions?
          Contact {data.school.name} directly.
        </div>

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
  logo: { fontSize: '16px', fontWeight: 600 },
  headerSub: { fontSize: '11px', color: '#888', marginTop: '2px' },
  body: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '20px 16px',
  },
  partnerCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    borderLeft: '4px solid #BA7517',
  },
  partnerName: { fontSize: '18px', fontWeight: 600, marginBottom: '4px' },
  partnerMeta: { fontSize: '13px', color: '#888', marginBottom: '2px' },
  partnerSchool: { fontSize: '12px', color: '#aaa' },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '16px',
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
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  kpiValue: { fontSize: '18px', fontWeight: 600 },
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
  empty: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#888',
    fontSize: '14px',
  },
  referralRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  referralStudent: { fontSize: '14px', fontWeight: 500 },
  referralMeta: { fontSize: '12px', color: '#888', marginTop: '2px' },
  referralRight: { textAlign: 'right' as const },
  referralAmount: { fontSize: '14px', fontWeight: 600 },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: 500,
    marginTop: '4px',
  },
  monthRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  monthPeriod: { fontSize: '13px', fontWeight: 500, flex: 1 },
  monthStudents: { fontSize: '12px', color: '#888' },
  monthAmount: { fontSize: '14px', fontWeight: 600 },
  footer: {
    fontSize: '12px',
    color: '#aaa',
    textAlign: 'center' as const,
    padding: '16px 0',
  },
}
