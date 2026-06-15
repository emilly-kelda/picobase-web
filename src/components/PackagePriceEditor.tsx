'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PackagePriceEditor({
  packageId,
  currentPrice,
  schoolId,
}: {
  packageId: string
  currentPrice: number
  schoolId: string
}) {
  const router  = useRouter()
  const [editing, setEditing] = useState(false)
  const [price,   setPrice]   = useState(currentPrice)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  function fmt(n: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(n)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/owner/package-price', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: packageId, price, school_id: schoolId }),
    })
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => { setSaved(false); router.refresh() }, 1000)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        title="Editar preço"
        style={{
          background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '0',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: saved ? 'var(--glacial-dark)' : 'var(--mist)',
          textDecoration: 'underline dotted',
          textUnderlineOffset: '3px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {saved ? '✓ Salvo' : fmt(price)}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '12px', color: 'var(--mist)' }}>R$</span>
      <input
        type="number"
        value={price}
        onChange={e => setPrice(Number(e.target.value))}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') setEditing(false)
        }}
        autoFocus
        style={{
          width: '80px', padding: '4px 8px',
          border: '0.5px solid var(--glacial)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px', color: 'var(--slate)',
          fontFamily: 'var(--font-sans)', outline: 'none',
          fontVariantNumeric: 'tabular-nums',
        }}
      />
      <button
        onClick={save}
        disabled={saving}
        style={{
          padding: '4px 10px',
          background: 'var(--glacial)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: '12px', cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {saving ? '...' : '✓'}
      </button>
      <button
        onClick={() => setEditing(false)}
        style={{
          padding: '4px 8px',
          background: 'transparent', color: 'var(--mist)',
          border: 'none', cursor: 'pointer',
          fontSize: '12px', fontFamily: 'var(--font-sans)',
        }}
      >
        ✕
      </button>
    </div>
  )
}
