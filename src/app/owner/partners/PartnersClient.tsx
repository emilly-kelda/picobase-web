'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Partner } from '@/repositories/partnerRepository'
import OverflowMenu from '@/components/ui/OverflowMenu'
import PartnerFormModal from './PartnerFormModal'

const TYPE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  hotel:    { bg: '#EEF3FC', color: '#1A4B8A', icon: '🏨' },
  agencia:  { bg: '#F0EBFA', color: '#4B2080', icon: '✈️' },
  operador: { bg: '#E0F8F5', color: '#007868', icon: '🧭' },
}
const DEFAULT_TYPE_STYLE = { bg: 'var(--powder)', color: 'var(--mist)', icon: '🤝' }

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

export default function PartnersClient({
  partners,
  baseUrl,
  schoolSlug,
  metricsByPartner,
}: {
  partners: Partner[]
  baseUrl: string
  schoolSlug: string
  // Referral count + revenue attributed to each partner this calendar
  // month (getPartnerCommissions) — "referrals" not "students", since
  // referrals has no student-identity column at all.
  metricsByPartner: Map<string, { revenue: number; referrals: number }>
}) {
  const router = useRouter()
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; partner: Partner } | null>(null)
  const [pending, setPending]     = useState<string | null>(null)
  const [copiedId, setCopiedId]   = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [showInactive, setShowInactive] = useState(false)

  function onFormSaved() {
    setFormModal(null)
    router.refresh()
  }

  async function deactivate(partner: Partner) {
    if (!window.confirm(`Pausar o link de "${partner.name}"? O link deixa de funcionar até ser reativado — o histórico de indicações é mantido.`)) return
    setPending(partner.id)
    const res = await fetch(`/api/owner/partners?id=${partner.id}`, { method: 'DELETE' })
    setPending(null)
    if (res.ok) router.refresh()
  }

  async function reactivate(partner: Partner) {
    setPending(partner.id)
    const res = await fetch('/api/owner/partners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: partner.id, action: 'reactivate' }),
    })
    setPending(null)
    if (res.ok) router.refresh()
  }

  function linkFor(partner: Partner) {
    return `${baseUrl}/book/${schoolSlug}?ref=${partner.referral_code}`
  }

  async function copyLink(partner: Partner) {
    await navigator.clipboard.writeText(linkFor(partner))
    setCopiedId(partner.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Leaderboard: active partners first, sorted by this month's revenue
  // descending, then inactive ones (only shown at all with showInactive) —
  // never interleaved with the ranking above them.
  const visiblePartners = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = partners.filter(p => !q || p.name.toLowerCase().includes(q))
    const active = filtered.filter(p => p.active)
      .sort((a, b) => (metricsByPartner.get(b.id)?.revenue ?? 0) - (metricsByPartner.get(a.id)?.revenue ?? 0))
    const inactive = filtered.filter(p => !p.active)
    return showInactive ? [...active, ...inactive] : active
  }, [partners, search, showInactive, metricsByPartner])

  const inactiveCount = partners.filter(p => !p.active).length

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', gap: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)', whiteSpace: 'nowrap',
          }}>
            {partners.length} parceiro{partners.length !== 1 ? 's' : ''} cadastrado{partners.length !== 1 ? 's' : ''}
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            style={{
              flex: 1, maxWidth: '240px', padding: '7px 12px',
              border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
              fontSize: '12px', color: 'var(--slate)', fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {inactiveCount > 0 && (
            <button
              onClick={() => setShowInactive(v => !v)}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: '12px', color: 'var(--mist)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', textDecoration: 'underline dotted',
                whiteSpace: 'nowrap',
              }}
            >
              {showInactive ? 'Ocultar' : 'Mostrar'} inativos ({inactiveCount})
            </button>
          )}
          <button
            onClick={() => setFormModal({ mode: 'create' })}
            style={{
              padding: '8px 16px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '12px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
            }}
          >
            + Adicionar parceiro
          </button>
        </div>
      </div>

      {visiblePartners.length === 0 ? (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
        }}>
          {partners.length === 0
            ? 'Nenhum parceiro cadastrado ainda.'
            : 'Nenhum parceiro encontrado para essa busca.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {visiblePartners.map(partner => {
            const style = TYPE_STYLE[partner.type ?? ''] ?? DEFAULT_TYPE_STYLE
            const metrics = metricsByPartner.get(partner.id)
            const isPending = pending === partner.id
            return (
              <div key={partner.id} style={{
                background: '#fff',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                opacity: partner.active ? 1 : 0.55,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '16px 18px 12px',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: 'var(--radius-lg)',
                    background: partner.logo_url ? '#fff' : style.bg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', overflow: 'hidden',
                    border: partner.logo_url ? '0.5px solid var(--border)' : 'none',
                  }}>
                    {partner.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      style.icon
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)' }}>
                        {partner.name}
                      </span>
                      {!partner.active && (
                        <span style={{
                          fontSize: '10px', fontWeight: '500', padding: '1px 7px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--powder)', color: 'var(--mist)',
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>
                          Pausado
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                      Comissão {Math.round((partner.commission_pct ?? 0) * 100)}%
                      {partner.discount_pct ? ` · Desconto cliente ${Math.round(partner.discount_pct * 100)}%` : ''}
                    </div>
                  </div>
                  <OverflowMenu
                    items={[
                      { label: 'Editar', onClick: () => setFormModal({ mode: 'edit', partner }) },
                      partner.active
                        ? { label: 'Pausar link', onClick: () => deactivate(partner), disabled: isPending }
                        : { label: 'Reativar', onClick: () => reactivate(partner), disabled: isPending },
                    ]}
                  />
                </div>

                {/* This month's leaderboard numbers — revenue first (the
                    sort key above), referrals second. "Indicações", not
                    "alunos": referrals has no student-identity column, so
                    a distinct-student count isn't something this app can
                    actually report yet. */}
                {partner.active && (
                  <div style={{
                    display: 'flex', gap: '16px', padding: '0 18px 12px',
                    fontSize: '12px',
                  }}>
                    <div>
                      <span style={{ color: 'var(--mist)' }}>Receita este mês </span>
                      <span style={{ fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(metrics?.revenue ?? 0)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--mist)' }}>Indicações </span>
                      <span style={{ fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                        {metrics?.referrals ?? 0}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{
                  padding: '12px 18px', background: 'var(--powder)',
                  borderTop: '0.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <button
                    onClick={() => copyLink(partner)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '99px',
                      background: '#fff', color: 'var(--slate)',
                      border: '0.5px solid var(--border-strong)',
                      fontSize: '11px', fontWeight: '500',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="12" height="12" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {copiedId === partner.id ? 'Copiado ✓' : 'Copiar Link'}
                  </button>
                  <a
                    href={`/api/owner/partners/${partner.id}/qr?format=png`}
                    style={{
                      padding: '6px 12px', borderRadius: '99px',
                      background: 'var(--slate)', color: '#fff',
                      fontSize: '11px', fontWeight: '500',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    QR Code
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formModal && (
        <PartnerFormModal
          editing={formModal.mode === 'edit' ? formModal.partner : null}
          onClose={() => setFormModal(null)}
          onSaved={onFormSaved}
        />
      )}
    </div>
  )
}
