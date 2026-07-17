'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PicobaseCost } from '@/repositories/picobaseCostRepository'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px', color: 'var(--slate)',
  fontFamily: 'var(--font-sans)', outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

export default function CostsClient({ costs }: { costs: PicobaseCost[] }) {
  const router = useRouter()
  const [category, setCategory]       = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount]           = useState('')
  const [costDate, setCostDate]       = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const canSave = category.trim() && description.trim() && Number(amount) > 0 && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/master/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, amount: Number(amount), costDate }),
      })
      const data = await res.json()
      if (data.ok) {
        setCategory('')
        setDescription('')
        setAmount('')
        router.refresh()
      } else {
        setError(data.error ?? 'Erro ao salvar custo.')
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px',
      }}>
        <p style={{
          fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '14px',
        }}>
          Registrar custo
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Categoria</label>
            <input style={inputStyle} type="text" placeholder="Servidor, licenças..." value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Descrição</label>
            <input style={inputStyle} type="text" placeholder="Ex: Supabase Pro — julho" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Valor (R$)</label>
            <input style={inputStyle} type="number" min={0} step={10} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data</label>
            <input style={inputStyle} type="date" value={costDate} onChange={e => setCostDate(e.target.value)} />
          </div>
        </div>
        {error && (
          <div style={{ marginBottom: '10px', fontSize: '12px', color: '#DC2626' }}>{error}</div>
        )}
        <button
          onClick={save}
          disabled={!canSave}
          style={{
            padding: '9px 18px',
            background: canSave ? 'var(--slate)' : 'var(--border)',
            color: canSave ? '#fff' : 'var(--mist)',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '13px', fontWeight: '500',
            cursor: canSave ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {saving ? 'Salvando...' : '+ Registrar custo'}
        </button>
      </div>

      {costs.length === 0 ? (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
        }}>
          Nenhum custo registrado ainda.
        </div>
      ) : (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--powder)' }}>
                {['Categoria', 'Descrição', 'Data', 'Valor'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: h === 'Valor' ? 'right' : 'left',
                    fontSize: '10px', fontWeight: '600',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'var(--mist)', borderBottom: '0.5px solid var(--border)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {costs.map((c, i) => (
                <tr key={c.id} style={{
                  borderBottom: i < costs.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--slate)' }}>{c.category}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--slate)' }}>{c.description}</td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--mist)' }}>{fmtDate(c.cost_date)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#DC2626', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    − {fmt(c.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
