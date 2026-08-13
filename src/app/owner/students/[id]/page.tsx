import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAuthContext } from '@/lib/auth'
import { getStudentById, getSessionsByStudent, getActivePackageListByStudent, getLatestProgressionBySport } from '@/repositories/studentRepository'
import { getSignedWaiversByStudent } from '@/repositories/checkinRepository'
import { groupSessionsBySport, normalizeSportKey } from '@/lib/modality'
import { isProficientLevel } from '@/lib/levelProgression'
import ProgressionTabs from '@/components/ProgressionTabs'
import ProgressionHistory from '@/components/ProgressionHistory'
import CertificateSection from '@/components/CertificateSection'
import StudentProfileHeader from './StudentProfileHeader'
import ActivePackagesList from './ActivePackagesList'

// New IKO-style keys, plus the old beginner/intermediate/advanced ones kept
// as a display-only fallback for any row not yet touched by the
// 20260809000003 data migration.
const SKILL_LABELS: Record<string, string> = {
  level_1_discovery:    'Nível 1 · Discovery',
  level_2_intermediate: 'Nível 2 · Intermediate',
  level_3_independent:  'Nível 3 · Independent',
  beginner:     'Iniciante',
  intermediate: 'Intermediário',
  advanced:     'Avançado',
}

const SKILL_COLORS: Record<string, { bg: string; color: string }> = {
  level_1_discovery:    { bg: 'var(--glacial-light)', color: 'var(--glacial-dark)' },
  level_2_intermediate: { bg: 'var(--amber-light)',   color: 'var(--amber)'        },
  level_3_independent:  { bg: 'var(--signal-light)',  color: 'var(--signal-dark)'  },
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

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
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

  // By the time a child page renders, auth is guaranteed non-null (see
  // owner/settings/page.tsx for the same pattern) — the only case left to
  // handle here is unscoped master (no school of their own, and not
  // currently impersonating one via /master's "Acessar").
  const auth = await getAuthContext()
  const schoolId = auth!.isMaster ? auth!.impersonatingSchoolId : auth!.schoolId
  if (!schoolId) redirect('/master')

  let student: any
  try {
    student = await getStudentById(schoolId, id)
  } catch {
    notFound()
  }

  const [sessions, packageMap, signedWaivers, progressionBySport, requestHeaders] = await Promise.all([
    getSessionsByStudent(schoolId, student.name, student.id),
    getActivePackageListByStudent(schoolId),
    getSignedWaiversByStudent(schoolId, student.name),
    getLatestProgressionBySport(schoolId, student.id),
    headers(),
  ])
  const sportGroups = groupSessionsBySport(sessions as any)
  const siteOrigin = `https://${requestHeaders.get('host')}`

  // One card per active package/sport — a Kitesurf package and a Surf
  // package are genuinely separate balances, not one blended number.
  const activePackagesForStudent = packageMap.get(student.name) ?? []
  const totalRevenue = sessions.reduce((s: number, r: any) => s + (r.price ?? 0), 0)

  // Same normalized-key convention as checkPackageCapacity/getPackageBalanceForStudent
  // (case/whitespace-insensitive — packages.sport is free text) — drives
  // ProgressionTabs below. Falls back to the pre-existing single-kitesurf
  // default when no package has a recognizable sport (e.g. no packages yet).
  const studentSports = Array.from(new Set(
    activePackagesForStudent
      .map(pkg => normalizeSportKey(pkg.sport))
      .filter((s): s is string => !!s)
  ))
  if (studentSports.length === 0) studentSports.push('kitesurf')

  const totalSailingMinutes = sessions.reduce((s: number, r: any) => s + (r.duration_min ?? 0), 0)
  // IKO certification is skill-based, not time-based — a fast learner
  // shouldn't be blocked by an hours count. But it still requires the
  // sport to have at least one actual completed lesson: progressionBySport
  // is sourced from student_progression, which a level can be saved into
  // directly from this same page's ProgressionTabs regardless of session
  // history, so checking it alone could show "Elegível" for a sport with
  // zero completed lessons — a real contradiction against CertificateSection
  // just below, which only ever renders (and only ever evaluates
  // proficiency for) sports that already have a sportGroups entry. Gating
  // on sportGroups.keys() here mirrors that exactly, so the two can't
  // disagree the way they did before this fix.
  const certificateEligible = [...sportGroups.keys()].some(sportKey => isProficientLevel(progressionBySport.get(sportKey)?.level))

  return (
    <div>

      <StudentProfileHeader
        student={{
          id: student.id,
          name: student.name,
          email: student.email,
          whatsapp: student.whatsapp,
          nationality: student.nationality,
          health_conditions: student.health_conditions,
          created_at: student.created_at,
        }}
      />

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: certificateEligible ? '12px' : '24px',
      }}>
        {[
          { label: 'Aulas',    value: String(sessions.length) },
          { label: 'Total pago', value: fmt(totalRevenue)       },
          { label: 'Nível',    value: student.skill_level
            ? SKILL_LABELS[student.skill_level] ?? student.skill_level
            : '—'
          },
          { label: 'Horas de Velejo', value: fmtMin(totalSailingMinutes) },
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

      {/* IKO/VDWS certificate eligibility — skill-based, see certificateEligible above */}
      {certificateEligible && (
        <div style={{ marginBottom: '24px' }}>
          <span
            title="Nível 3 atingido em ao menos uma modalidade — elegível para o Certificado de Proficiência (IKO/VDWS)"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '99px',
              fontSize: '13px', fontWeight: '700',
              background: '#E8F5E9', color: '#2E7D32',
            }}
          >
            [ 📜 Elegível para Certificado ]
          </span>
        </div>
      )}

      {/* One card per active package — a student can hold more than one at
          once (most commonly one per sport: Kitesurf and Surf are
          genuinely separate balances), so this no longer collapses them
          into a single blended number that belonged to neither.
          minutes_purchased/minutes_used are per-sale as stored (no
          summing across packages here — see getActivePackageListByStudent),
          and deliberately not netted against other pending/future
          scheduled lessons (that's a separate, capacity-check-only
          concern — see getAvailablePackageMinutes) — "restantes" here
          always means "hours left on this specific package", full stop.
          Client component (see ActivePackagesList.tsx) for the payment
          badge + "Registrar Pagamento" settlement action. */}
      <ActivePackagesList packages={activePackagesForStudent} />

      <CertificateSection
        studentId={student.id}
        studentName={student.name}
        whatsapp={student.whatsapp}
        siteOrigin={siteOrigin}
        sportGroups={sportGroups}
        progressionBySport={progressionBySport}
      />

      {/* Signed waivers — compiled on-demand from each checkin's audit
          trail (see api/owner/checkin-waiver), not a pre-rendered file, so
          it can never drift from what's actually stored. */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px', marginBottom: '24px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)',
        }}>
          Termos assinados
        </div>
        {signedWaivers.length === 0 ? (
          <span style={{ fontSize: '13px', color: 'var(--mist)' }}>Nenhum termo assinado ainda</span>
        ) : (
          signedWaivers.map(w => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--slate)' }}>
                {fmtDateTime(w.waiver_signed_at)}
                {w.document_number && ` · ${w.document_number}`}
              </span>
              <a
                href={`/api/owner/checkin-waiver/${w.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px',
                  background: 'var(--slate)', color: '#fff',
                  borderRadius: '99px',
                  fontSize: '12px', fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                📄 Ver Termo Assinado (PDF)
              </a>
            </div>
          ))
        )}
      </div>

      {/* Progression editor — one tab per sport the student holds a package
          in, each with its own independent level/skills (see ProgressionTabs) */}
      <div style={{ marginBottom: '28px' }}>
        <ProgressionTabs
          studentId={student.id}
          studentName={student.name}
          sports={studentSports}
          progressionBySport={progressionBySport}
          fallbackLevel={student.skill_level ?? null}
        />
      </div>

      {/* Progression history */}
      <ProgressionHistory schoolId={schoolId} studentId={id} />

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
          Aulas
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Data', 'Atividade', 'Instrutor', 'Duração', 'Valor'].map(h => (
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
                  Nenhuma aula ainda.
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