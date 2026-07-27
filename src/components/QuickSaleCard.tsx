'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UnifiedSaleBookingModal, { type PackageOption } from './UnifiedSaleBookingModal'

type Activity = { id: string; name: string; default_price: number; default_duration_min: number }

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

const SALE_CHANNELS = [
  { label: 'Venda Presencial (Na Hora)' },
  { label: 'Venda via WhatsApp / Instagram' },
]

/** Replaces the old "Mural de Avisos" slot at the top of Spot — that
 *  widget had no operational use for a receptionist mid-shift; a one-click
 *  path into a package sale does. Opens the guided sell+pay+schedule+check-in
 *  wizard, without a student pre-selected. Aguardando Vento's per-card
 *  "Vender Pacote" button keeps the older single-step SellPackageFlowModal —
 *  that student is already mid-checkin, so this wizard's payment/scheduling/
 *  QR steps would be redundant there.
 *
 *  A "+ Nova Reserva" shortcut lived here briefly (opening
 *  owner/bookings/AddBookingModal.tsx) but was reverted — Aulas Agendadas'
 *  own "+ Agendar" already covers creating a new reservation directly on
 *  the schedule, so this stays a single-purpose "sell a package" card.
 *
 *  The split-button's dropdown (Presencial / WhatsApp-Instagram) is purely
 *  an entry-point grouping for the operator's own mental model —
 *  package_sales has no channel/origin column, so every option opens the
 *  exact same wizard. A third "Gerar Link de Pagamento" option was dropped
 *  entirely: generating a real payment link needs a payment processor this
 *  app doesn't integrate (Mercado Pago was explicitly skipped earlier), so
 *  it can't do anything a fixed label wouldn't be lying about. */
export default function QuickSaleCard({
  packageTypes,
  activities,
  schoolSlug,
  schoolName,
  instructors,
  todaySalesTotal,
  pendingCount,
}: {
  packageTypes: PackageOption[]
  activities: Activity[]
  schoolSlug: string
  schoolName: string
  instructors: { id: string; name: string; sports?: string[] | null }[]
  todaySalesTotal: number
  pendingCount: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  function startSale() {
    setMenuOpen(false)
    setOpen(true)
  }

  return (
    <>
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        padding: '16px 20px',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '10px', flexWrap: 'wrap', rowGap: '6px',
        }}>
          <span style={{
            fontSize: '10px', fontWeight: '600',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)',
          }}>
            Venda Rápida
          </span>
          {/* Header chips — today's close rate at a glance, no click needed */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{
              padding: '2px 9px', borderRadius: 'var(--radius-full)',
              fontSize: '11px', fontWeight: '600',
              background: 'var(--color-pb-glacial-light)', color: 'var(--color-pb-glacial-dark)',
              whiteSpace: 'nowrap',
            }}>
              Vendas hoje: {fmt(todaySalesTotal)}
            </span>
            {pendingCount > 0 && (
              <span style={{
                padding: '2px 9px', borderRadius: 'var(--radius-full)',
                fontSize: '11px', fontWeight: '600',
                background: 'var(--amber-light)', color: 'var(--amber)',
                whiteSpace: 'nowrap',
              }}>
                Pendentes: {pendingCount}
              </span>
            )}
          </div>
        </div>

        {/* Split button — the whole unit (not each half separately) lifts
            on hover/press, same pb-card-interactive tactile feel Spot's
            "Hoje" stat tiles already use, applied to the wrapper so the
            main CTA and the channel-menu caret move together as one control. */}
        <div ref={menuRef} className="pb-card-interactive" style={{
          position: 'relative', display: 'inline-flex', alignSelf: 'flex-start',
          borderRadius: 'var(--radius-md)',
        }}>
          <button
            onClick={startSale}
            style={{
              padding: '10px 16px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
              fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            + Registrar Venda
          </button>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Escolher canal da venda"
            aria-expanded={menuOpen}
            style={{
              padding: '10px 12px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderLeft: '0.5px solid rgba(255,255,255,0.25)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              cursor: 'pointer', fontSize: '10px', fontFamily: 'var(--font-sans)',
            }}
          >
            ▾
          </button>

          {menuOpen && (
            <div role="menu" style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              minWidth: '230px', background: '#fff',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)', overflow: 'hidden', zIndex: 20,
            }}>
              {SALE_CHANNELS.map(channel => (
                <button
                  key={channel.label}
                  role="menuitem"
                  onClick={startSale}
                  style={{
                    display: 'block', width: '100%', padding: '10px 14px',
                    background: 'none', border: 'none', textAlign: 'left',
                    fontSize: '13px', color: 'var(--slate)', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--powder)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  {channel.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {open && (
        <UnifiedSaleBookingModal
          packageTypes={packageTypes}
          activities={activities}
          schoolSlug={schoolSlug}
          schoolName={schoolName}
          instructors={instructors}
          onClose={() => setOpen(false)}
          onSold={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
