'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SellPackageFlowModal, { type PackageOption } from './SellPackageFlowModal'
import AddBookingModal from '@/app/owner/bookings/AddBookingModal'

type ActivityRef = { id: string; name: string }

/** Replaces the old "Mural de Avisos" slot at the top of Spot — that
 *  widget had no operational use for a receptionist mid-shift; one-click
 *  paths into a package sale or a booking do. "+ Nova Venda de Pacote"
 *  opens the same unified sell modal used by Aguardando Vento's per-card
 *  "Vender Pacote" button, just without a student pre-selected;
 *  "+ Nova Reserva" opens the same AddBookingModal the Bookings page uses
 *  (its own "Atividade" dropdown already reads from this school's real
 *  activities list — Aluguel/Supervisão/Downwind show up there whenever
 *  the school has them configured, nothing hardcoded to add). */
export default function QuickSaleCard({
  packageTypes,
  activities = [],
  schoolSlug,
}: {
  packageTypes: PackageOption[]
  activities?: ActivityRef[]
  schoolSlug?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)

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
        <span style={{
          fontSize: '10px', fontWeight: '600',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)', marginBottom: '10px',
        }}>
          Ações Rápidas
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              padding: '10px 16px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            + Nova Venda de Pacote
          </button>
          <button
            onClick={() => setBookingOpen(true)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs px-3 py-2 rounded-lg transition-colors border-0 shadow-none cursor-pointer"
          >
            + Nova Reserva
          </button>
        </div>
      </div>

      {open && (
        <SellPackageFlowModal
          packageTypes={packageTypes}
          onClose={() => setOpen(false)}
          onSold={() => { setOpen(false); router.refresh() }}
        />
      )}

      {bookingOpen && (
        <AddBookingModal
          schoolSlug={schoolSlug ?? ''}
          activities={activities}
          onClose={() => setBookingOpen(false)}
          onCreated={() => { setBookingOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
