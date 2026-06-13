import { getProgressionHistory } from '@/repositories/studentRepository'

const LEVEL_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Iniciante',    color: 'var(--glacial-dark)', bg: 'var(--glacial-light)' },
  intermediate: { label: 'Intermediário',color: 'var(--amber)',        bg: 'var(--amber-light)'   },
  advanced:     { label: 'Avançado',     color: 'var(--signal-dark)',  bg: 'var(--signal-light)'  },
}

const SKILL_LABELS: Record<string, string> = {
  kite_control:   'Controle do kite',
  body_drag:      'Body drag',
  water_start:    'Water start',
  upwind:         'Subida ao vento',
  transitions:    'Transições',
  jumps:          'Saltos',
  independent:    'Rider independente',
  wing_control:   'Controle da asa',
  foil_takeoff:   'Decolagem no foil',
  sustained_foil: 'Foil sustentado',
  tack_jibe:      'Tack e jibe',
  rig_control:    'Controle da vela',
  beach_start:    'Beach start',
  tack:           'Tack',
  jibe:           'Jibe',
  planing:        'Planing',
  basics:         'Fundamentos',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function ProgressionHistory({
  schoolId,
  studentId,
}: {
  schoolId: string
  studentId: string
}) {
  const history = await getProgressionHistory(schoolId, studentId)

  if (history.length === 0) return null

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: '28px',
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '0.5px solid var(--border)',
        fontSize: '14px', fontWeight: '500', color: 'var(--slate)',
      }}>
        Histórico de progressão
      </div>

      <div>
        {history.map((entry, i) => {
          const levelData = LEVEL_LABELS[entry.level] ?? LEVEL_LABELS.beginner
          const skills = (entry.skills ?? []) as string[]
          return (
            <div key={entry.id} style={{
              padding: '16px 24px',
              borderBottom: i < history.length - 1
                ? '0.5px solid var(--border)' : 'none',
              display: 'flex', gap: '16px',
            }}>
              {/* Timeline dot */}
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '4px', flexShrink: 0,
              }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: levelData.color, flexShrink: 0,
                  marginTop: '4px',
                }} />
                {i < history.length - 1 && (
                  <div style={{
                    width: '1px', flex: 1,
                    background: 'var(--border)', minHeight: '20px',
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '8px', marginBottom: '6px',
                }}>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px', fontWeight: '500',
                    background: levelData.bg, color: levelData.color,
                  }}>
                    {levelData.label}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--mist)' }}>
                    {fmtDate(entry.created_at)}
                  </span>
                  {(entry as any).updated_by_user?.name && (
                    <span style={{ fontSize: '11px', color: 'var(--mist)' }}>
                      · {(entry as any).updated_by_user.name}
                    </span>
                  )}
                </div>

                {skills.length > 0 && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap',
                    gap: '4px', marginBottom: entry.notes ? '8px' : '0',
                  }}>
                    {skills.map((skill: string) => (
                      <span key={skill} style={{
                        padding: '2px 8px',
                        background: 'var(--glacial-light)',
                        color: 'var(--glacial-dark)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px', fontWeight: '500',
                      }}>
                        ✓ {SKILL_LABELS[skill] ?? skill}
                      </span>
                    ))}
                  </div>
                )}

                {entry.notes && (
                  <p style={{
                    fontSize: '13px', color: 'var(--slate)',
                    lineHeight: '1.5', margin: '0',
                  }}>
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
