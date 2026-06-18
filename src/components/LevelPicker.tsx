'use client'

import { LEVEL_ORDER, LEVEL_LABELS, type Level } from '@/lib/levels'

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--mist)',
  display: 'block',
  marginBottom: '6px',
}

/** Per-activity level picker. Experimental is disabled once the student has any
 *  confirmed session in this activity (one-shot trial) — see lib/levels.ts. */
export default function LevelPicker({
  value, onChange, experimentalDisabled, label = 'Nível',
}: {
  value: string
  onChange: (level: Level) => void
  experimentalDisabled: boolean
  label?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {LEVEL_ORDER.map(l => {
          const disabled = l === 'experimental' && experimentalDisabled
          const active = value === l
          return (
            <button
              key={l}
              type="button"
              disabled={disabled}
              title={disabled ? 'Aula experimental já utilizada nesta atividade' : undefined}
              onClick={() => onChange(l)}
              style={{
                flex: '1 1 auto', padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${active ? 'var(--glacial)' : 'var(--border)'}`,
                background: disabled ? 'var(--powder)' : active ? 'var(--glacial-light)' : '#fff',
                color: disabled ? 'var(--border-strong)' : active ? 'var(--glacial-dark)' : 'var(--slate)',
                fontSize: '12px', fontWeight: '500',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {LEVEL_LABELS[l].pt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
