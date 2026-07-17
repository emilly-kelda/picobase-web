'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MultiCurrencyPriceEditor from '@/components/MultiCurrencyPriceEditor'
import SellPackageButton from '@/components/SellPackageButton'
import PackageFormModal, { type PackageType } from './PackageFormModal'

type PackageCard = PackageType & {
  price_eur: number | null
  price_usd: number | null
  count: number
  revenue: number
  minutesSold: number
  minutesUsed: number
  minutesRemaining: number
  hasNoSales: boolean
}

const SPORT_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  kitesurf: { bg: '#E0F8F5', color: '#007868', icon: '🪁' },
  wingfoil: { bg: '#EEF3FC', color: '#1A4B8A', icon: '🌬️' },
  windsurf: { bg: '#FBF3E2', color: '#7A4C00', icon: '🏄' },
  kitefoil: { bg: '#F0EBFA', color: '#4B2080', icon: '🪁' },
}
const DEFAULT_SPORT_STYLE = { bg: 'var(--powder)', color: 'var(--mist)', icon: '🌊' }

function sportStyle(sport: string | null) {
  if (!sport) return DEFAULT_SPORT_STYLE
  return SPORT_STYLE[sport.toLowerCase()] ?? DEFAULT_SPORT_STYLE
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtH(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

export default function PackagesClient({
  packageTypes,
  schoolId,
}: {
  packageTypes: PackageCard[]
  schoolId: string
}) {
  const router = useRouter()
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; pkg: PackageCard } | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const knownSports = Array.from(new Set(packageTypes.map(p => p.sport).filter((s): s is string => !!s))).sort()

  const groups = new Map<string, PackageCard[]>()
  for (const pkg of packageTypes) {
    const key = pkg.sport?.trim() || 'Outros'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(pkg)
  }
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))

  function onFormSaved() {
    setFormModal(null)
    router.refresh()
  }

  async function deletePackage(pkg: PackageCard) {
    if (!window.confirm(`Excluir o pacote "${pkg.name}"? Vendas já feitas continuam registradas.`)) return
    setDeleting(pkg.id)
    const res = await fetch(`/api/owner/packages?id=${pkg.id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) router.refresh()
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)',
        }}>
          Tipos de pacote · {packageTypes.length} configurado{packageTypes.length !== 1 ? 's' : ''}
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
          + Adicionar pacote
        </button>
      </div>

      {packageTypes.length === 0 ? (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
        }}>
          Nenhum pacote cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sortedGroups.map(([sport, pkgs]) => {
            const style = sportStyle(sport === 'Outros' ? null : sport)
            return (
              <div key={sport}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '99px',
                    background: style.bg, color: style.color,
                    fontSize: '11px', fontWeight: '600',
                  }}>
                    {style.icon} {sport}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    {pkgs.length} pacote{pkgs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px',
                }}>
                  {pkgs.map(pkg => (
                    <div key={pkg.id} style={{
                      background: '#fff',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                    }}>
                      {/* Header: icon + name + edit/delete */}
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '16px 18px 12px',
                      }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
                          background: style.bg, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px',
                        }}>
                          {style.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)', marginBottom: '2px' }}>
                            {pkg.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                            {fmtH(pkg.totalMinutes)} totais
                            {pkg.hasNoSales && ' · sem vendas ainda'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={() => setFormModal({ mode: 'edit', pkg })}
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
                            onClick={() => deletePackage(pkg)}
                            disabled={deleting === pkg.id}
                            style={{
                              padding: '5px 10px', borderRadius: '99px',
                              background: '#fff', color: 'var(--signal)',
                              border: '0.5px solid var(--border-strong)',
                              fontSize: '11px', fontWeight: '500',
                              cursor: deleting === pkg.id ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--font-sans)',
                              opacity: deleting === pkg.id ? 0.6 : 1,
                            }}
                          >
                            {deleting === pkg.id ? '...' : 'Excluir'}
                          </button>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        background: 'var(--powder)',
                        borderTop: '0.5px solid var(--border)',
                        borderBottom: '0.5px solid var(--border)',
                      }}>
                        {(
                          [
                            { label: 'Vendidos', value: String(pkg.count) },
                            {
                              label: 'Horas rest.',
                              value: fmtH(pkg.minutesRemaining),
                              color: pkg.minutesRemaining > 0 ? '#8A5E00' : undefined,
                            },
                            { label: 'Receita', value: pkg.hasNoSales ? '—' : fmt(pkg.revenue) },
                          ] as Array<{ label: string; value: string; color?: string }>
                        ).map((m, i) => (
                          <div key={m.label} style={{
                            padding: '10px 12px',
                            borderLeft: i > 0 ? '0.5px solid var(--border)' : 'none',
                          }}>
                            <div style={{
                              fontSize: '9px', fontWeight: '600',
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                              color: 'var(--mist)', marginBottom: '3px',
                            }}>
                              {m.label}
                            </div>
                            <div style={{
                              fontSize: '13px', fontWeight: '600',
                              color: m.color ?? 'var(--slate)',
                              fontVariantNumeric: 'tabular-nums',
                            }}>
                              {m.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer: sell + price editor */}
                      <div style={{
                        padding: '12px 18px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      }}>
                        <SellPackageButton
                          packageId={pkg.id}
                          packageName={pkg.name}
                          price={pkg.price ?? 0}
                          schoolId={schoolId}
                        />
                        <MultiCurrencyPriceEditor
                          packageId={pkg.id}
                          currentPrices={{
                            price_brl: pkg.price ?? null,
                            price_eur: pkg.price_eur ?? null,
                            price_usd: pkg.price_usd ?? null,
                          }}
                          schoolId={schoolId}
                          type="package"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formModal && (
        <PackageFormModal
          editing={formModal.mode === 'edit' ? formModal.pkg : null}
          knownSports={knownSports}
          onClose={() => setFormModal(null)}
          onSaved={onFormSaved}
        />
      )}
    </div>
  )
}
