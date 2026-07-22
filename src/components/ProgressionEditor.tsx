'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const LEVELS = [
  { key: 'beginner',     label: 'Iniciante',    color: 'var(--glacial-dark)', bg: 'var(--glacial-light)' },
  { key: 'intermediate', label: 'Intermediário', color: 'var(--amber)',        bg: 'var(--amber-light)'   },
  { key: 'advanced',     label: 'Avançado',      color: 'var(--signal-dark)',  bg: 'var(--signal-light)'  },
]

const SKILLS_BY_SPORT: Record<string, { key: string; label: string }[]> = {
  kitesurf: [
    { key: 'kite_control', label: 'Controle do kite'  },
    { key: 'body_drag',    label: 'Body drag'          },
    { key: 'water_start',  label: 'Water start'        },
    { key: 'upwind',       label: 'Subida ao vento'    },
    { key: 'transitions',  label: 'Transições'         },
    { key: 'jumps',        label: 'Saltos'             },
    { key: 'independent',  label: 'Rider independente' },
  ],
  wingfoil: [
    { key: 'wing_control',   label: 'Controle da asa'  },
    { key: 'body_drag',      label: 'Body drag'         },
    { key: 'water_start',    label: 'Water start'       },
    { key: 'upwind',         label: 'Subida ao vento'   },
    { key: 'foil_takeoff',   label: 'Decolagem no foil' },
    { key: 'sustained_foil', label: 'Foil sustentado'   },
    { key: 'tack_jibe',      label: 'Tack e jibe'       },
  ],
  windsurf: [
    { key: 'rig_control', label: 'Controle da vela' },
    { key: 'beach_start', label: 'Beach start'       },
    { key: 'upwind',      label: 'Subida ao vento'   },
    { key: 'tack',        label: 'Tack'              },
    { key: 'jibe',        label: 'Jibe'              },
    { key: 'planing',     label: 'Planing'           },
  ],
  default: [
    { key: 'basics',       label: 'Fundamentos'          },
    { key: 'intermediate', label: 'Nível intermediário'   },
    { key: 'advanced',     label: 'Técnicas avançadas'    },
    { key: 'independent',  label: 'Independente'          },
  ],
}

type Props = {
  studentId: string
  studentName: string
  currentLevel: string | null
  currentSkills?: string[]
  sessionId?: string
  sport?: string
  onDone?: () => void
  compact?: boolean
}

export default function ProgressionEditor({
  studentId,
  studentName: _studentName,
  currentLevel,
  currentSkills = [],
  sessionId,
  sport = 'kitesurf',
  onDone,
  compact = false,
}: Props) {
  const router   = useRouter()
  const sportKey = sport.toLowerCase().replace(/\s.*/, '')
  const skills   = SKILLS_BY_SPORT[sportKey] ?? SKILLS_BY_SPORT.default

  const [level,         setLevel]         = useState(currentLevel ?? 'beginner')
  const [checkedSkills, setCheckedSkills] = useState<string[]>(currentSkills)
  const [notes,         setNotes]         = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)

  function toggleSkill(key: string) {
    setCheckedSkills(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    )
  }

  async function save() {
    setSaving(true)
    const res = await fetch('/api/owner/progression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        level,
        notes,
        skills:     checkedSkills,
        session_id: sessionId || null,
        sport:      sportKey,
      }),
    })
    setSaving(false)
    if ((await res.json()).ok) {
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        router.refresh()
        onDone?.()
      }, 1500)
    }
  }

  const currentLevelData = LEVELS.find(l => l.key === level) ?? LEVELS[0]

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {!compact && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--slate)' }}>
            Progressão
          </div>
          <span style={{
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px', fontWeight: '500',
            background: currentLevelData.bg,
            color: currentLevelData.color,
          }}>
            {currentLevelData.label}
          </span>
        </div>
      )}

      <div style={{ padding: compact ? '12px' : '20px' }}>

        {/* Level selector */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '8px',
          }}>
            Nível atual
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {LEVELS.map(l => (
              <button
                key={l.key}
                onClick={() => setLevel(l.key)}
                style={{
                  flex: 1, padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${level === l.key ? l.color : 'var(--border)'}`,
                  background: level === l.key ? l.bg : '#fff',
                  color: level === l.key ? l.color : 'var(--mist)',
                  fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skills checklist */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '8px',
          }}>
            Habilidades
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: '6px',
          }}>
            {skills.map(skill => {
              const checked = checkedSkills.includes(skill.key)
              return (
                <label
                  key={skill.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px',
                    background: checked ? 'var(--glacial-light)' : 'var(--powder)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontSize: '12px',
                    color: checked ? 'var(--glacial-dark)' : 'var(--mist)',
                    fontWeight: checked ? '500' : '400',
                    border: `0.5px solid ${checked ? 'var(--glacial)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSkill(skill.key)}
                    style={{ accentColor: 'var(--glacial)', width: '14px', height: '14px' }}
                  />
                  {skill.label}
                </label>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '8px',
          }}>
            Observações do instrutor
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Como foi a aula? O que o aluno aprendeu?"
            style={{
              width: '100%', padding: '10px 12px',
              border: '0.5px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px', color: 'var(--slate)',
              fontFamily: 'var(--font-sans)', outline: 'none',
              minHeight: compact ? '60px' : '80px',
              resize: 'vertical' as const,
              boxSizing: 'border-box' as const,
              lineHeight: '1.5',
            }}
          />
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving || saved}
          style={{
            width: '100%', padding: '10px',
            background: saved
              ? 'var(--glacial-light)'
              : saving ? 'var(--border)' : 'var(--slate)',
            color: saved
              ? 'var(--glacial-dark)'
              : saving ? 'var(--mist)' : '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '13px', fontWeight: '500',
            cursor: saving || saved ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Progressão salva'
            : saving ? 'Salvando...'
            : 'Salvar progressão'}
        </button>
      </div>
    </div>
  )
}
