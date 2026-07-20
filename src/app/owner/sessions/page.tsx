import { getSessions, getSessionTotals } from '@/repositories/sessionRepository'
import { getScheduledLessonsList } from '@/repositories/scheduledLessonRepository'
import { getInstructors } from '@/repositories/studentRepository'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import { LEVEL_LABELS, isLevel } from '@/lib/levels'
import AutoRefresh from '@/components/AutoRefresh'

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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`
}

// Same canonical modality list + prefix-match convention used elsewhere
// (scheduledLessonRepository.ts's detectModality, ScheduledLessons.tsx's
// activityMatchesSport) — normalize then .startsWith(), not a substring
// check, since "Surf" is a substring of both "Kitesurf" and "Windsurf".
const MODALITY_KEYWORDS = ['kitesurf', 'wingfoil', 'kitefoil', 'surf', 'windsurf'] as const
const MODALITY_LABELS: Record<string, string> = {
  kitesurf: 'Kitesurf', wingfoil: 'Wingfoil', kitefoil: 'Kitefoil',
  surf: 'Surf', windsurf: 'Windsurf',
}
function detectModality(activityName: string | null | undefined): string | null {
  const normalized = (activityName ?? '').toLowerCase().replace(/[^a-z]/g, '')
  return MODALITY_KEYWORDS.find(m => normalized.startsWith(m)) ?? null
}

const PAYMENT_LABELS: Record<string, { label: string; icon: string }> = {
  pix:       { label: 'PIX',       icon: '⚡' },
  dinheiro:  { label: 'Dinheiro',  icon: '💵' },
  cartao:    { label: 'Cartão',    icon: '💳' },
  a_receber: { label: 'A receber', icon: '⏳' },
}

const ORIGIN_LABELS: Record<string, string> = {
  direct:   'Direct',
  partner:  'Partner',
  online:   'Online',
  referral: 'Referral',
}

const ORIGIN_COLORS: Record<string, { bg: string; color: string }> = {
  direct:   { bg: 'var(--powder)',        color: 'var(--mist)'         },
  partner:  { bg: 'var(--glacial-light)', color: 'var(--glacial-dark)' },
  online:   { bg: 'var(--amber-light)',   color: 'var(--amber)'        },
  referral: { bg: 'var(--glacial-light)', color: 'var(--glacial-dark)' },
}

function renderInstructorCell(user: { id?: string; name?: string; role?: string } | null | undefined) {
  if (!user?.name) return <span style={{ color: 'var(--slate)' }}>—</span>
  const badge = user.role === 'owner' && (
    <span style={{
      padding: '1px 6px',
      borderRadius: '4px',
      background: '#EDE9FE',
      color: '#5B21B6',
      fontSize: '10px',
      fontWeight: '600',
      marginLeft: '4px',
    }}>
      Dono
    </span>
  )
  // The owner isn't a crew member (getCrewMembers excludes role='owner'),
  // so /owner/crew/[id] would 404 for them — render plain text instead.
  if (!user?.id || user.role === 'owner') {
    return <span style={{ color: 'var(--slate)' }}>{user.name}{badge}</span>
  }
  return (
    <a className="tbl-name-link" href={`/owner/crew/${user.id}`}>
      {user.name}
    </a>
  )
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; instructor?: string; tab?: string; origin?: string }>
}) {
  const { month, instructor, tab, origin } = await searchParams
  const activeTab: 'realizadas' | 'agendadas' = tab === 'agendadas' ? 'agendadas' : 'realizadas'
  const activeOrigin = origin === 'direct' || origin === 'partner' ? origin : undefined

  const currentMonth = new Date().toISOString().slice(0, 7)
  const activeMonth = month ?? currentMonth

  const filters = {
    month: activeMonth,
    instructorId: instructor,
    origin: activeOrigin,
  }

  const [sessions, totals, instructors, lang, scheduledLessons] = await Promise.all([
    getSessions(SCHOOL_ID, filters),
    getSessionTotals(SCHOOL_ID, filters),
    getInstructors(SCHOOL_ID),
    getPortalLang(),
    getScheduledLessonsList(SCHOOL_ID, filters),
  ])
  const t = getT(lang)

  const forecastRevenue = scheduledLessons.reduce(
    (sum, l) => sum + (((l.activities as any)?.default_price as number | null) ?? 0), 0
  )

  // Origin mix — binary Partner vs. everything-else ("Direct"), matching
  // the same two buckets the quick filters above offer, not the full
  // direct/partner/online/referral vocabulary ORIGIN_LABELS has.
  const partnerCount = sessions.filter(s => (s.origin ?? 'direct') === 'partner').length
  const directCount  = sessions.length - partnerCount
  const partnerPct   = sessions.length > 0 ? (partnerCount / sessions.length) * 100 : 0
  const directPct    = 100 - partnerPct

  // Market share by sport — bucketed from the free-text activity name via
  // the same modality-detection convention used elsewhere in the app,
  // since sessions/activities carry no dedicated sport column.
  const sportBuckets = new Map<string, { count: number; revenue: number }>()
  for (const s of sessions) {
    const modality = detectModality((s.activities as any)?.name) ?? 'outros'
    const label = MODALITY_LABELS[modality] ?? 'Outros'
    const bucket = sportBuckets.get(label) ?? { count: 0, revenue: 0 }
    bucket.count += 1
    bucket.revenue += s.price ?? 0
    sportBuckets.set(label, bucket)
  }
  const sportShare = Array.from(sportBuckets.entries())
    .map(([label, b]) => ({
      label,
      count: b.count,
      revenue: b.revenue,
      pct: totals.revenue > 0 ? (b.revenue / totals.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  function tabHref(target: 'realizadas' | 'agendadas') {
    const params = new URLSearchParams()
    params.set('tab', target)
    if (month) params.set('month', month)
    if (instructor) params.set('instructor', instructor)
    if (activeOrigin) params.set('origin', activeOrigin)
    return `?${params.toString()}`
  }

  function originHref(target: 'all' | 'direct' | 'partner') {
    const params = new URLSearchParams()
    params.set('tab', activeTab)
    if (month) params.set('month', month)
    if (instructor) params.set('instructor', instructor)
    if (target !== 'all') params.set('origin', target)
    return `?${params.toString()}`
  }

  return (
    <div>
      <style>{`.tbl-name-link{color:var(--slate);text-decoration:none;border-bottom:1px solid transparent;transition:border-color 0.15s}.tbl-name-link:hover{border-bottom-color:var(--glacial)}`}</style>

      {/* Page header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '4px',
          }}>
            {t.sessions_title}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            {t.sessions_sub}
          </p>
        </div>
        <AutoRefresh />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {([
          ['realizadas', t.tab_completed],
          ['agendadas',  t.tab_scheduled],
        ] as const).map(([key, label]) => (
          <a
            key={key}
            href={tabHref(key)}
            style={{
              padding: '7px 16px', borderRadius: '99px',
              fontSize: '13px', fontWeight: '500',
              textDecoration: 'none', fontFamily: 'var(--font-sans)',
              background: activeTab === key ? 'var(--slate)' : '#fff',
              color: activeTab === key ? '#fff' : 'var(--mist)',
              border: activeTab === key ? '0.5px solid var(--slate)' : '0.5px solid var(--border-strong)',
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" style={{
        display: 'flex', gap: '10px',
        alignItems: 'center', marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <input type="hidden" name="tab" value={activeTab} />
        <input type="hidden" name="origin" value={activeOrigin ?? ''} />
        <select
          name="month"
          defaultValue={activeMonth}
          style={{
            padding: '9px 14px',
            border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px', color: 'var(--slate)',
            background: '#fff', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', outline: 'none',
          }}
        >
          {monthOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          name="instructor"
          defaultValue={instructor ?? ''}
          style={{
            padding: '9px 14px',
            border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px', color: 'var(--slate)',
            background: '#fff', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', outline: 'none',
          }}
        >
          <option value="">{t.all_instructors}</option>
          {instructors.map(ins => (
            <option key={ins.id} value={ins.id}>{ins.name}</option>
          ))}
        </select>

        <button type="submit" style={{
          padding: '9px 16px',
          background: '#fff',
          border: '0.5px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px', color: 'var(--slate)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
        }}>
          {t.filter_btn}
        </button>

        {(month || instructor || activeOrigin) && (
          <a href="/owner/sessions" style={{
            fontSize: '13px', color: 'var(--mist)', textDecoration: 'none',
          }}>
            {t.students_clear}
          </a>
        )}

        {/* Origin quick filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            ['all',     t.origin_all],
            ['direct',  t.origin_direct],
            ['partner', t.origin_partners],
          ] as const).map(([key, label]) => {
            const active = key === 'all' ? !activeOrigin : activeOrigin === key
            return (
              <a
                key={key}
                href={originHref(key)}
                style={{
                  padding: '7px 14px', borderRadius: '99px',
                  fontSize: '12px', fontWeight: '500',
                  textDecoration: 'none', fontFamily: 'var(--font-sans)',
                  background: active ? 'var(--slate)' : 'var(--powder)',
                  color: active ? '#fff' : 'var(--mist)',
                }}
              >
                {label}
              </a>
            )
          })}
        </div>
      </form>

      {/* Totals bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {[
          { label: t.today_sessions,    value: String(totals.count)    },
          { label: t.season_revenue,    value: fmt(totals.revenue)     },
          { label: t.season_commissions,value: fmt(totals.commissions) },
          { label: t.avg_ticket,        value: fmt(totals.avgTicket)   },
          { label: t.avg_duration,      value: `${totals.avgDuration}min` },
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

      {/* Distribution panel — origin mix + sport market share, both derived
          from the same filtered `sessions` array the totals bar and table
          already use, so they react to month/instructor/origin exactly like
          everything else on this page. Realizadas only: distribution by
          revenue doesn't mean anything for scheduled-but-unconfirmed lessons. */}
      {activeTab === 'realizadas' && sessions.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
          marginBottom: '20px',
        }}>
          {/* Mix de Origem */}
          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '14px',
            }}>
              {t.origin_mix_title}
            </div>
            <div style={{
              display: 'flex', height: '10px', borderRadius: '99px',
              overflow: 'hidden', marginBottom: '10px',
            }}>
              <div style={{ width: `${partnerPct}%`, background: 'var(--glacial)' }} />
              <div style={{ width: `${directPct}%`, background: 'var(--slate)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '99px', background: 'var(--glacial)', display: 'inline-block' }} />
                <span style={{ color: 'var(--slate)' }}>{t.origin_partners}</span>
                <span style={{ color: 'var(--mist)', fontVariantNumeric: 'tabular-nums' }}>
                  {partnerCount} · {Math.round(partnerPct)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '99px', background: 'var(--slate)', display: 'inline-block' }} />
                <span style={{ color: 'var(--slate)' }}>{t.origin_direct}</span>
                <span style={{ color: 'var(--mist)', fontVariantNumeric: 'tabular-nums' }}>
                  {directCount} · {Math.round(directPct)}%
                </span>
              </div>
            </div>
          </div>

          {/* Market Share por Esporte */}
          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '14px',
            }}>
              {t.sport_share_title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sportShare.map(row => (
                <div key={row.label}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '12px', marginBottom: '4px',
                  }}>
                    <span style={{ color: 'var(--slate)', fontWeight: '500' }}>{row.label}</span>
                    <span style={{ color: 'var(--mist)', fontVariantNumeric: 'tabular-nums' }}>
                      {row.count} · {Math.round(row.pct)}%
                    </span>
                  </div>
                  <div style={{
                    height: '6px', background: 'var(--powder)',
                    borderRadius: '99px', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${row.pct}%`,
                      background: 'var(--glacial)', borderRadius: '99px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Discreet forecast — scheduled lessons aren't confirmed revenue, so
          this stays visually secondary to the totals bar above rather than
          another card of the same weight. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '20px', fontSize: '12px', color: 'var(--mist)',
      }}>
        <span style={{
          padding: '2px 9px', borderRadius: '99px',
          border: '1px dashed var(--border-strong)',
          fontWeight: '500', fontVariantNumeric: 'tabular-nums',
        }}>
          {t.scheduled_forecast}: {fmt(forecastRevenue)} · {scheduledLessons.length}
        </span>
      </div>

      {activeTab === 'realizadas' ? (
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[t.th_date, t.th_student, t.th_activity, t.th_instructor, t.th_duration, t.th_origin, 'Pagamento', t.th_price, t.th_comm_pct, t.th_commission].map(h => (
                <th key={h} style={{
                  padding: '10px 20px',
                  textAlign: 'left',
                  fontSize: '11px', fontWeight: '500',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--mist)',
                  background: 'var(--powder)',
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
                <td colSpan={10} style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  fontSize: '13px', color: 'var(--mist)',
                }}>
                  {t.no_sessions_period}
                </td>
              </tr>
            ) : (
              sessions.map((s, i) => {
                const origin = s.origin ?? 'direct'
                const oc = ORIGIN_COLORS[origin] ?? ORIGIN_COLORS.direct
                return (
                  <tr key={s.id} style={{
                    borderBottom: i < sessions.length - 1
                      ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                      {fmtDate(s.session_date)}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                      {(s.checkins as any)?.student_name ? (
                        <a
                          className="tbl-name-link"
                          style={{ fontWeight: '500' }}
                          href={`/owner/students/name/${encodeURIComponent((s.checkins as any).student_name)}`}
                        >
                          {(s.checkins as any).student_name}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                      {(s.activities as any)?.name ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                      {renderInstructorCell(Array.isArray((s as any).instructor) ? (s as any).instructor[0] : (s as any).instructor)}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)' }}>
                      {s.duration_min}min
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px', fontWeight: '500',
                        background: oc.bg, color: oc.color,
                      }}>
                        {ORIGIN_LABELS[origin] ?? origin}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      {s.payment_method ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 8px', borderRadius: '99px',
                          background: s.payment_method === 'a_receber' ? '#FEF3C7' : '#E0F8F5',
                          color: s.payment_method === 'a_receber' ? '#92400E' : '#007868',
                          fontSize: '11px', fontWeight: '500',
                        }}>
                          {PAYMENT_LABELS[s.payment_method]?.icon}{' '}{PAYMENT_LABELS[s.payment_method]?.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--mist)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(s.price)}
                      {s.currency && s.currency !== 'BRL' && (
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: s.currency === 'EUR' ? '#EEF3FC' : '#EDE9FE',
                          color: s.currency === 'EUR' ? '#1A4B8A' : '#4B1AA8',
                          fontSize: '10px',
                          fontWeight: '600',
                          marginLeft: '4px',
                        }}>
                          {s.currency}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)' }}>
                      {fmtPct(s.commission_pct)}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(s.commission_amount)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      ) : (
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[t.th_datetime, t.th_student, t.th_activity, t.th_instructor, t.th_duration, t.th_skill, t.th_status].map(h => (
                <th key={h} style={{
                  padding: '10px 20px',
                  textAlign: 'left',
                  fontSize: '11px', fontWeight: '500',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--mist)',
                  background: 'var(--powder)',
                  borderBottom: '0.5px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scheduledLessons.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  fontSize: '13px', color: 'var(--mist)',
                }}>
                  {t.no_scheduled_lessons}
                </td>
              </tr>
            ) : (
              scheduledLessons.map((s, i) => (
                <tr key={s.id} style={{
                  borderBottom: i < scheduledLessons.length - 1
                    ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                    {fmtDateTime(s.scheduled_at)}
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                    <a
                      className="tbl-name-link"
                      style={{ fontWeight: '500' }}
                      href={`/owner/students/name/${encodeURIComponent(s.student_name)}`}
                    >
                      {s.student_name}
                    </a>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                    {(s.activities as any)?.name ?? '—'}
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                    {renderInstructorCell(Array.isArray((s as any).instructor) ? (s as any).instructor[0] : (s as any).instructor)}
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)' }}>
                    {s.duration_min}min
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                    {isLevel(s.level) ? LEVEL_LABELS[s.level][lang] : '—'}
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px', fontWeight: '500',
                      background: 'var(--amber-light)', color: 'var(--amber)',
                    }}>
                      {t.status_scheduled}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

    </div>
  )
}


