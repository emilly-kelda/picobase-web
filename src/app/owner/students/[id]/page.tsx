import { notFound } from 'next/navigation'
import { getStudentById, getSessionsByStudent, getActivePackagesByStudent } from '@/repositories/studentRepository'
import ProgressionEditor from '@/components/ProgressionEditor'
import ProgressionHistory from '@/components/ProgressionHistory'

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

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtMin(m: number) {
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const min = m % 60
    return min > 0 ? `${h}h ${min}min` : `${h}h`
  }
  return `${m}min`
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let student: any
  try {
    student = await getStudentById(SCHOOL_ID, id)
  } catch {
    notFound()
  }

  const [sessions, packageMap] = await Promise.all([
    getSessionsByStudent(SCHOOL_ID, student.name, student.id),
    getActivePackagesByStudent(SCHOOL_ID),
  ])

  const pkg = packageMap.get(student.name)
  const totalRevenue = sessions.reduce((s: number, r: any) => s + (r.price ?? 0), 0)

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <a href="/owner/students" style={{
          fontSize: '13px', color: 'var(--mist)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          marginBottom: '16px',
        }}>
          ← Students
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--glacial-light)',
            color: 'var(--glacial-dark)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px', fontWeight: '600',
            flexShrink: 0,
          }}>
            {student.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h1 style={{
              fontSize: '22px', fontWeight: '500',
              color: 'var(--slate)', marginBottom: '4px',
            }}>
              {student.name}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
              {student.nationality ?? 'Unknown nationality'} · Student since {fmtDate(student.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {[
          { label: 'Sessions',   value: String(sessions.length) },
          { label: 'Total paid', value: fmt(totalRevenue)       },
          { label: 'Skill',      value: student.skill_level
            ? SKILL_LABELS[student.skill_level] ?? student.skill_level
            : '—'
          },
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

      {/* Active package progress */}
      {pkg && (() => {
        const pct = pkg.minutes_purchased > 0
          ? Math.round((pkg.minutes_used / pkg.minutes_purchased) * 100)
          : 0
        const barColor = pct >= 80
          ? 'var(--signal)'
          : pct >= 50
            ? '#D4A017'
            : 'var(--glacial)'
        return (
          <div style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '14px',
            }}>
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: '500',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--mist)', marginBottom: '4px',
                }}>
                  Active package
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
                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>used</div>
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

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--mist)',
            }}>
              <span>{fmtMin(pkg.minutes_used)} used</span>
              <span>{fmtMin(pkg.minutes_purchased - pkg.minutes_used)} remaining</span>
            </div>
          </div>
        )
      })()}

      {/* Contact & health */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {[
          { label: 'Email',             value: student.email             },
          { label: 'WhatsApp',          value: student.whatsapp          },
          { label: 'Health conditions', value: student.health_conditions },
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

      {/* Progression editor */}
      <div style={{ marginBottom: '28px' }}>
        <ProgressionEditor
          studentId={student.id}
          studentName={student.name}
          currentLevel={student.skill_level ?? 'beginner'}
          currentSkills={[]}
          sport="kitesurf"
        />
      </div>

      {/* Progression history */}
      <ProgressionHistory schoolId={SCHOOL_ID} studentId={id} />

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
          Sessions
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Activity', 'Instructor', 'Duration', 'Price'].map(h => (
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
                <td colSpan={5} style={{
                  padding: '40px 24px', textAlign: 'center',
                  fontSize: '13px', color: 'var(--mist)',
                }}>
                  No sessions yet.
                </td>
              </tr>
            ) : (
              sessions.map((s: any, i: number) => (
                <tr key={s.id} style={{
                  borderBottom: i < sessions.length - 1
                    ? '0.5px solid var(--border)' : 'none',
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
                    {s.duration_min}min
                  </td>
                  <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(s.price)}
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