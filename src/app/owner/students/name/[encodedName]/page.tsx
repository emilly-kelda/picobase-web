import { notFound } from 'next/navigation'
import {
  getSessionsByStudentName,
  getPackageSalesByStudentName,
  findStudentByName,
  getLatestCheckinByName,
} from '@/repositories/studentRepository'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

const SKILL_LABELS: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

const SKILL_COLORS: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: 'var(--glacial-light)', color: 'var(--glacial-dark)' },
  intermediate: { bg: 'var(--amber-light)',   color: 'var(--amber)'        },
  advanced:     { bg: 'var(--signal-light)',   color: 'var(--signal-dark)'  },
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d + (d.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtMin(m: number) {
  const h   = Math.floor(m / 60)
  const min = m % 60
  if (h === 0) return `${min}min`
  return min > 0 ? `${h}h ${min}min` : `${h}h`
}

export default async function StudentNameProfilePage({
  params,
}: {
  params: Promise<{ encodedName: string }>
}) {
  const { encodedName } = await params
  const studentName = decodeURIComponent(encodedName)

  const [sessions, packageSales, studentRow, latestCheckin, lang] = await Promise.all([
    getSessionsByStudentName(SCHOOL_ID, studentName),
    getPackageSalesByStudentName(SCHOOL_ID, studentName),
    findStudentByName(SCHOOL_ID, studentName),
    getLatestCheckinByName(SCHOOL_ID, studentName),
    getPortalLang(),
  ])

  if (!latestCheckin && sessions.length === 0 && packageSales.length === 0 && !studentRow) {
    notFound()
  }

  const t = getT(lang)

  // Merge data: students table > checkin fields
  const displayName    = studentRow?.name             ?? latestCheckin?.student_name ?? studentName
  const email          = studentRow?.email            ?? (latestCheckin as any)?.student_email    ?? null
  const whatsapp       = studentRow?.whatsapp         ?? (latestCheckin as any)?.student_whatsapp ?? null
  const nationality    = studentRow?.nationality      ?? (latestCheckin as any)?.student_nationality ?? null
  const healthRaw      = studentRow?.health_conditions ?? latestCheckin?.health_condition ?? null
  const skillLevel     = studentRow?.skill_level      ?? null

  // Best active package (prefer active, then most recent)
  const activePkg = packageSales.find(p => p.status === 'active') ?? packageSales[0] ?? null

  const totalRevenue = sessions.reduce((s: number, r: any) => s + (r.price ?? 0), 0)

  const initials = displayName
    .split(' ').slice(0, 2).map((n: string) => n[0] ?? '').join('').toUpperCase()

  const skill = skillLevel ? SKILL_COLORS[skillLevel] : null

  const isCheckinOnly = !studentRow

  return (
    <div>

      {/* Back link */}
      <a href="/owner/students" style={{
        fontSize: '13px', color: 'var(--mist)', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        marginBottom: '16px',
      }}>
        {t.back_students}
      </a>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          width: '48px', height: '48px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--glacial-light)',
          color: 'var(--glacial-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: '600', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--slate)' }}>
              {displayName}
            </h1>
            {isCheckinOnly && (
              <span style={{
                fontSize: '10px', fontWeight: '500',
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                background: 'var(--powder)',
                color: 'var(--mist)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Via check-in
              </span>
            )}
            {studentRow && (
              <a href={`/owner/students/${studentRow.id}`} style={{
                fontSize: '11px', color: 'var(--mist)', textDecoration: 'none',
                borderBottom: '1px dotted var(--border)',
              }}>
                Ver ficha completa →
              </a>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            {nationality ?? 'Nacionalidade desconhecida'}
            {latestCheckin && ` · Primeiro check-in ${fmtDate(latestCheckin.checkin_at)}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px', marginBottom: '24px',
      }}>
        {[
          { label: t.sessions_label, value: String(sessions.length) },
          { label: t.total_spent,    value: fmt(totalRevenue)       },
          { label: t.th_skill,
            value: skillLevel ? (SKILL_LABELS[skillLevel] ?? skillLevel) : '—' },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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

      {/* Package */}
      {activePkg ? (() => {
        const pct      = activePkg.minutes_purchased > 0
          ? Math.round((activePkg.minutes_used / activePkg.minutes_purchased) * 100)
          : 0
        const barColor = pct >= 80 ? 'var(--signal)' : pct >= 50 ? '#D4A017' : 'var(--glacial)'
        const isExhausted = (activePkg.minutes_purchased - activePkg.minutes_used) <= 0
        return (
          <div style={{
            background: '#fff',
            border: `0.5px solid ${isExhausted ? 'var(--signal)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px', marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: '14px',
            }}>
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: '500',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--mist)', marginBottom: '4px',
                }}>
                  {t.active_package}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--slate)' }}>
                  {(activePkg.packages as any)?.name ?? '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '24px', fontWeight: '600',
                  color: barColor, fontVariantNumeric: 'tabular-nums',
                }}>
                  {pct}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  {t.used_label}
                </div>
              </div>
            </div>
            <div style={{
              height: '6px', background: 'var(--powder)',
              borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '8px',
            }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: barColor, borderRadius: 'var(--radius-full)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--mist)' }}>
              <span>{fmtMin(activePkg.minutes_used)} {t.used_label}</span>
              <span>{fmtMin(Math.max(0, activePkg.minutes_purchased - activePkg.minutes_used))} {t.remaining_label}</span>
            </div>
          </div>
        )
      })() : (
        <div style={{
          background: 'var(--powder)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px', marginBottom: '24px',
          fontSize: '13px', color: 'var(--mist)',
        }}>
          Sem pacote registrado.
        </div>
      )}

      {/* Contact & health */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px', marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {[
          { label: 'Email',    value: email    },
          { label: 'WhatsApp', value: whatsapp },
          { label: t.health_label,
            value: healthRaw ?? 'Sem condições registradas' },
          { label: t.th_skill,
            value: skillLevel ? (SKILL_LABELS[skillLevel] ?? skillLevel) : '—' },
        ].map(item => (
          <div key={item.label}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '4px',
            }}>
              {item.label}
            </div>
            <div style={{ fontSize: '13px', color: item.value ? 'var(--slate)' : 'var(--mist)' }}>
              {item.value ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Skill badge if present */}
      {skill && skillLevel && (
        <div style={{ marginBottom: '24px' }}>
          <span style={{
            display: 'inline-block', padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px', fontWeight: '500',
            background: skill.bg, color: skill.color,
          }}>
            {SKILL_LABELS[skillLevel]}
          </span>
        </div>
      )}

      {/* Sessions table */}
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
          {t.session_history}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[t.th_date, t.th_activity, t.th_instructor, t.th_duration, t.th_price, t.th_commission].map(h => (
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
                <td colSpan={6} style={{
                  padding: '40px 24px', textAlign: 'center',
                  fontSize: '13px', color: 'var(--mist)',
                }}>
                  {t.no_sessions_yet}
                </td>
              </tr>
            ) : (
              sessions.map((s: any, i: number) => (
                <tr key={s.id} style={{
                  borderBottom: i < sessions.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                    {fmtDate(s.session_date)}
                  </td>
                  <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                    {(s.activities as any)?.name ?? '—'}
                  </td>
                  <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                    {(s.users as any)?.name ?? '—'}
                  </td>
                  <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--mist)' }}>
                    {s.duration_min ? `${s.duration_min}min` : '—'}
                  </td>
                  <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(s.price)}
                  </td>
                  <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--mist)', fontVariantNumeric: 'tabular-nums' }}>
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
