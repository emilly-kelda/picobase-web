import { getCrewMembers } from '@/repositories/crewRepository'
import { getSessions } from '@/repositories/sessionRepository'
import { notFound } from 'next/navigation'
import CommissionEditor from './CommissionEditor'
import Link from 'next/link'

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

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
}

const SPORT_COLORS: Record<string, { bg: string; color: string }> = {
  kitesurf: { bg: '#E0F8F5', color: '#007868' },
  wingfoil: { bg: '#EEF3FC', color: '#1A4B8A' },
  windsurf: { bg: '#FBF3E2', color: '#7A4C00' },
  kitefoil: { bg: '#F0EBFA', color: '#4B2080' },
}

const LANG_LABELS: Record<string, string> = {
  pt: 'PT', en: 'EN', fr: 'FR', es: 'ES', de: 'DE',
}

export default async function InstructorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [allCrew, sessions] = await Promise.all([
    getCrewMembers(SCHOOL_ID),
    getSessions(SCHOOL_ID, { instructorId: id }),
  ])

  const member = allCrew.find(m => m.id === id)
  if (!member) notFound()

  const certs     = (member as any).certifications ?? []
  const sports    = (member as any).sports ?? []
  const languages = (member as any).languages ?? []
  const totalRevenue     = sessions.reduce((s, r) => s + (r.price ?? 0), 0)
  const totalCommissions = sessions.reduce((s, r) => s + r.commission_amount, 0)

  return (
    <div>

      {/* Back */}
      <Link href="/owner/crew" style={{
        fontSize: '13px', color: 'var(--mist)',
        textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center',
        gap: '6px', marginBottom: '28px',
      }}>
        ← Equipe
      </Link>

      {/* Two-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '28px',
        alignItems: 'flex-start',
      }}>

        {/* ── LEFT PANEL ── */}
        <div>

          {/* Profile card */}
          <div style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', textAlign: 'center',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '56px', height: '56px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--glacial-light)',
                color: 'var(--glacial-dark)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px', fontWeight: '600',
                marginBottom: '12px',
              }}>
                {getInitials(member.name)}
              </div>
              <div style={{
                fontSize: '17px', fontWeight: '500',
                color: 'var(--slate)', marginBottom: '4px',
              }}>
                {member.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                {member.email ?? member.whatsapp ?? 'Sem contato'}
              </div>
            </div>

            {/* Quick stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {[
                { label: 'Aulas',     value: String(sessions.length)              },
                { label: 'Receita',   value: fmt(totalRevenue)                    },
                { label: 'Ganhos',    value: fmt(totalCommissions)                },
                { label: 'Anos exp.', value: String((member as any).experience_years ?? '—') },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--powder)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '15px', fontWeight: '600',
                    color: 'var(--slate)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '10px', color: 'var(--mist)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    marginTop: '2px',
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commission editor */}
          <CommissionEditor
            instructorId={member.id}
            currentPct={member.commission_pct}
            currentMode={member.commission_mode}
            currentFixedPerHour={member.fixed_per_hour}
          />

          {/* Sports */}
          {sports.length > 0 && (
            <div style={{
              background: '#fff',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '10px',
              }}>
                Modalidades
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sports.map((sport: string) => {
                  const sc = SPORT_COLORS[sport] ?? { bg: 'var(--powder)', color: 'var(--mist)' }
                  return (
                    <span key={sport} style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px', fontWeight: '500',
                      background: sc.bg, color: sc.color,
                    }}>
                      {sport}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div style={{
              background: '#fff',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '10px',
              }}>
                Idiomas
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {languages.map((l: string) => (
                  <span key={l} style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px', fontWeight: '600',
                    background: 'var(--powder)', color: 'var(--slate)',
                    letterSpacing: '0.06em',
                  }}>
                    {LANG_LABELS[l] ?? l.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certs.length > 0 && (
            <div style={{
              background: '#fff',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '10px',
              }}>
                Certificações
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {certs.map((cert: any, i: number) => {
                  const expired = cert.expiry && new Date(cert.expiry) < new Date()
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <div style={{
                          fontSize: '12px', fontWeight: '500',
                          color: expired ? 'var(--signal-dark)' : 'var(--slate)',
                        }}>
                          {cert.type} — {cert.level}
                        </div>
                        {cert.number && (
                          <div style={{
                            fontSize: '10px', color: 'var(--mist)',
                            fontFamily: 'var(--font-mono)',
                          }}>
                            #{cert.number}
                          </div>
                        )}
                      </div>
                      {cert.expiry && (
                        <span style={{
                          fontSize: '10px', fontWeight: '500',
                          padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          background: expired ? 'var(--signal-light)' : 'var(--glacial-light)',
                          color: expired ? 'var(--signal-dark)' : 'var(--glacial-dark)',
                        }}>
                          {expired ? '✕ ' : ''}
                          {new Date(cert.expiry).toLocaleDateString('pt-BR', {
                            month: 'short', year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Payment */}
          {(member.pix_key || member.wise_email) && (
            <div style={{
              background: '#fff',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '10px',
              }}>
                Pagamento
              </div>
              {member.pix_key && (
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--mist)' }}>PIX </span>
                  <span style={{
                    fontSize: '11px', fontFamily: 'var(--font-mono)',
                    color: 'var(--slate)',
                  }}>
                    {member.pix_key}
                  </span>
                </div>
              )}
              {member.wise_email && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--mist)' }}>Wise </span>
                  <span style={{
                    fontSize: '11px', fontFamily: 'var(--font-mono)',
                    color: 'var(--slate)',
                  }}>
                    {member.wise_email}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div>
          <div style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '20px',
          }}>
            {member.name}
          </div>

          <div style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                fontSize: '14px', fontWeight: '500',
                color: 'var(--slate)',
              }}>
                Aulas
              </span>
              <span style={{ fontSize: '13px', color: 'var(--mist)' }}>
                {sessions.length} total · {fmt(totalRevenue)} gerado · {fmt(totalCommissions)} em comissões
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Data', 'Aluno', 'Atividade', 'Duração', 'Valor', 'Comissão'].map(h => (
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
                      padding: '48px 24px', textAlign: 'center',
                      fontSize: '13px', color: 'var(--mist)',
                    }}>
                      Nenhuma aula ainda.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s, i) => (
                    <tr key={s.id} style={{
                      borderBottom: i < sessions.length - 1
                        ? '0.5px solid var(--border)' : 'none',
                    }}>
                      <td style={{
                        padding: '13px 24px', fontSize: '13px',
                        color: 'var(--mist)', whiteSpace: 'nowrap',
                      }}>
                        {fmtDate(s.session_date)}
                      </td>
                      <td style={{
                        padding: '13px 24px', fontSize: '13px',
                        fontWeight: '500', color: 'var(--slate)',
                      }}>
                        {(s.checkins as any)?.student_name ?? '—'}
                      </td>
                      <td style={{
                        padding: '13px 24px', fontSize: '13px',
                        color: 'var(--slate)',
                      }}>
                        {(s.activities as any)?.name ?? '—'}
                      </td>
                      <td style={{
                        padding: '13px 24px', fontSize: '13px',
                        color: 'var(--mist)',
                      }}>
                        {s.duration_min}min
                      </td>
                      <td style={{
                        padding: '13px 24px', fontSize: '13px',
                        color: 'var(--slate)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmt(s.price)}
                      </td>
                      <td style={{
                        padding: '13px 24px', fontSize: '13px',
                        color: 'var(--mist)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmt(s.commission_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
