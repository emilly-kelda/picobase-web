'use client'

import { useState } from 'react'
import type { OperationalCost } from '@/repositories/costRepository'
import AddCostModal from './AddCostModal'
import { formatCurrency } from '@/lib/currency'

function fmt(n: number) {
  return formatCurrency(n, { decimals: 0 })
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const COST_TYPE_LABEL: Record<string, string> = { fixo: 'Fixo', variavel: 'Variável' }
const RECURRENCE_LABEL: Record<string, string> = { mensal: 'Mensal', anual: 'Anual', unico: 'Evento único' }

export default function CostsClient({
  initialCosts,
  initialTotal,
  pageSize,
  knownCategories,
}: {
  initialCosts: OperationalCost[]
  initialTotal: number
  pageSize: number
  knownCategories: string[]
}) {
  const [costs, setCosts]   = useState(initialCosts)
  const [total, setTotal]   = useState(initialTotal)
  const [page, setPage]     = useState(0)
  const [loadingPage, setLoadingPage] = useState(false)
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; cost: OperationalCost } | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function goToPage(next: number) {
    if (next < 0 || next >= totalPages || next === page) return
    setLoadingPage(true)
    const res = await fetch(`/api/owner/costs?page=${next}`)
    const data = await res.json()
    if (data.ok) {
      setCosts(data.costs)
      setTotal(data.total)
      setPage(next)
    }
    setLoadingPage(false)
  }

  async function refreshCurrentPage() {
    const res = await fetch(`/api/owner/costs?page=${page}`)
    const data = await res.json()
    if (data.ok) {
      setCosts(data.costs)
      setTotal(data.total)
    }
  }

  function onSaved() {
    setFormModal(null)
    refreshCurrentPage()
  }

  async function deleteCost(cost: OperationalCost) {
    if (!window.confirm(`Excluir o custo "${cost.description}"?`)) return
    setDeleting(cost.id)
    const res = await fetch(`/api/owner/costs?id=${cost.id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) refreshCurrentPage()
  }

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)',
        }}>
          {total} custo{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setFormModal({ mode: 'create' })}
          style={{
            padding: '8px 16px',
            background: 'var(--slate)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '12px', fontWeight: '500',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          + Adicionar Custo
        </button>
      </div>

      {costs.length === 0 ? (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
        }}>
          Nenhum custo cadastrado ainda.
        </div>
      ) : (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'auto',
          opacity: loadingPage ? 0.6 : 1, transition: 'opacity 0.15s',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--powder)' }}>
                {['Descrição', 'Valor', 'Tipo', 'Recorrência', 'Vencimento', 'Categoria', ''].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: h === 'Valor' ? 'right' : 'left',
                    fontSize: '10px', fontWeight: '600',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'var(--mist)', borderBottom: '0.5px solid var(--border)',
                    whiteSpace: 'nowrap',
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
                  <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                    {c.description}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(c.amount)}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '99px',
                      background: c.cost_type === 'fixo' ? '#EEF3FC' : '#FFF8E8',
                      color: c.cost_type === 'fixo' ? '#1A4B8A' : '#8A5E00',
                      fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap',
                    }}>
                      {COST_TYPE_LABEL[c.cost_type] ?? c.cost_type}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--slate)' }}>
                    {RECURRENCE_LABEL[c.recurrence] ?? c.recurrence}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                    {fmtDate(c.due_date)}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--mist)' }}>
                    {c.category ?? '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setFormModal({ mode: 'edit', cost: c })}
                        style={{
                          padding: '5px 10px', borderRadius: '99px',
                          background: '#fff', color: 'var(--slate)',
                          border: '0.5px solid var(--border-strong)',
                          fontSize: '11px', fontWeight: '500',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteCost(c)}
                        disabled={deleting === c.id}
                        style={{
                          padding: '5px 10px', borderRadius: '99px',
                          background: '#fff', color: 'var(--signal)',
                          border: '0.5px solid var(--border-strong)',
                          fontSize: '11px', fontWeight: '500',
                          cursor: deleting === c.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-sans)',
                          opacity: deleting === c.id ? 0.6 : 1,
                        }}
                      >
                        {deleting === c.id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: '16px', marginTop: '16px',
        }}>
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 0 || loadingPage}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-md)',
              background: '#fff', border: '0.5px solid var(--border)',
              fontSize: '12px', color: page === 0 ? 'var(--border)' : 'var(--slate)',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages - 1 || loadingPage}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-md)',
              background: '#fff', border: '0.5px solid var(--border)',
              fontSize: '12px', color: page >= totalPages - 1 ? 'var(--border)' : 'var(--slate)',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Próxima →
          </button>
        </div>
      )}

      {formModal && (
        <AddCostModal
          editing={formModal.mode === 'edit' ? formModal.cost : null}
          knownCategories={knownCategories}
          onClose={() => setFormModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
