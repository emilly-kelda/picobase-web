import { cookies } from 'next/headers'
import { getRunwayData, getRunwayProjection } from '@/repositories/runwayRepository'
import { getRecentSessions, getTodayStats, getPendingLessons } from '@/repositories/sessionRepository'
import { getAlerts } from '@/repositories/alertRepository'
import { getInstructors } from '@/repositories/studentRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getScheduledLessons } from '@/repositories/scheduledLessonRepository'
import { getPackageSales } from '@/repositories/packageRepository'
import RunwayCalculator from '@/components/RunwayCalculator'
import PendingLessons from '@/components/PendingLessons'
import ScheduledLessons from '@/components/ScheduledLessons'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

const SEASON_COOKIE = 'active_season_id'

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
  const cookieStore = await cookies()
  const seasonId = cookieStore.get('active_season_id')?.value
  const [runway, sessions, alerts, today, lang, projection, pending, instructors, todayLessons, tomorrowLessons, activities, activePackages] = await Promise.all([
    getRunwayData(SCHOOL_ID, seasonId),
    getRecentSessions(SCHOOL_ID),
    getAlerts(SCHOOL_ID),
    getTodayStats(SCHOOL_ID),
    getPortalLang(),
    getRunwayProjection(SCHOOL_ID),
    getPendingLessons(SCHOOL_ID),
    getInstructors(SCHOOL_ID),
    getScheduledLessons(SCHOOL_ID, 'today'),
    getScheduledLessons(SCHOOL_ID, 'tomorrow'),
    getActivitiesForCheckin(SCHOOL_ID),
    getPackageSales(SCHOOL_ID, 50),
  ])
  const t = getT(lang)

  return (
    <div>
      <style>{`.tbl-name-link{color:var(--slate);text-decoration:none;border-bottom:1px solid transparent;transition:border-color 0.15s}.tbl-name-link:hover{border-bottom-color:var(--glacial)}`}</style>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          {t.basecamp_title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          {runway.current_season ?? t.basecamp_season} · {runway.school_name}
        </p>
      </div>

      {/* ── SECTION 1: ALERTS ── */}
      {alerts.length > 0 && (
        <div style={{
          background: '#fff',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}>
          {alerts.map((alert, i) => {
            const styles = {
              warning: { color: 'var(--amber)',        dot: '#D4A017'        },
              error:   { color: 'var(--signal-dark)',  dot: 'var(--signal)'  },
              info:    { color: 'var(--glacial-dark)', dot: 'var(--glacial)' },
            }
            const s = styles[alert.type]
            return (
              <a
                key={i}
                href={alert.link ?? '#'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderBottom: i < alerts.length - 1
                    ? '0.5px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  background: '#fff',
                }}
              >
                <span style={{
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: s.dot,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '13px',
                  color: s.color,
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {alert.message}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--border-strong)', flexShrink: 0 }}>
                  →
                </span>
              </a>
            )
          })}
        </div>
      )}

      {/* ── PENDING LESSONS ── */}
      <PendingLessons
        checkins={pending as any}
        instructors={instructors.map(i => ({
          id: i.id,
          name: i.name,
          commission_pct: (i as any).commission_pct ?? null,
        }))}
      />

      {/* ── SCHEDULED LESSONS ── */}
      <ScheduledLessons
        todayLessons={todayLessons as any}
        tomorrowLessons={tomorrowLessons as any}
        activities={activities}
        instructors={instructors.map(i => ({
          id: i.id,
          name: i.name,
          commission_pct: (i as any).commission_pct ?? null,
        }))}
        activePackages={(activePackages as any).filter((p: any) => p.status === 'active')}
      />

      {/* ── SECTION 2: TODAY ── */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)', marginBottom: '12px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{t.today_label}</span>
          {!today.hasActivity && (
            <span style={{
              fontSize: '11px', color: 'var(--mist)',
              fontWeight: '400', textTransform: 'none',
              letterSpacing: '0',
              background: 'var(--powder)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
            }}>
              Nenhuma atividade registrada hoje
            </span>
          )}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px', marginBottom: '28px',
        }}>
          {[
            { label: t.today_students,    value: String(today.students),    sub: t.today_checked_in, empty: today.students === 0    },
            { label: t.today_sessions,    value: String(today.sessions),    sub: t.today_confirmed,  empty: today.sessions === 0    },
            { label: t.today_instructors, value: String(today.instructors), sub: t.today_active,     empty: today.instructors === 0 },
          ].map(card => (
            <div key={card.label} style={{
              background: '#fff',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              opacity: card.empty ? 0.5 : 1,
              transition: 'opacity 0.2s',
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
                color: card.empty ? 'var(--mist)' : 'var(--slate)',
                lineHeight: '1', marginBottom: '4px',
                fontVariantNumeric: 'tabular-nums',
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
          {t.season_label}
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
            gridColumn: 'span 1',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)', marginBottom: '10px',
            }}>
              {t.runway_label}
            </div>

            {/* Main number */}
            <div style={{
              fontSize: '40px', fontWeight: '600',
              color: '#fff', lineHeight: '1',
              marginBottom: '2px', fontVariantNumeric: 'tabular-nums',
            }}>
              {runway.winter_runway_months?.toFixed(1) ?? '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
              {t.runway_sub}
            </div>

            {/* Progress bar toward 6-month target */}
            {projection && (
              <>
                <div style={{
                  height: '3px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginBottom: '6px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (projection.currentRunway / projection.targetMonths) * 100)}%`,
                    background: projection.currentRunway >= projection.targetMonths
                      ? '#00A896'
                      : projection.currentRunway >= 3
                        ? '#D4A017'
                        : '#E8471A',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.3)',
                  marginBottom: '14px',
                }}>
                  <span>0</span>
                  <span>Meta: {projection.targetMonths} meses</span>
                </div>

                {/* Projection rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {projection.daysLeft > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        Projeção ao fim da temporada
                      </span>
                      <span style={{
                        fontSize: '13px', fontWeight: '600',
                        color: projection.projectedRunway >= projection.targetMonths
                          ? '#00A896'
                          : projection.projectedRunway >= 3
                            ? '#D4A017'
                            : '#E8471A',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {projection.projectedRunway.toFixed(1)} meses
                      </span>
                    </div>
                  )}

                  {projection.gap > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: 'rgba(232,71,26,0.12)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        Faltam para 6 meses
                      </span>
                      <span style={{
                        fontSize: '13px', fontWeight: '600',
                        color: '#E8471A',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmt(projection.gap)}
                      </span>
                    </div>
                  )}

                  {projection.daysLeft > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                        Dias restantes na temporada
                      </span>
                      <span style={{
                        fontSize: '13px', fontWeight: '600',
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                        {projection.daysLeft}d
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
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
              {t.season_revenue}
            </div>
            <div style={{
              fontSize: '24px', fontWeight: '600',
              color: 'var(--slate)', lineHeight: '1',
              marginBottom: '4px', fontVariantNumeric: 'tabular-nums',
            }}>
              {fmt(runway.season_revenue)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
              {t.runway_this_season}
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
              {t.season_commissions}
            </div>
            <div style={{
              fontSize: '24px', fontWeight: '600',
              color: 'var(--slate)', lineHeight: '1',
              marginBottom: '4px', fontVariantNumeric: 'tabular-nums',
            }}>
              {fmt(runway.crew_commissions)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
              {t.runway_to_pay}
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
              {t.season_profit}
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
              {t.runway_after}
            </div>
          </div>

        </div>
      </div>

      {/* ── SECTION 3B: RUNWAY CALCULATOR ── */}
      <RunwayCalculator
        seasonProfit={runway.season_profit ?? 0}
        burnRate={runway.burn_rate ?? 5000}
        daysLeft={projection?.daysLeft}
        projectedRunway={projection?.projectedRunway}
        gap={projection?.gap}
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
            {t.recent_sessions}
          </span>
          <a href="/owner/sessions" style={{
            fontSize: '12px', color: 'var(--glacial)', textDecoration: 'none',
          }}>
            {t.view_all}
          </a>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[t.th_date, t.th_student, t.th_activity, t.th_instructor, t.th_duration, t.th_price, t.th_commission].map(h => (
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
                  {t.no_sessions}
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
                    {(() => {
                      const raw = (s as any).instructor
                      const user = Array.isArray(raw) ? raw[0] : raw
                      if (!user?.name) return <span style={{ fontSize: '13px', color: 'var(--slate)' }}>—</span>
                      if (!user?.id)   return <span style={{ fontSize: '13px', color: 'var(--slate)' }}>{user.name}</span>
                      return (
                        <a href={`/owner/crew/${user.id}`} className="tbl-name-link">
                          {user.name}
                        </a>
                      )
                    })()}
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


