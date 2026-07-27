'use client'

import { useState } from 'react'
import type { OperationalCost, CostStatus } from '@/lib/costTypes'
import { getCostStatus } from '@/lib/costTypes'
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

type Summary = { total: number; paid: number; pending: number; overdue: number; hoursTaught: number; costPerHour: number | null }

const COST_TYPE_LABEL: Record<string, string> = { fixo: 'Fixo', variavel: 'Variável' }
const RECURRENCE_LABEL: Record<string, string> = { mensal: 'Mensal', anual: 'Anual', unico: 'Evento único' }

const STATUS_LABEL: Record<CostStatus, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Atrasado' }
const STATUS_STYLE: Record<CostStatus, { bg: string; color: string }> = {
  paid:    { bg: '#ECFDF5', color: '#047857' },
  pending: { bg: '#FFFBEB', color: '#B45309' },
  overdue: { bg: '#FEF2F2', color: '#DC2626' },
}

function StatusBadge({ status }: { status: CostStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '99px',
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

function monthOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label }
  })
}

const selectStyle: React.CSSProperties = {
  padding: '7px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px', color: 'var(--slate)',
  background: '#fff', cursor: 'pointer',
  fontFamily: 'var(--font-sans)', outline: 'none',
}

export default function CostsClient({
  initialCosts,
  initialTotal,
  initialSummary,
  pageSize,
  knownCategories,
  categoryOptions,
}: {
  initialCosts: OperationalCost[]
  initialTotal: number
  initialSummary: Summary
  pageSize: number
  knownCategories: string[]
  categoryOptions: string[]
}) {
  const [costs, setCosts]     = useState(initialCosts)
  const [total, setTotal]     = useState(initialTotal)
  const [summary, setSummary] = useState(initialSummary)
  const [page, setPage]       = useState(0)
  const [loadingPage, setLoadingPage] = useState(false)
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; cost: OperationalCost } | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  const [periodFilter, setPeriodFilter]     = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter]     = useState<'' | CostStatus>('')

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // All categories the modal/filter should offer: the 5 canonical ones plus
  // anything already in use that isn't one of them (older rows, or a school
  // that typed something custom before this taxonomy existed) — nothing
  // already saved becomes unfilterable just because it predates this list.
  const allCategories = Array.from(new Set([...categoryOptions, ...knownCategories])).sort()

  function buildParams(extra: Record<string, string | number>) {
    const params = new URLSearchParams()
    if (periodFilter)   params.set('period', periodFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    if (statusFilter)   params.set('status', statusFilter)
    for (const [k, v] of Object.entries(extra)) params.set(k, String(v))
    return params
  }

  // period/category/status double as both the current filter state AND
  // (via buildParams) the source of truth for what to fetch — every entry
  // point below (paging, or a filter changing) just calls this with the
  // page it wants; the filter values it reads are whatever's already in
  // state, which React guarantees is current by the time an event handler
  // that just called a setter runs this.
  async function fetchList(targetPage: number) {
    setLoadingPage(true)
    const summaryParams = buildParams({})
    const [listRes, summaryRes] = await Promise.all([
      fetch(`/api/owner/costs?${buildParams({ page: targetPage })}`),
      fetch(`/api/owner/costs/summary?${summaryParams}`),
    ])
    const listData = await listRes.json()
    const summaryData = await summaryRes.json()
    if (listData.ok) {
      setCosts(listData.costs)
      setTotal(listData.total)
      setPage(targetPage)
    }
    if (summaryData.ok) setSummary(summaryData)
    setLoadingPage(false)
  }

  // Filter changes always restart at page 0 — staying on e.g. page 3 of a
  // now much shorter filtered list would just show an empty page. Each
  // takes the new value directly (not read back from state, which
  // wouldn't have updated yet inside the same handler) and builds this
  // one fetch's params explicitly rather than going through buildParams'
  // current-state read.
  async function refetchWith(params: URLSearchParams) {
    setLoadingPage(true)
    const summaryParams = new URLSearchParams(params)
    summaryParams.delete('page')
    const [listRes, summaryRes] = await Promise.all([
      fetch(`/api/owner/costs?${params}`),
      fetch(`/api/owner/costs/summary?${summaryParams}`),
    ])
    const listData = await listRes.json()
    const summaryData = await summaryRes.json()
    if (listData.ok) { setCosts(listData.costs); setTotal(listData.total); setPage(0) }
    if (summaryData.ok) setSummary(summaryData)
    setLoadingPage(false)
  }

  function onPeriodChange(value: string) {
    setPeriodFilter(value)
    const params = buildParams({ page: 0 })
    if (value) params.set('period', value); else params.delete('period')
    refetchWith(params)
  }
  function onCategoryChange(value: string) {
    setCategoryFilter(value)
    const params = buildParams({ page: 0 })
    if (value) params.set('category', value); else params.delete('category')
    refetchWith(params)
  }
  function onStatusChange(value: '' | CostStatus) {
    setStatusFilter(value)
    const params = buildParams({ page: 0 })
    if (value) params.set('status', value); else params.delete('status')
    refetchWith(params)
  }

  async function refreshCurrentPage() {
    await fetchList(page)
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

  async function togglePaid(cost: OperationalCost) {
    setMarkingPaid(cost.id)
    const res = await fetch('/api/owner/costs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cost.id, markPaid: !cost.paid_at }),
    })
    setMarkingPaid(null)
    if (res.ok) refreshCurrentPage()
  }

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            style={selectStyle}
            value={periodFilter}
            onChange={e => onPeriodChange(e.target.value)}
          >
            <option value="">Todos os períodos</option>
            {monthOptions().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            style={selectStyle}
            value={categoryFilter}
            onChange={e => onCategoryChange(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            style={selectStyle}
            value={statusFilter}
            onChange={e => onStatusChange(e.target.value as '' | CostStatus)}
          >
            <option value="">Todos os estados</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Atrasados</option>
          </select>
        </div>
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

      <div style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '12px' }}>
        {total} custo{total !== 1 ? 's' : ''} {periodFilter || categoryFilter || statusFilter ? 'no filtro' : 'cadastrado'}{total !== 1 ? 's' : ''} · {fmt(summary.total)}
      </div>

      {costs.length === 0 ? (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
        }}>
          {periodFilter || categoryFilter || statusFilter
            ? 'Nenhum custo encontrado para esse filtro.'
            : 'Nenhum custo cadastrado ainda.'}
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
                {['Descrição', 'Valor', 'Tipo', 'Recorrência', 'Vencimento', 'Categoria', 'Estado', ''].map(h => (
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
              {costs.map((c, i) => {
                const status = getCostStatus(c)
                return (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i < costs.length - 1 ? '0.5px solid var(--border)' : 'none',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--powder)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
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
                    <StatusBadge status={status} />
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => togglePaid(c)}
                        disabled={markingPaid === c.id}
                        title={c.paid_at ? 'Marcar como não pago' : 'Confirmar pagamento'}
                        style={{
                          padding: '5px 10px', borderRadius: '99px',
                          background: '#fff', color: c.paid_at ? 'var(--mist)' : '#047857',
                          border: '0.5px solid var(--border-strong)',
                          fontSize: '11px', fontWeight: '500',
                          cursor: markingPaid === c.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-sans)',
                          opacity: markingPaid === c.id ? 0.6 : 1,
                        }}
                      >
                        {markingPaid === c.id ? '...' : c.paid_at ? 'Desfazer' : 'Confirmar pagamento'}
                      </button>
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
              )})}
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
            onClick={() => fetchList(page - 1)}
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
            onClick={() => fetchList(page + 1)}
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
          knownCategories={allCategories}
          onClose={() => setFormModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
