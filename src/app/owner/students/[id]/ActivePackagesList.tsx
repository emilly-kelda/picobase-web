'use client'

import { useState } from 'react'
import { normalizeSportKey } from '@/lib/modality'
import PackagePaymentModal from '@/components/PackagePaymentModal'

type ActivePackage = {
  id: string
  minutes_purchased: number
  minutes_used: number
  price_paid: number
  amount_paid: number
  payment_method: string | null
  package_name: string
  sport: string | null
}

function fmtMin(m: number) {
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const min = m % 60
    return min > 0 ? `${h}h ${min}min` : `${h}h`
  }
  return `${m}min`
}

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n)
}

// Mirrors getPackagePaymentStatus in src/repositories/packageRepository.ts —
// duplicated (not imported) since that file pulls in createServiceClient
// and must never end up in a client bundle.
function paymentStatus(pricePaid: number, amountPaid: number): 'paid' | 'partial' | 'pending' {
  if (amountPaid >= pricePaid) return 'paid'
  if (amountPaid > 0) return 'partial'
  return 'pending'
}

const STATUS_BADGE: Record<'paid' | 'partial' | 'pending', { label: string; bg: string; color: string }> = {
  paid:    { label: 'Pago',      bg: 'var(--signal-light)', color: 'var(--signal-dark)' },
  partial: { label: 'Parcial',   bg: 'var(--amber-light)',  color: 'var(--amber)'        },
  pending: { label: 'Pendente',  bg: 'var(--amber-light)',  color: 'var(--amber)'        },
}

/** One card per active package (see getActivePackageListByStudent) — a
 *  student can hold more than one at once, most commonly one per sport, so
 *  this doesn't collapse them into one blended number. Client component
 *  (unlike the rest of this mostly-server page) only because the payment
 *  badge/settlement action needs local open/close state. */
export default function ActivePackagesList({ packages }: { packages: ActivePackage[] }) {
  const [payingFor, setPayingFor] = useState<ActivePackage | null>(null)

  if (packages.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
      {packages.map(pkg => {
        const remaining = Math.max(0, pkg.minutes_purchased - pkg.minutes_used)
        const pct = pkg.minutes_purchased > 0
          ? Math.round((pkg.minutes_used / pkg.minutes_purchased) * 100)
          : 0
        const barColor = pct >= 80
          ? 'var(--signal)'
          : pct >= 50
            ? '#D4A017'
            : 'var(--glacial)'
        const sportKey = normalizeSportKey(pkg.sport)
        const status = paymentStatus(pkg.price_paid, pkg.amount_paid)
        const badge = STATUS_BADGE[status]
        const balanceDue = Math.max(0, pkg.price_paid - pkg.amount_paid)

        return (
          <div key={pkg.id} style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
          }}>
            <a href={sportKey ? `#evolucao-${sportKey}` : undefined} style={{
              display: 'block', textDecoration: 'none',
              cursor: sportKey ? 'pointer' : 'default',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '14px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--mist)',
                    }}>
                      Pacote ativo ({fmtMin(pkg.minutes_purchased)} totais)
                    </span>
                    {pkg.sport && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        fontSize: '10px', fontWeight: '600', color: 'var(--glacial-dark)',
                        background: 'var(--glacial-light)', textTransform: 'capitalize',
                      }}>
                        {pkg.sport}
                      </span>
                    )}
                    <span style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      fontSize: '10px', fontWeight: '600', color: badge.color,
                      background: badge.bg,
                    }}>
                      {status === 'pending' ? badge.label : `${badge.label} · ${fmtBRL(pkg.amount_paid)}/${fmtBRL(pkg.price_paid)}`}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '15px', fontWeight: '500',
                    color: 'var(--slate)',
                  }}>
                    {pkg.package_name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '24px', fontWeight: '600',
                    color: barColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {pct}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mist)' }}>utilizado</div>
                </div>
              </div>

              <div style={{
                height: '6px',
                background: 'var(--powder)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                marginBottom: '8px',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: barColor,
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease',
                }} />
              </div>

              <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                <span style={{ color: 'var(--slate)', fontWeight: '500' }}>{fmtMin(remaining)} restantes</span>
                {' • '}{fmtMin(pkg.minutes_used)} concluídas ({pct}%)
              </div>
            </a>

            {status !== 'paid' && (
              <button
                type="button"
                onClick={() => setPayingFor(pkg)}
                style={{
                  marginTop: '12px', padding: '7px 14px',
                  border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
                  background: '#fff', color: 'var(--slate)',
                  fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Registrar Pagamento
              </button>
            )}

            {payingFor?.id === pkg.id && (
              <PackagePaymentModal
                packageSaleId={pkg.id}
                packageName={pkg.package_name}
                remaining={balanceDue}
                onClose={() => setPayingFor(null)}
                onSaved={() => setPayingFor(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
