'use client'

import { useEffect, useState } from 'react'

type ReceiptSession = {
  id: string
  session_date: string
  duration_min: number
  commission_amount: number | null
  activities: { name: string } | null
  users: { name: string } | null
}

type ReceiptData = {
  studentName: string
  packageName: string | null
  minutesPurchased: number
  minutesUsed: number
  pricePaid: number
  soldAt: string
  sessions: ReceiptSession[]
  studentId: string | null
  sport: string | null
}

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtHours(min: number) {
  return `${Math.round((min / 60) * 10) / 10}h`
}

function fmtDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** "Extrato do Pacote" — closing receipt for a package that's been fully
 *  consumed. Packages here are pre-paid at sale time (SellPackageFlowModal
 *  / /api/owner/sell-package), so finalizing this does NOT create a new
 *  charge — it only marks the package_sales row completed and shows what
 *  was already paid. Reuses the same session-history data
 *  StudentPackageHistoryModal shows (date/activity/instructor/duration),
 *  adding the purchase summary and a per-instructor commission rollup on
 *  top. */
export default function PackageReceiptModal({
  packageSaleId,
  t,
  onClose,
  onFinalized,
}: {
  packageSaleId: string
  t: Record<string, string>
  onClose: () => void
  onFinalized: () => void
}) {
  const [data, setData]         = useState<ReceiptData | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [finalized, setFinalized]   = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/owner/package-receipt/${packageSaleId}`)
      .then(r => r.json())
      .then(res => {
        if (cancelled) return
        if (res.ok) setData(res)
        else setError(res.error ?? 'Erro ao carregar extrato.')
      })
      .catch(() => { if (!cancelled) setError('Erro de rede ao carregar extrato.') })
    return () => { cancelled = true }
  }, [packageSaleId])

  async function finalize() {
    setFinalizing(true)
    setError(null)
    const res = await fetch('/api/owner/close-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageSaleId }),
    })
    const result = await res.json()
    setFinalizing(false)
    if (result.ok) setFinalized(true)
    else setError(result.error ?? 'Erro ao encerrar pacote')
  }

  // Instructor payout rollup — commission_amount already comes attached to
  // each session (getSessionsByStudentName selects it directly), so this is
  // a pure client-side grouping, no extra query.
  const payouts = data
    ? Object.values(
        data.sessions.reduce((acc, s) => {
          const name = s.users?.name ?? '—'
          if (!acc[name]) acc[name] = { name, total: 0, count: 0 }
          acc[name].total += s.commission_amount ?? 0
          acc[name].count += 1
          return acc
        }, {} as Record<string, { name: string; total: number; count: number }>)
      )
    : []

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 260, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !finalizing) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '560px',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '0.5px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--slate)' }}>
            {t.package_receipt_title} {data ? `— ${data.studentName}` : ''}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--mist)', padding: '4px 8px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--signal-light)', color: 'var(--signal)', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {!data ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
              Carregando...
            </div>
          ) : finalized ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--glacial-dark)', marginBottom: '16px' }}>
                {t.package_finalized_msg}
              </div>
              {data.studentId && data.sport ? (
                <a
                  href={`/api/owner/certificate/${data.studentId}/${data.sport}?type=hours`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--glacial-dark)', textDecoration: 'underline' }}
                >
                  {t.download_certificate_link}
                </a>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                  Certificado disponível na ficha do aluno assim que o cadastro estiver completo.
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--powder)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '4px' }}>
                    {t.hours_completed_label}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)' }}>
                    {fmtHours(data.minutesUsed)} / {fmtHours(data.minutesPurchased)}
                  </div>
                </div>
                <div style={{ background: 'var(--powder)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '4px' }}>
                    {t.total_paid_label}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)' }}>
                    {fmtBRL(data.pricePaid)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
                {t.session_history_label}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: 'var(--powder)' }}>
                    {[t.th_date, t.th_activity, t.th_instructor, 'Duração'].map(h => (
                      <th key={h} style={{
                        padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '600',
                        letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mist)',
                        borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < data.sessions.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>{fmtDate(s.session_date)}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: 'var(--slate)' }}>{s.activities?.name ?? '—'}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: 'var(--slate)' }}>{s.users?.name ?? '—'}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: 'var(--slate)', whiteSpace: 'nowrap' }}>{fmtHours(s.duration_min)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {payouts.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '8px' }}>
                    {t.instructor_payouts_label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    {payouts.map(p => (
                      <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--slate)' }}>{p.name} <span style={{ color: 'var(--mist)' }}>({p.count})</span></span>
                        <span style={{ fontWeight: '500', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(p.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* No payment-method line here — package_sales has no
                  currency/payment_method column, only price_paid (always
                  BRL). Showing "Total pago" without fabricating a method. */}

              <button
                onClick={finalize}
                disabled={finalizing}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-md px-4 py-3 text-sm transition-colors border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {finalizing ? t.confirming_btn : t.finalize_package_btn}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
