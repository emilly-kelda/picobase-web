'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Prices = {
  price_brl: number | null
  price_eur: number | null
  price_usd: number | null
}

export default function MultiCurrencyPriceEditor({
  packageId,
  currentPrices,
  schoolId,
  type = 'package',
  onSaved,
}: {
  packageId: string
  currentPrices: Prices
  schoolId: string
  type?: 'package' | 'activity'
  /** Called after a successful save instead of router.refresh() — for pages
   *  (like the client-fetched Activities page) that don't re-render from a
   *  server refresh and need their own refetch. */
  onSaved?: () => void
}) {
  const router  = useRouter()
  const [editing, setEditing] = useState(false)
  const [prices, setPrices]   = useState<Prices>(currentPrices)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)

  const currencies = [
    { key: 'price_brl' as const, symbol: 'R$', label: 'BRL', color: '#007868' },
    { key: 'price_eur' as const, symbol: '€',  label: 'EUR', color: '#1A4B8A' },
    { key: 'price_usd' as const, symbol: '$',  label: 'USD', color: '#4B1AA8' },
  ]

  async function save() {
    setSaving(true)
    await fetch('/api/owner/package-price', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:        packageId,
        type,
        price_brl: prices.price_brl,
        price_eur: prices.price_eur,
        price_usd: prices.price_usd,
        school_id: schoolId,
      }),
    })
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => {
      setSaved(false)
      if (onSaved) onSaved()
      else router.refresh()
    }, 1200)
  }

  if (!editing) {
    return (
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {currencies.map(c => (
          <button
            key={c.key}
            onClick={() => setEditing(true)}
            title={`Editar preço ${c.label}`}
            style={{
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '0',
              fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <span style={{
              fontSize: '10px', color: c.color,
              fontWeight: '600', letterSpacing: '0.06em',
            }}>
              {c.label}
            </span>
            <span style={{
              fontSize: '13px',
              color: prices[c.key] ? c.color : 'var(--mist)',
              textDecoration: 'underline dotted',
              textUnderlineOffset: '3px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {prices[c.key]
                ? `${c.symbol} ${prices[c.key]?.toLocaleString('pt-BR')}`
                : `${c.symbol} —`
              }
            </span>
          </button>
        ))}
        {saved && (
          <span style={{ fontSize: '11px', color: 'var(--glacial-dark)' }}>
            ✓ Salvo
          </span>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      padding: '12px', background: 'var(--powder)',
      borderRadius: 'var(--radius-md)', minWidth: '200px',
    }}>
      {currencies.map(c => (
        <div key={c.key} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: '600',
            color: c.color, width: '32px',
          }}>
            {c.label}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
            {c.symbol}
          </span>
          <input
            type="number"
            value={prices[c.key] ?? ''}
            onChange={e => setPrices(prev => ({
              ...prev,
              [c.key]: e.target.value ? Number(e.target.value) : null,
            }))}
            placeholder="0"
            style={{
              width: '80px', padding: '4px 8px',
              border: '0.5px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px', color: 'var(--slate)',
              fontFamily: 'inherit', outline: 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            flex: 1, padding: '6px',
            background: saving ? 'var(--border)' : 'var(--glacial)',
            color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? '...' : '✓ Salvar'}
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{
            padding: '6px 10px',
            background: 'transparent', color: 'var(--mist)',
            border: 'none', cursor: 'pointer', fontSize: '12px',
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
