'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MasterSchoolRow } from '@/repositories/schoolRepository'
import SchoolContractModal from './SchoolContractModal'

function fmt(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  trial:     { bg: '#EEF3FC', color: '#1A4B8A', label: 'Trial' },
  active:    { bg: '#E0F8F5', color: '#007868', label: 'Ativa' },
  past_due:  { bg: '#FEF2F2', color: '#DC2626', label: 'Inadimplente' },
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cartao: 'Cartão', pix: 'PIX', boleto: 'Boleto',
}

const PAYMENT_TERMS_LABEL: Record<string, string> = {
  mensal: 'Mensal', semestral: 'Semestral', anual: 'Anual',
}

export default function SchoolsTable({ schools }: { schools: MasterSchoolRow[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<MasterSchoolRow | null>(null)

  function onSaved() {
    setEditing(null)
    router.refresh()
  }

  if (schools.length === 0) {
    return (
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '48px',
        textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
      }}>
        Nenhuma escola cadastrada ainda.
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--powder)' }}>
              {['Escola', 'Status', 'Pagamento', 'Condição', 'Assinatura', 'Centro de custo', 'Criada em', ''].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left',
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
            {schools.map((s, i) => {
              const status = STATUS_STYLE[s.status_assinatura] ?? STATUS_STYLE.trial
              return (
                <tr key={s.id} style={{
                  borderBottom: i < schools.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                      /{s.slug}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '99px',
                      background: status.bg, color: status.color,
                      fontSize: '11px', fontWeight: '600',
                    }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--slate)' }}>
                    {s.payment_method ? PAYMENT_METHOD_LABEL[s.payment_method] ?? s.payment_method : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--slate)' }}>
                    {s.payment_terms ? PAYMENT_TERMS_LABEL[s.payment_terms] ?? s.payment_terms : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(s.subscription_value)}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--mist)' }}>
                    {s.cost_center ?? '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--mist)' }}>
                    {fmtDate(s.created_at)}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setEditing(s)}
                      style={{
                        padding: '5px 12px', borderRadius: '99px',
                        background: '#fff', color: 'var(--slate)',
                        border: '0.5px solid var(--border-strong)',
                        fontSize: '11px', fontWeight: '500',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <SchoolContractModal
          school={editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
