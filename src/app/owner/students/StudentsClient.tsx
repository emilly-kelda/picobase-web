'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddStudentModal from './AddStudentModal'
import ScheduleFromCheckinModal from '@/components/ScheduleFromCheckinModal'
import SellPackageFlowModal, { type PackageOption } from '@/components/SellPackageFlowModal'

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

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// IKO/VDWS autonomy certificate — 10h of completed (realized) water time.
const CERTIFICATE_ELIGIBLE_MINUTES = 10 * 60

function fmtHours(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}` : `${h}h`
}

function HoursOfSailing({ minutes }: { minutes: number }) {
  const eligible = minutes >= CERTIFICATE_ELIGIBLE_MINUTES
  return (
    <div>
      <div style={{ fontSize: '13px', color: 'var(--slate)', whiteSpace: 'nowrap' }}>
        Horas de Velejo: {fmtHours(minutes)}
      </div>
      {eligible && (
        <span
          title="10h+ de aula concluídas — elegível para o Certificado de Autonomia (IKO/VDWS)"
          style={{
            display: 'inline-block', marginTop: '4px',
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            fontSize: '11px', fontWeight: '700',
            background: '#E8F5E9', color: '#2E7D32',
            whiteSpace: 'nowrap',
          }}
        >
          [ 📜 Elegível para Certificado ]
        </span>
      )}
    </div>
  )
}

function RowActions({
  name, t, onSchedule, onSell,
}: {
  name: string
  t: Record<string, string>
  onSchedule: (name: string) => void
  onSell: (name: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        onClick={() => onSchedule(name)}
        style={{
          padding: '5px 12px', background: 'transparent', color: '#007868',
          border: '0.5px solid #007868', borderRadius: 'var(--radius-md)',
          fontSize: '11px', fontWeight: '600', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
        }}
      >
        [ {t.action_schedule} ]
      </button>
      <button
        onClick={() => onSell(name)}
        style={{
          padding: '5px 12px', background: 'var(--slate)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: '11px', fontWeight: '600', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
        }}
      >
        [ {t.action_charge} ]
      </button>
    </div>
  )
}

export default function StudentsClient({
  students,
  total,
  packageMap,
  checkinOnly,
  search,
  t,
  activities,
  instructors,
  packageTypes,
  hoursMap,
}: {
  students: any[]
  total: number
  packageMap: Map<string, { package_name: string; minutes_purchased: number; minutes_used: number }>
  checkinOnly: any[]
  search?: string
  t: Record<string, string>
  activities: { id: string; name: string }[]
  instructors: { id: string; name: string }[]
  packageTypes: PackageOption[]
  hoursMap: Map<string, number>
}) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // Student name is enough to drive both modals (SellPackageFlowModal locks
  // on initialStudentName, ScheduleFromCheckinModal posts straight to
  // /api/owner/schedule with it when there's no checkinId) — no need to
  // carry a full student object around just for these two quick actions.
  const [scheduleTarget, setScheduleTarget] = useState<string | null>(null)
  const [sellTarget,     setSellTarget]     = useState<string | null>(null)

  function onStudentSaved() {
    setShowAddModal(false)
    setToast('✓ Aluno criado com sucesso')
    setTimeout(() => setToast(null), 4000)
    router.refresh()
  }

  function onScheduled() {
    setScheduleTarget(null)
    setToast('✓ Aula agendada com sucesso')
    setTimeout(() => setToast(null), 4000)
    router.refresh()
  }

  function onSold() {
    setSellTarget(null)
    setToast('✓ Venda registrada com sucesso')
    setTimeout(() => setToast(null), 4000)
    router.refresh()
  }

  return (
    <div>

      {/* Page header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '500',
            color: 'var(--slate)',
            marginBottom: '4px',
          }}>
            {t.students_title}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            {total} {t.students_total}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--slate)',
            color: '#fff',
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: '500',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {t.students_add}
        </button>
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: '20px' }}>
        <input
          name="search"
          defaultValue={search ?? ''}
          placeholder={t.students_search}
          style={{
            width: '320px',
            padding: '9px 14px',
            border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--slate)',
            background: '#fff',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: '8px',
            padding: '9px 16px',
            background: '#fff',
            border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--slate)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {t.students_search_btn}
        </button>
        {search && (
          <a
            href="/owner/students"
            style={{
              marginLeft: '8px',
              fontSize: '13px',
              color: 'var(--mist)',
              textDecoration: 'none',
            }}
          >
            {t.students_clear}
          </a>
        )}
      </form>

      {/* Table */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[t.th_student, t.th_nationality, t.th_contact, t.th_skill, t.th_package, t.th_hours, t.th_health, t.th_since, t.th_actions].map(h => (
                <th key={h} style={{
                  padding: '10px 24px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
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
            {students.length === 0 && checkinOnly.length === 0 ? (
              <tr>
                <td colSpan={9} style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--mist)',
                }}>
                  {search
                    ? `${t.students_none} "${search}"`
                    : t.students_empty}
                </td>
              </tr>
            ) : (
              <>
                {students.map((s, i) => {
                  const skill = SKILL_COLORS[s.skill_level ?? '']
                  const isLast = i === students.length - 1 && checkinOnly.length === 0
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
                      }}
                    >
                      {/* Name + initials */}
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '32px', height: '32px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--glacial-light)',
                            color: 'var(--glacial-dark)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: '600', flexShrink: 0,
                          }}>
                            {getInitials(s.name)}
                          </div>
                          <Link href={`/owner/students/${s.id}`} style={{
                            fontSize: '13px', fontWeight: '500',
                            color: 'var(--slate)', textDecoration: 'none',
                          }}>
                            {s.name}
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--mist)' }}>
                        {s.nationality ?? '—'}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--slate)' }}>{s.email ?? '—'}</div>
                        {s.whatsapp && (
                          <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>{s.whatsapp}</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        {s.skill_level ? (
                          <span style={{
                            display: 'inline-block', padding: '3px 10px',
                            borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500',
                            background: skill?.bg ?? 'var(--powder)', color: skill?.color ?? 'var(--mist)',
                          }}>
                            {SKILL_LABELS[s.skill_level]}
                          </span>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--mist)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 24px', minWidth: '160px' }}>
                        {(() => {
                          const pkg = packageMap.get(s.name)
                          if (!pkg) return <span style={{ fontSize: '13px', color: 'var(--mist)' }}>—</span>
                          const pct = pkg.minutes_purchased > 0
                            ? Math.round((pkg.minutes_used / pkg.minutes_purchased) * 100) : 0
                          const fmtMin = (m: number) => m >= 60
                            ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}min` : ''}` : `${m}min`
                          return (
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '5px', whiteSpace: 'nowrap' }}>
                                {pkg.package_name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  flex: 1, height: '4px', background: 'var(--powder)',
                                  borderRadius: 'var(--radius-full)', overflow: 'hidden', minWidth: '80px',
                                }}>
                                  <div style={{
                                    height: '100%', width: `${pct}%`,
                                    background: pct >= 80 ? 'var(--signal)' : pct >= 50 ? '#D4A017' : 'var(--glacial)',
                                    borderRadius: 'var(--radius-full)',
                                  }} />
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--mist)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  {fmtMin(pkg.minutes_used)} / {fmtMin(pkg.minutes_purchased)}
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <HoursOfSailing minutes={hoursMap.get(s.name) ?? 0} />
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        {s.health_conditions ? (
                          <span style={{
                            display: 'inline-block', padding: '3px 10px',
                            borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500',
                            background: 'var(--signal-light)', color: 'var(--signal-dark)',
                          }}>
                            Alert
                          </span>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--mist)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                        {fmtDate(s.created_at)}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <RowActions name={s.name} t={t} onSchedule={setScheduleTarget} onSell={setSellTarget} />
                      </td>
                    </tr>
                  )
                })}

                {/* Separator between registered and check-in-only */}
                {checkinOnly.length > 0 && students.length > 0 && (
                  <tr>
                    <td colSpan={9} style={{
                      padding: '6px 24px',
                      fontSize: '10px', fontWeight: '500',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--mist)', background: 'var(--powder)',
                      borderTop: '0.5px solid var(--border)',
                      borderBottom: '0.5px solid var(--border)',
                    }}>
                      Só via check-in
                    </td>
                  </tr>
                )}

                {checkinOnly.map((s, i) => (
                  <tr
                    key={`co-${s.name}`}
                    style={{
                      borderBottom: i < checkinOnly.length - 1 ? '0.5px solid var(--border)' : 'none',
                    }}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px', height: '32px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--powder)',
                          color: 'var(--mist)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '600', flexShrink: 0,
                        }}>
                          {getInitials(s.name)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link href={`/owner/students/name/${encodeURIComponent(s.name)}`} style={{
                            fontSize: '13px', fontWeight: '500',
                            color: 'var(--slate)', textDecoration: 'none',
                          }}>
                            {s.name}
                          </Link>
                          <span style={{
                            fontSize: '9px', fontWeight: '500',
                            padding: '1px 6px', borderRadius: 'var(--radius-full)',
                            background: 'var(--powder)', color: 'var(--mist)',
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                          }}>
                            check-in
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--mist)' }}>
                      {s.nationality ?? '—'}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--slate)' }}>{s.email ?? '—'}</div>
                      {s.whatsapp && (
                        <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>{s.whatsapp}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--mist)' }}>—</span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <HoursOfSailing minutes={hoursMap.get(s.name) ?? 0} />
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      {s.health_condition ? (
                        <span style={{
                          display: 'inline-block', padding: '3px 10px',
                          borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500',
                          background: 'var(--signal-light)', color: 'var(--signal-dark)',
                        }}>
                          Alert
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--mist)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                      {fmtDate(s.first_seen)}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <RowActions name={s.name} t={t} onSchedule={setScheduleTarget} onSell={setSellTarget} />
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSaved={onStudentSaved}
        />
      )}

      {scheduleTarget && (
        <ScheduleFromCheckinModal
          studentName={scheduleTarget}
          activities={activities}
          instructors={instructors}
          onClose={() => setScheduleTarget(null)}
          onScheduled={onScheduled}
        />
      )}

      {sellTarget && (
        <SellPackageFlowModal
          packageTypes={packageTypes}
          initialStudentName={sellTarget}
          onClose={() => setSellTarget(null)}
          onSold={onSold}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 300,
          background: 'var(--glacial-light)',
          border: '0.5px solid var(--glacial)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 20px',
          fontSize: '13px', fontWeight: '500',
          color: 'var(--glacial-dark)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {toast}
        </div>
      )}

    </div>
  )
}
