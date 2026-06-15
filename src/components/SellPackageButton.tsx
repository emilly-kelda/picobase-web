'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SellPackageButton({
  packageId,
  packageName,
  price,
  schoolId,
}: {
  packageId: string
  packageName: string
  price: number
  schoolId: string
}) {
  const router  = useRouter()
  const [open,   setOpen]   = useState(false)
  const [name,   setName]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function fmt(n: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(n)
  }

  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/owner/sell-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id:    schoolId,
        package_id:   packageId,
        student_name: name.trim(),
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (data.ok) {
      setOpen(false)
      setName('')
      router.refresh()
    } else {
      setError(data.error ?? 'Erro ao registrar venda')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '6px 14px',
          background: 'var(--glacial)',
          color: '#fff',
          border: 'none',
          borderRadius: '99px',
          fontSize: '12px', fontWeight: '500',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          flexShrink: 0,
        }}
      >
        + Vender
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200, padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            padding: '28px', width: '100%', maxWidth: '400px',
          }}>
            <div style={{
              fontSize: '17px', fontWeight: '500',
              color: 'var(--slate)', marginBottom: '4px',
            }}>
              Vender pacote
            </div>
            <div style={{
              fontSize: '13px', color: 'var(--mist)',
              marginBottom: '24px',
            }}>
              {packageName} · {fmt(price)}
            </div>

            <label style={{
              fontSize: '11px', fontWeight: '500',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--mist)', display: 'block', marginBottom: '6px',
            }}>
              Nome do aluno
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="João Silva"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                fontSize: '15px', color: 'var(--slate)',
                fontFamily: 'var(--font-sans)', outline: 'none',
                boxSizing: 'border-box' as const,
                marginBottom: '16px',
              }}
            />

            {error && (
              <div style={{
                fontSize: '12px', color: 'var(--signal-dark)',
                background: 'var(--signal-light)',
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setOpen(false); setName('') }}
                style={{
                  flex: 1, padding: '10px',
                  background: 'var(--powder)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', color: 'var(--mist)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={saving || !name.trim()}
                style={{
                  flex: 2, padding: '10px',
                  background: saving || !name.trim() ? 'var(--border)' : 'var(--glacial)',
                  color: saving || !name.trim() ? 'var(--mist)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: '500',
                  cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {saving ? 'Registrando...' : `Registrar venda · ${fmt(price)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
