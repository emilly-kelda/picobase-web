import { getPackages, getPackageSales, getPackageSaleTotals } from '@/repositories/packageRepository'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number | null | undefined) {
  if (n == null) return '�'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtMinutes(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: 'var(--glacial-light)', color: 'var(--glacial-dark)', label: 'Active'    },
  completed: { bg: 'var(--powder)',        color: 'var(--mist)',         label: 'Completed' },
  cancelled: { bg: 'var(--signal-light)',  color: 'var(--signal-dark)',  label: 'Cancelled' },
  expired:   { bg: 'var(--powder)',        color: 'var(--mist)',         label: 'Expired'   },
}

const TYPE_LABELS: Record<string, string> = {
  lesson:      'Lesson',
  trip:        'Trip',
  rental:      'Rental',
  supervision: 'Supervision',
}

export default async function PackagesPage() {
  const [packages, sales, totals, lang] = await Promise.all([
    getPackages(SCHOOL_ID),
    getPackageSales(SCHOOL_ID),
    getPackageSaleTotals(SCHOOL_ID),
    getPortalLang(),
  ])
  const t = getT(lang)

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          {t.packages_title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          {t.packages_sub}
        </p>
      </div>

      {/* Totals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '32px',
      }}>
        {[
          { label: t.total_sold,        value: String(totals.total)                },
          { label: t.active_label,      value: String(totals.active)               },
          { label: t.revenue_label,     value: fmt(totals.revenue)                 },
          { label: t.minutes_remaining, value: fmtMinutes(totals.minutesRemaining) },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: '500',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--mist)',
            }}>
              {card.label}
            </span>
            <span style={{
              fontSize: '18px', fontWeight: '600',
              color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
            }}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Package catalogue */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          fontSize: '13px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '12px',
        }}>
          {t.catalogue_label}
        </div>
        {packages.length === 0 ? (
          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '32px',
            textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
          }}>
            {t.no_packages}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '10px',
          }}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{
                background: '#fff',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px', fontWeight: '500',
                      color: 'var(--slate)', marginBottom: '4px',
                    }}>
                      {pkg.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                      {pkg.sport} � {TYPE_LABELS[pkg.type] ?? pkg.type}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '18px', fontWeight: '600',
                      color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                    }}>
                      {fmt(pkg.final_price ?? pkg.base_price)}
                    </div>
                    {pkg.discount_pct > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                        {Math.round(pkg.discount_pct * 100)}% off
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'flex', gap: '16px',
                  paddingTop: '12px',
                  borderTop: '0.5px solid var(--border)',
                }}>
                  {pkg.total_minutes && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '2px' }}>{t.duration_label}</div>
                      <div style={{ fontSize: '13px', color: 'var(--slate)', fontWeight: '500' }}>
                        {fmtMinutes(pkg.total_minutes)}
                      </div>
                    </div>
                  )}
                  {pkg.base_price !== (pkg.final_price ?? pkg.base_price) && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '2px' }}>{t.original_label}</div>
                      <div style={{ fontSize: '13px', color: 'var(--mist)', textDecoration: 'line-through' }}>
                        {fmt(pkg.base_price)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales table */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '0.5px solid var(--border)',
          fontSize: '14px', fontWeight: '500', color: 'var(--slate)',
        }}>
          {t.recent_sales}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[t.th_date, t.th_name, t.th_package, t.th_instructor, t.th_paid, t.th_progress, t.th_status].map(h => (
                <th key={h} style={{
                  padding: '10px 24px', textAlign: 'left',
                  fontSize: '11px', fontWeight: '500',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--mist)', background: 'var(--powder)',
                  borderBottom: '0.5px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '40px 24px', textAlign: 'center',
                  fontSize: '13px', color: 'var(--mist)',
                }}>
                  {t.no_sales}
                </td>
              </tr>
            ) : (
              sales.map((s, i) => {
                const pct = s.minutes_purchased > 0
                  ? Math.round((s.minutes_used / s.minutes_purchased) * 100)
                  : 0
                const st = STATUS_STYLES[s.status] ?? STATUS_STYLES.active
                return (
                  <tr key={s.id} style={{
                    borderBottom: i < sales.length - 1
                      ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                      {fmtDate(s.sold_at)}
                    </td>
                    <td style={{ padding: '13px 24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                        {s.student_name}
                      </div>
                      {s.student_nationality && (
                        <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                          {s.student_nationality}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                      {(s.packages as any)?.name ?? '�'}
                    </td>
                    <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                      {(s.users as any)?.name ?? '�'}
                    </td>
                    <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(s.price_paid)}
                    </td>
                    <td style={{ padding: '13px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1, height: '4px',
                          background: 'var(--powder)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                          minWidth: '60px',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: pct >= 100 ? 'var(--mist)' : 'var(--glacial)',
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                          {fmtMinutes(s.minutes_used)} / {fmtMinutes(s.minutes_purchased)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 24px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px', fontWeight: '500',
                        background: st.bg, color: st.color,
                      }}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}


