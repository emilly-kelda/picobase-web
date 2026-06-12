import { getSessions, getSessionTotals } from '@/repositories/sessionRepository'
import { getInstructors } from '@/repositories/studentRepository'

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

function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`
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

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; instructor?: string }>
}) {
  const { month, instructor } = await searchParams

  const currentMonth = new Date().toISOString().slice(0, 7)
  const activeMonth = month ?? currentMonth

  const filters = {
    month: activeMonth,
    instructorId: instructor,
  }

  const [sessions, totals, instructors] = await Promise.all([
    getSessions(SCHOOL_ID, filters),
    getSessionTotals(SCHOOL_ID, filters),
    getInstructors(SCHOOL_ID),
  ])

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  return (
    <div>
      <style>{`.tbl-name-link{color:var(--slate);text-decoration:none;border-bottom:1px solid transparent;transition:border-color 0.15s}.tbl-name-link:hover{border-bottom-color:var(--glacial)}`}</style>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Sessions
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Full session log
        </p>
      </div>

      {/* Filters */}
      <form method="GET" style={{
        display: 'flex', gap: '10px',
        alignItems: 'center', marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
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
          <option value="">All instructors</option>
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
          Filter
        </button>

        {(month || instructor) && (
          <a href="/owner/sessions" style={{
            fontSize: '13px', color: 'var(--mist)', textDecoration: 'none',
          }}>
            Clear
          </a>
        )}
      </form>

      {/* Totals bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {[
          { label: 'Sessions',    value: String(totals.count)    },
          { label: 'Revenue',     value: fmt(totals.revenue)     },
          { label: 'Commissions', value: fmt(totals.commissions) },
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

      {/* Sessions table */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Student', 'Activity', 'Instructor', 'Duration', 'Origin', 'Price', 'Comm. %', 'Commission'].map(h => (
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
                <td colSpan={9} style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  fontSize: '13px', color: 'var(--mist)',
                }}>
                  No sessions found for this period.
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
                          href={`/owner/students?search=${encodeURIComponent((s.checkins as any).student_name)}`}
                        >
                          {(s.checkins as any).student_name}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                      {(s.activities as any)?.name ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                      {(s.users as any)?.name ? (
                        <a
                          className="tbl-name-link"
                          href={`/owner/crew/${(s.users as any).id}`}
                        >
                          {(s.users as any).name}
                        </a>
                      ) : '—'}
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
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(s.price)}
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

    </div>
  )
}

