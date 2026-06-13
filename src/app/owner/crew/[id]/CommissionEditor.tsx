'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'percentage' | 'fixed_per_hour'

export default function CommissionEditor({
  instructorId,
  currentPct,
}: {
  instructorId: string
  currentPct: number | null
}) {
  const router  = useRouter()
  const [mode,  setMode]  = useState<Mode>('percentage')
  const [pct,   setPct]   = useState(
    currentPct != null ? Math.round(currentPct * 100) : 38
  )
  const [fixed, setFixed] = useState(150)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  async function save() {
    setSaving(true)
    const body = mode === 'percentage'
      ? { instructor_id: instructorId, commission_pct: pct / 100 }
      : { instructor_id: instructorId, commission_pct: null, fixed_per_hour: fixed }

    await fetch('/api/owner/crew/commission', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); router.refresh() }, 1500)
  }

  return (
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
        color: 'var(--mist)', marginBottom: '12px',
      }}>
        Modelo de pagamento
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', gap: '2px',
        background: 'var(--powder)',
        borderRadius: 'var(--radius-md)',
        padding: '2px', marginBottom: '14px',
      }}>
        {([
          { key: 'percentage',    label: '% Comissão'   },
          { key: 'fixed_per_hour', label: 'R$/hora fixo' },
        ] as const).map(opt => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            style={{
              flex: 1, padding: '7px 12px',
              borderRadius: '6px', border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px', fontWeight: '500',
              background: mode === opt.key ? '#fff' : 'transparent',
              color: mode === opt.key ? 'var(--slate)' : 'var(--mist)',
              boxShadow: mode === opt.key
                ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        {mode === 'percentage' ? (
          <>
            <input
              type="number" min={0} max={100} step={1}
              value={pct}
              onChange={e => setPct(Number(e.target.value))}
              style={{
                width: '72px', padding: '8px 12px',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                fontSize: '22px', fontWeight: '600',
                color: 'var(--glacial)',
                fontFamily: 'var(--font-sans)',
                outline: 'none', textAlign: 'center',
              }}
            />
            <span style={{
              fontSize: '22px', fontWeight: '600',
              color: 'var(--glacial)',
            }}>
              %
            </span>
            <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
              sobre cada aula
            </span>
          </>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ fontSize: '14px', color: 'var(--mist)' }}>R$</span>
              <input
                type="number" min={0} step={10}
                value={fixed}
                onChange={e => setFixed(Number(e.target.value))}
                style={{
                  width: '90px', padding: '8px 12px',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '22px', fontWeight: '600',
                  color: 'var(--glacial)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none', textAlign: 'center',
                }}
              />
            </div>
            <span style={{ fontSize: '14px', color: 'var(--mist)' }}>
              / hora
            </span>
            <div style={{
              fontSize: '12px',
              padding: '6px 10px',
              background: 'var(--glacial-light)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--glacial-dark)',
            }}>
              ex: 2h → R$ {fixed * 2}
            </div>
          </>
        )}

        <button
          onClick={save}
          disabled={saving || saved}
          style={{
            padding: '8px 16px',
            background: saved ? 'var(--glacial-light)' : 'var(--slate)',
            color: saved ? 'var(--glacial-dark)' : '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '12px', fontWeight: '500',
            cursor: saving || saved ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          {saved ? '✓ Salvo' : saving ? '...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
