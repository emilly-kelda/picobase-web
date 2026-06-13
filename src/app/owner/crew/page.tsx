import { getCrewMembers } from '@/repositories/crewRepository'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import Link from 'next/link'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtPct(n: number | null | undefined) {
  if (n == null) return '—'
  return `${Math.round(n * 100)}%`
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const LANG_LABELS: Record<string, string> = {
  pt: 'PT', en: 'EN', fr: 'FR', es: 'ES', de: 'DE', it: 'IT',
}

const SPORT_LABELS: Record<string, string> = {
  kitesurf: 'Kitesurf',
  wingfoil: 'Wingfoil',
  windsurf: 'Windsurf',
  kitefoil: 'Kitefoil',
  sup:      'SUP',
  surf:     'Surf',
}

const SPORT_COLORS: Record<string, { bg: string; color: string }> = {
  kitesurf: { bg: '#E0F8F5', color: '#007868' },
  wingfoil: { bg: '#EEF3FC', color: '#1A4B8A' },
  windsurf: { bg: '#FBF3E2', color: '#7A4C00' },
  kitefoil: { bg: '#F0EBFA', color: '#4B2080' },
  sup:      { bg: '#F0EEE9', color: '#4A4C58' },
  surf:     { bg: '#E8F4EE', color: '#1D6642' },
}

function isExpiringSoon(expiry: string) {
  const exp = new Date(expiry)
  const now = new Date()
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff < 90
}

function isExpired(expiry: string) {
  return new Date(expiry) < new Date()
}

export default async function CrewPage() {
  const [crew, lang] = await Promise.all([
    getCrewMembers(SCHOOL_ID),
    getPortalLang(),
  ])
  const t = getT(lang)

  const totalRevenue     = crew.reduce((s, m) => s + m.stats.revenue, 0)
  const totalCommissions = crew.reduce((s, m) => s + m.stats.commissions, 0)
  const totalSessions    = crew.reduce((s, m) => s + m.stats.sessions, 0)

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          {t.crew_title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          {crew.length} {crew.length !== 1 ? t.crew_instructors : t.crew_instructor}
        </p>
      </div>

      {/* Season totals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px', marginBottom: '28px',
      }}>
        {[
          { label: t.total_sessions,    value: String(totalSessions)    },
          { label: t.revenue_generated, value: fmt(totalRevenue)        },
          { label: t.total_commissions, value: fmt(totalCommissions)    },
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

      {/* Crew cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '12px',
      }}>
        {crew.map(member => {
          const certs     = (member as any).certifications ?? []
          const sports    = (member as any).sports ?? []
          const languages = (member as any).languages ?? []
          const hasExpiredCert  = certs.some((c: any) => c.expiry && isExpired(c.expiry))

          return (
            <div key={member.id} style={{
              background: '#fff',
              border: `0.5px solid ${hasExpiredCert ? 'var(--signal)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>

              {/* Card header */}
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: '0.5px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--radius-full)',
                    background: member.active ? 'var(--glacial-light)' : 'var(--powder)',
                    color: member.active ? 'var(--glacial-dark)' : 'var(--mist)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px', fontWeight: '600',
                    flexShrink: 0,
                  }}>
                    {getInitials(member.name)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: '8px', marginBottom: '3px', flexWrap: 'wrap',
                    }}>
                      <Link
                        href={`/owner/crew/${member.id}`}
                        style={{
                          fontSize: '15px', fontWeight: '500',
                          color: 'var(--slate)', textDecoration: 'none',
                          borderBottom: '1px solid transparent',
                        }}
                      >
                        {member.name}
                      </Link>
                      {!member.active && (
                        <span style={{
                          fontSize: '10px', fontWeight: '500',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--powder)', color: 'var(--mist)',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px', color: 'var(--mist)',
                      display: 'flex', gap: '8px', alignItems: 'center',
                      flexWrap: 'wrap',
                    }}>
                      {(member as any).nationality && (
                        <span>{(member as any).nationality}</span>
                      )}
                      {(member as any).experience_years && (
                        <>
                          <span style={{ color: 'var(--border-strong)' }}>&middot;</span>
                          <span>{(member as any).experience_years} years exp.</span>
                        </>
                      )}
                      {(member as any).contract_type && (
                        <>
                          <span style={{ color: 'var(--border-strong)' }}>&middot;</span>
                          <span style={{ textTransform: 'capitalize' }}>
                            {(member as any).contract_type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '22px', fontWeight: '600',
                      color: 'var(--glacial)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {fmtPct(member.commission_pct)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--mist)', letterSpacing: '0.06em' }}>
                      {t.commission_label}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {(member as any).bio && (
                  <p style={{
                    fontSize: '12px', color: 'var(--mist)',
                    lineHeight: '1.5', margin: '0',
                  }}>
                    {(member as any).bio}
                  </p>
                )}
              </div>

              {/* Sports */}
              {sports.length > 0 && (
                <div style={{
                  padding: '12px 24px',
                  borderBottom: '0.5px solid var(--border)',
                  display: 'flex', gap: '6px', flexWrap: 'wrap',
                }}>
                  {sports.map((sport: string) => {
                    const sc = SPORT_COLORS[sport] ?? { bg: 'var(--powder)', color: 'var(--mist)' }
                    return (
                      <span key={sport} style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px', fontWeight: '500',
                        background: sc.bg, color: sc.color,
                      }}>
                        {SPORT_LABELS[sport] ?? sport}
                      </span>
                    )
                  })}
                  {(member as any).first_aid_certified && (
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px', fontWeight: '500',
                      background: 'var(--signal-light)',
                      color: 'var(--signal-dark)',
                    }}>
                      &#x271A; First Aid
                    </span>
                  )}
                </div>
              )}

              {/* Languages */}
              {languages.length > 0 && (
                <div style={{
                  padding: '12px 24px',
                  borderBottom: '0.5px solid var(--border)',
                  display: 'flex', gap: '6px', alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '11px', color: 'var(--mist)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    marginRight: '4px',
                  }}>
                    Speaks
                  </span>
                  {languages.map((l: string) => (
                    <span key={l} style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px', fontWeight: '600',
                      background: 'var(--powder)',
                      color: 'var(--slate)',
                      letterSpacing: '0.06em',
                    }}>
                      {LANG_LABELS[l] ?? l.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {certs.length > 0 && (
                <div style={{
                  padding: '12px 24px',
                  borderBottom: '0.5px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  {certs.map((cert: any, i: number) => {
                    const expired  = cert.expiry && isExpired(cert.expiry)
                    const expiring = cert.expiry && isExpiringSoon(cert.expiry) && !expired
                    return (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <span style={{
                            fontSize: '12px', fontWeight: '500',
                            color: expired ? 'var(--signal-dark)' : 'var(--slate)',
                          }}>
                            {cert.type} &mdash; {cert.level}
                          </span>
                          {cert.number && (
                            <span style={{
                              fontSize: '11px', color: 'var(--mist)',
                              fontFamily: 'var(--font-mono)', marginLeft: '6px',
                            }}>
                              #{cert.number}
                            </span>
                          )}
                        </div>
                        {cert.expiry && (
                          <span style={{
                            fontSize: '11px', fontWeight: '500',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: expired
                              ? 'var(--signal-light)'
                              : expiring
                                ? 'var(--amber-light)'
                                : 'var(--glacial-light)',
                            color: expired
                              ? 'var(--signal-dark)'
                              : expiring
                                ? 'var(--amber)'
                                : 'var(--glacial-dark)',
                          }}>
                            {expired ? '✕ Expired' : expiring ? '⚠ ' : ''}
                            {new Date(cert.expiry).toLocaleDateString('pt-BR', {
                              month: 'short', year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
              }}>
                {[
                  { label: t.total_sessions, value: String(member.stats.sessions)  },
                  { label: t.revenue_label,  value: fmt(member.stats.revenue)      },
                  { label: 'Earned',         value: fmt(member.stats.commissions)  },
                ].map((stat, i) => (
                  <div key={stat.label} style={{
                    padding: '14px 16px',
                    borderRight: i < 2 ? '0.5px solid var(--border)' : 'none',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '16px', fontWeight: '600',
                      color: 'var(--slate)', marginBottom: '3px',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: '10px', fontWeight: '500',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--mist)',
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment info */}
              {(member.pix_key || member.wise_email) && (
                <div style={{
                  padding: '12px 24px',
                  borderTop: '0.5px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: '4px',
                }}>
                  {member.pix_key && (
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--mist)', width: '36px', flexShrink: 0 }}>PIX</span>
                      <span style={{ color: 'var(--slate)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {member.pix_key}
                      </span>
                    </div>
                  )}
                  {member.wise_email && (
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--mist)', width: '36px', flexShrink: 0 }}>Wise</span>
                      <span style={{ color: 'var(--slate)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {member.wise_email}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>
          )
        })}

        {crew.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '48px', textAlign: 'center',
            fontSize: '13px', color: 'var(--mist)',
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            No instructors yet.
          </div>
        )}
      </div>

    </div>
  )
}
