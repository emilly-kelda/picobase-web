import { getRunwayData } from '@/repositories/runwayRepository'
import { getRecentSessions, getTodayStats } from '@/repositories/sessionRepository'
import { getAlerts } from '@/repositories/alertRepository'
import RunwayCalculator from '@/components/RunwayCalculator'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })
}

export default async function OwnerPage() {
  const [runway, sessions, alerts, today] = await Promise.all([
    getRunwayData(SCHOOL_ID),
    getRecentSessions(SCHOOL_ID),
    getAlerts(SCHOOL_ID),
    getTodayStats(SCHOOL_ID),
  ])

  return (
    <div>
      <style>{`.tbl-name-link{color:var(--slate);text-decoration:none;border-bottom:1px solid transparent;transition:border-color 0.15s}.tbl-name-link:hover{border-bottom-color:var(--glacial)}`}</style>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Base Camp
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          {runway.current_season ?? 'Current season'} · {runway.school_name}
        </p>
      </div>

      {/* ── SECTION 1: ALERTS ── */}
      {alerts.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: '8px', marginBottom: '28px',
        }}>
          {alerts.map((alert, i) => {
            const styles = {
              warning: { bg: 'var(--amber-light)',   border: '#D4A017',       color: 'var(--amber)',       dot: '#D4A017'       },
              error:   { bg: 'var(--signal-light)',  border: 'var(--signal)', color: 'var(--signal-dark)', dot: 'var(--signal)' },
              info:    { bg: 'var(--glacial-light)', border: 'var(--glacial)',color: 'var(--glacial-dark)',dot: 'var(--glacial)' },
            }
            const s = styles[alert.type]
            return (
              <a key={i} href={alert.link ?? '#'} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                background: s.bg,
                border: `0.5px solid ${s.border}`,
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: s.dot, flexShrink: 0,
                }} />
                <span style={{ fontSize: '13px', color: s.color, flex: 1 }}>
                  {alert.message}
                </span>
                <span style={{ fontSize: '12px', color: s.color, opacity: 0.5 }}>→</span>
              </a>
            )
          })}
        </div>
      )}

      {/* ── SECTION 2: TODAY ── */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)', marginBottom: '12px',
        }}>
          Today
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px', marginBottom: '28px',
        }}>
          {[
            { label: 'Students',    value: String(today.students),    sub: 'checked in today'  },
            { label: 'Sessions',    value: String(today.sessions),    sub: 'confirmed today'   },
            { label: 'Instructors', value: String(today.instructors), sub: 'active today'      },
          ].map(card => (
            <div key={card.label} style={{
              background: '#fff',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '500',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '10px',
              }}>
                {card.label}
              </div>
              <div style={{
                fontSize: '36px', fontWeight: '600',
                color: 'var(--slate)', lineHeight: '1',
                marginBottom: '4px', fontVariantNumeric: 'tabular-nums',
              }}>
                {card.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: SEASON METRICS ── */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)', marginBottom: '12px',
        }}>
          Season
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px', marginBottom: '28px',
        }}>

          <div style={{
            background: '#1B4B5A',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)', marginBottom: '10px',
            }}>
              Off-Season Runway
            </div>
            <div style={{
              fontSize: '36px', fontWeight: '600',
              color: '#fff', lineHeight: '1',
              marginBottom: '4px', fontVariantNumeric: 'tabular-nums',
            }}>
              {runway.winter_runway_months?.toFixed(1) ?? '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              months covered
            </div>
          </div>

          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '10px',
            }}>
              Season Revenue
            </div>
            <div style={{
              fontSize: '24px', fontWeight: '600',
              color: 'var(--slate)', lineHeight: '1',
              marginBottom: '4px', fontVariantNumeric: 'tabular-nums',
            }}>
              {fmt(runway.season_revenue)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
              this season
            </div>
          </div>

          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '10px',
            }}>
              Crew Commissions
            </div>
            <div style={{
              fontSize: '24px', fontWeight: '600',
              color: 'var(--slate)', lineHeight: '1',
              marginBottom: '4px', fontVariantNumeric: 'tabular-nums',
            }}>
              {fmt(runway.crew_commissions)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
              to pay this season
            </div>
          </div>

          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '10px',
            }}>
              Season Profit
            </div>
            <div style={{
              fontSize: '24px', fontWeight: '600',
              lineHeight: '1', marginBottom: '4px',
              fontVariantNumeric: 'tabular-nums',
              color: runway.season_profit != null && runway.season_profit > 0
                ? 'var(--glacial-dark)' : 'var(--signal)',
            }}>
              {fmt(runway.season_profit)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
              after commissions
            </div>
          </div>

        </div>
      </div>

      {/* ── SECTION 3B: RUNWAY CALCULATOR ── */}
      <RunwayCalculator
        seasonProfit={runway.season_profit ?? 0}
        burnRate={runway.burn_rate ?? 5000}
      />

      {/* ── SECTION 4: RECENT SESSIONS ── */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--slate)' }}>
            Recent sessions
          </span>
          <a href="/owner/sessions" style={{
            fontSize: '12px', color: 'var(--glacial)', textDecoration: 'none',
          }}>
            View all →
          </a>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Student', 'Activity', 'Instructor', 'Duration', 'Price', 'Commission'].map(h => (
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
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '40px 24px', textAlign: 'center',
                  fontSize: '13px', color: 'var(--mist)',
                }}>
                  No sessions yet.
                </td>
              </tr>
            ) : (
              sessions.map((s, i) => (
                <tr key={s.id} style={{
                  borderBottom: i < sessions.length - 1
                    ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                    {fmtDate(s.session_date)}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                    {(s.checkins as any)?.student_name ? (
                      <a
                        className="tbl-name-link"
                        style={{ fontWeight: '500' }}
                        href={`/owner/students?search=${encodeURIComponent((s.checkins as any).student_name)}`}
                      >
                        {(s.checkins as any).student_name}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                    {(s.activities as any)?.name ?? '—'}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                    {(s.users as any)?.name ? (
                      <a
                        className="tbl-name-link"
                        href={`/owner/crew/${(s.users as any).id}`}
                      >
                        {(s.users as any).name}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--mist)' }}>
                    {s.duration_min}min
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(s.price)}
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--mist)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(s.commission_amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

