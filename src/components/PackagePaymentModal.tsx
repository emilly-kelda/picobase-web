'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PaymentMethod = 'pix' | 'dinheiro' | 'cartao'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix',      label: 'PIX'      },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao',   label: 'Cartão'   },
]

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n)
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
}

/** "Registrar Pagamento" — settles some or all of the remaining balance on
 *  a package sold on credit or partially paid (see
 *  PATCH /api/owner/package-sales/[id]/payment). Amount defaults to the
 *  full remaining balance but can be lowered for an installment payment;
 *  the balance can be settled again later the same way. */
export default function PackagePaymentModal({
  packageSaleId,
  packageName,
  remaining,
  onClose,
  onSaved,
}: {
  packageSaleId: string
  packageName: string
  remaining: number
  onClose: () => void
  onSaved: () => void
}) {
  const router = useRouter()
  const [amount, setAmount] = useState(String(remaining))
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const parsedAmount = Number(amount)
  const canSave = !saving && parsedAmount > 0 && parsedAmount <= remaining + 0.01

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/owner/package-sales/${packageSaleId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount, payment_method: method }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Erro ao registrar pagamento.')
        setSaving(false)
        return
      }
      router.refresh()
      onSaved()
    } catch {
      setError('Erro de rede. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 250, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '420px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Registrar pagamento
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '20px' }}>
          {packageName} · saldo devedor {fmtBRL(remaining)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Valor pago (R$)</label>
            <input
              style={inputStyle}
              type="number" min={0} max={remaining} step={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Forma de pagamento</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setMethod(pm.value)}
                  style={{
                    flex: 1, padding: '9px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${method === pm.value ? 'var(--slate)' : 'var(--border-strong)'}`,
                    background: method === pm.value ? 'var(--slate)' : '#fff',
                    color: method === pm.value ? '#fff' : 'var(--slate)',
                    fontSize: '13px', fontWeight: method === pm.value ? '600' : '500',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            style={{
              flex: 2, padding: '11px',
              background: canSave ? 'var(--slate)' : 'var(--border)',
              color: canSave ? '#fff' : 'var(--mist)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Salvando...' : 'Confirmar pagamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
