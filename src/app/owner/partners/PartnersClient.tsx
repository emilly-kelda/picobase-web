'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Partner } from '@/repositories/partnerRepository'
import PartnerFormModal from './PartnerFormModal'

const TYPE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  hotel:    { bg: '#EEF3FC', color: '#1A4B8A', icon: '🏨' },
  agencia:  { bg: '#F0EBFA', color: '#4B2080', icon: '✈️' },
  operador: { bg: '#E0F8F5', color: '#007868', icon: '🧭' },
}
const DEFAULT_TYPE_STYLE = { bg: 'var(--powder)', color: 'var(--mist)', icon: '🤝' }

export default function PartnersClient({
  partners,
  baseUrl,
  schoolSlug,
}: {
  partners: Partner[]
  baseUrl: string
  schoolSlug: string
}) {
  const router = useRouter()
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; partner: Partner } | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [copiedId, setCopiedId]   = useState<string | null>(null)

  function onFormSaved() {
    setFormModal(null)
    router.refresh()
  }

  async function deletePartner(partner: Partner) {
    if (!window.confirm(`Remover o parceiro "${partner.name}"? O link deixará de funcionar.`)) return
    setDeleting(partner.id)
    const res = await fetch(`/api/owner/partners?id=${partner.id}`, { method: 'DELETE' })
    setDeleting(null)
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
          {partners.length} parceiro{partners.length !== 1 ? 's' : ''} cadastrado{partners.length !== 1 ? 's' : ''}
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
          + Adicionar parceiro
        </button>
      </div>

      {partners.length === 0 ? (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
        }}>
          Nenhum parceiro cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {partners.map(partner => {
            const style = TYPE_STYLE[partner.type ?? ''] ?? DEFAULT_TYPE_STYLE
            return (
              <div key={partner.id} style={{
                background: '#fff',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
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
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)', marginBottom: '2px' }}>
                      {partner.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                      Comissão {Math.round((partner.commission_pct ?? 0) * 100)}%
                      {partner.discount_pct ? ` · Desconto cliente ${Math.round(partner.discount_pct * 100)}%` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => setFormModal({ mode: 'edit', partner })}
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
                      onClick={() => deletePartner(partner)}
                      disabled={deleting === partner.id}
                      style={{
                        padding: '5px 10px', borderRadius: '99px',
                        background: '#fff', color: 'var(--signal)',
                        border: '0.5px solid var(--border-strong)',
                        fontSize: '11px', fontWeight: '500',
                        cursor: deleting === partner.id ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-sans)',
                        opacity: deleting === partner.id ? 0.6 : 1,
                      }}
                    >
                      {deleting === partner.id ? '...' : 'Excluir'}
                    </button>
                  </div>
                </div>

                <div style={{
                  padding: '12px 18px', background: 'var(--powder)',
                  borderTop: '0.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <div style={{
                    flex: 1, minWidth: 0,
                    fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--slate)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {linkFor(partner)}
                  </div>
                  <button
                    onClick={() => copyLink(partner)}
                    style={{
                      padding: '5px 10px', borderRadius: '99px',
                      background: '#fff', color: 'var(--slate)',
                      border: '0.5px solid var(--border-strong)',
                      fontSize: '11px', fontWeight: '500',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      flexShrink: 0,
                    }}
                  >
                    {copiedId === partner.id ? 'Copiado ✓' : 'Copiar'}
                  </button>
                  <a
                    href={`/api/owner/partners/${partner.id}/qr?format=png`}
                    style={{
                      padding: '5px 10px', borderRadius: '99px',
                      background: 'var(--slate)', color: '#fff',
                      fontSize: '11px', fontWeight: '500',
                      textDecoration: 'none', flexShrink: 0,
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
