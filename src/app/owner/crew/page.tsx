import { getCrewMembers } from '@/repositories/crewRepository'

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

export default async function CrewPage() {
  const crew = await getCrewMembers(SCHOOL_ID)

  const totalRevenue     = crew.reduce((s, m) => s + m.stats.revenue, 0)
  const totalCommissions = crew.reduce((s, m) => s + m.stats.commissions, 0)
  const totalSessions    = crew.reduce((s, m) => s + m.stats.sessions, 0)

  return (
    <div>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '4px',
          }}>
            Crew
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            {crew.length} instructor{crew.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Season totals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '28px',
      }}>
        {[
          { label: 'Total sessions',    value: String(totalSessions)    },
          { label: 'Revenue generated', value: fmt(totalRevenue)        },
          { label: 'Total commissions', value: fmt(totalCommissions)    },
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '12px',
      }}>
        {crew.map(member => (
          <div key={member.id} style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>

            {/* Card header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}>
              <div style={{
                width: '40px', height: '40px',
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
                  fontSize: '15px', fontWeight: '500',
                  color: 'var(--slate)', marginBottom: '2px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  {member.name}
                  {!member.active && (
                    <span style={{
                      fontSize: '10px', fontWeight: '500',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--powder)',
                      color: 'var(--mist)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      Inactive
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                  {member.email ?? member.whatsapp ?? 'No contact'}
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
                  commission
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderBottom: '0.5px solid var(--border)',
            }}>
              {[
                { label: 'Sessions', value: String(member.stats.sessions)    },
                { label: 'Revenue',  value: fmt(member.stats.revenue)        },
                { label: 'Earned',   value: fmt(member.stats.commissions)    },
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
            <div style={{ padding: '14px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {member.pix_key && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--mist)', width: '36px', flexShrink: 0 }}>PIX</span>
                    <span style={{
                      color: 'var(--slate)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                    }}>
                      {member.pix_key}
                    </span>
                  </div>
                )}
                {member.wise_email && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--mist)', width: '36px', flexShrink: 0 }}>Wise</span>
                    <span style={{
                      color: 'var(--slate)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                    }}>
                      {member.wise_email}
                    </span>
                  </div>
                )}
                {!member.pix_key && !member.wise_email && (
                  <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    No payment details on file
                  </span>
                )}
              </div>
            </div>

          </div>
        ))}

        {crew.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '48px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--mist)',
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            No instructors yet.
          </div>
        )}
      </div>

    </div>
  )
}


