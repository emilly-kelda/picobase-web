import { getPackageDashboard } from '@/repositories/packageRepository'
import SellPackageButton from '@/components/SellPackageButton'
import PackagePriceEditor from '@/components/PackagePriceEditor'
import Link from 'next/link'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtH(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

export default async function PackagesPage() {
  const { summary, packageTypes, atRiskSales } = await getPackageDashboard(SCHOOL_ID)

  const summaryCards = [
    {
      label: 'Receita de pacotes',
      value: fmt(summary.totalRevenue),
      color: 'var(--slate)',
      bg:    '#fff',
    },
    {
      label: 'Horas restantes',
      value: fmtH(summary.totalMinutesRemaining),
      color: summary.totalMinutesRemaining > 0 ? '#8A5E00' : 'var(--glacial-dark)',
      bg:    summary.totalMinutesRemaining > 0 ? '#FFF8E8' : '#E0F8F5',
      sub:   'a entregar aos alunos',
    },
    {
      label: 'Receita não realizada',
      value: fmt(summary.unrealizedRevenue),
      color: '#8A5E00',
      bg:    '#FFF8E8',
      sub:   'receita pré-paga ainda não entregue',
    },
    {
      label: 'Utilização',
      value: `${summary.utilizationPct}%`,
      color: summary.utilizationPct >= 70 ? 'var(--glacial-dark)'
           : summary.utilizationPct >= 40 ? '#8A5E00'
           : 'var(--signal-dark)',
      bg:    '#fff',
    },
    {
      label: 'Em risco de expirar',
      value: String(summary.atRiskCount),
      color: summary.atRiskCount > 0 ? 'var(--signal-dark)' : 'var(--glacial-dark)',
      bg:    summary.atRiskCount > 0 ? 'var(--signal-light)' : '#E0F8F5',
      sub:   summary.atRiskCount > 0 ? 'sem uso há mais de 21 dias' : 'tudo em dia',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '4px',
          }}>
            Pacotes
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Horas vendidas, entregues e ainda devidas
          </p>
        </div>
      </div>

      {/* ── SECTION 1: Summary metrics ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px', marginBottom: '32px',
      }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{
            background: card.bg,
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '8px',
              lineHeight: '1.4',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: '600',
              color: card.color, fontVariantNumeric: 'tabular-nums',
              marginBottom: card.sub ? '4px' : '0',
            }}>
              {card.value}
            </div>
            {card.sub && (
              <div style={{ fontSize: '11px', color: 'var(--mist)', lineHeight: '1.4' }}>
                {card.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── SECTION 2: Package types table ── */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '14px 24px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)',
          }}>
            Tipos de pacote
          </span>
          <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
            {packageTypes.length} pacotes configurados
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--powder)' }}>
              {[
                'Pacote', 'Preço', 'Vendidos', 'Receita',
                'Horas vendidas', 'Horas utilizadas', 'Horas restantes',
                'Utilização', '',
              ].map((h, i) => (
                <th key={i} style={{
                  padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right',
                  fontSize: '10px', fontWeight: '500',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--mist)',
                  borderBottom: '0.5px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {packageTypes.map((pkg, i) => (
              <tr key={pkg.id} style={{
                borderBottom: i < packageTypes.length - 1
                  ? '0.5px solid var(--border)' : 'none',
                background: pkg.hasNoSales ? 'var(--powder)' : '#fff',
              }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{
                    fontSize: '14px', fontWeight: '500',
                    color: pkg.hasNoSales ? 'var(--mist)' : 'var(--slate)',
                  }}>
                    {pkg.name}
                  </div>
                  {pkg.hasNoSales && (
                    <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>
                      Sem vendas ainda
                    </div>
                  )}
                </td>
                <td style={{
                  padding: '14px 16px', textAlign: 'right',
                  fontSize: '13px', color: 'var(--mist)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <PackagePriceEditor
                    packageId={pkg.id}
                    currentPrice={pkg.price ?? 0}
                    schoolId={SCHOOL_ID}
                  />
                </td>
                <td style={{
                  padding: '14px 16px', textAlign: 'right',
                  fontSize: '14px', fontWeight: '500',
                  color: pkg.hasNoSales ? 'var(--mist)' : 'var(--slate)',
                }}>
                  {pkg.count}
                </td>
                <td style={{
                  padding: '14px 16px', textAlign: 'right',
                  fontSize: '14px', fontWeight: '500',
                  color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                }}>
                  {pkg.hasNoSales ? '—' : fmt(pkg.revenue)}
                </td>
                <td style={{
                  padding: '14px 16px', textAlign: 'right',
                  fontSize: '13px', color: 'var(--mist)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pkg.hasNoSales ? '—' : fmtH(pkg.minutesSold)}
                </td>
                <td style={{
                  padding: '14px 16px', textAlign: 'right',
                  fontSize: '13px', color: 'var(--mist)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pkg.hasNoSales ? '—' : fmtH(pkg.minutesUsed)}
                </td>
                <td style={{
                  padding: '14px 16px', textAlign: 'right',
                  fontSize: '14px', fontWeight: '600',
                  color: pkg.minutesRemaining > 0 ? '#8A5E00' : 'var(--mist)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pkg.hasNoSales ? '—' : fmtH(pkg.minutesRemaining)}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  {!pkg.hasNoSales && (
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: '8px', justifyContent: 'flex-end',
                    }}>
                      <div style={{
                        width: '60px', height: '4px',
                        background: 'var(--powder)',
                        borderRadius: '99px', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pkg.utilPct}%`,
                          background: pkg.utilPct >= 70 ? 'var(--glacial)'
                            : pkg.utilPct >= 40 ? '#D4A017' : 'var(--signal)',
                          borderRadius: '99px',
                        }} />
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: '500',
                        color: pkg.utilPct >= 70 ? 'var(--glacial-dark)'
                          : pkg.utilPct >= 40 ? '#8A5E00' : 'var(--signal-dark)',
                        minWidth: '32px', textAlign: 'right',
                      }}>
                        {pkg.utilPct}%
                      </span>
                    </div>
                  )}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <SellPackageButton
                    packageId={pkg.id}
                    packageName={pkg.name}
                    price={pkg.price ?? 0}
                    schoolId={SCHOOL_ID}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── SECTION 3: At-risk students ── */}
      {atRiskSales.length > 0 ? (
        <div style={{
          background: '#fff',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 24px',
            borderBottom: '0.5px solid var(--border)',
            background: 'var(--signal-light)',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: '500',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--signal-dark)',
            }}>
              Pacotes em risco · {atRiskSales.length}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--signal-dark)' }}>
              Sem uso há mais de 21 dias com menos de 30% utilizado
            </span>
          </div>

          {atRiskSales.map((sale, i) => {
            const initials = sale.studentName
              .split(' ')
              .slice(0, 2)
              .map((n: string) => n[0] ?? '')
              .join('')
              .toUpperCase()

            return (
              <div key={sale.id} style={{
                display: 'flex', alignItems: 'center',
                gap: '16px', padding: '14px 24px',
                borderBottom: i < atRiskSales.length - 1
                  ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--signal-light)', color: 'var(--signal-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '600', flexShrink: 0,
                }}>
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px', fontWeight: '500',
                    color: 'var(--slate)', marginBottom: '2px',
                  }}>
                    {sale.studentName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    {sale.packageName} · último uso há {sale.daysSince} dias
                  </div>
                </div>

                <div style={{ width: '120px' }}>
                  <div style={{
                    height: '4px', background: 'var(--powder)',
                    borderRadius: '99px', overflow: 'hidden', marginBottom: '4px',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.round(sale.pctUsed * 100)}%`,
                      background: 'var(--signal)',
                      borderRadius: '99px',
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mist)', textAlign: 'center' }}>
                    {fmtH(sale.minutesUsed)} / {fmtH(sale.minutesPurchased)}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '15px', fontWeight: '600',
                    color: 'var(--signal-dark)', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmtH(sale.minutesRemaining)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                    restantes
                  </div>
                </div>

                {sale.studentId && (
                  <Link
                    href={`/owner/students/${sale.studentId}`}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--powder)',
                      border: '0.5px solid var(--border)',
                      borderRadius: '99px',
                      fontSize: '12px', color: 'var(--mist)',
                      textDecoration: 'none', flexShrink: 0,
                    }}
                  >
                    Ver aluno →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          background: '#E0F8F5',
          border: '0.5px solid var(--glacial)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>✓</span>
          <div>
            <div style={{
              fontSize: '14px', fontWeight: '500',
              color: 'var(--glacial-dark)',
            }}>
              Nenhum pacote em risco
            </div>
            <div style={{
              fontSize: '12px', color: 'var(--glacial-dark)', opacity: 0.7,
            }}>
              Todos os alunos estão utilizando seus pacotes regularmente.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
