'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UnifiedSaleBookingModal, { type PackageOption } from './UnifiedSaleBookingModal'

type Activity = { id: string; name: string; default_price: number; default_duration_min: number }
type Instructor = { id: string; name: string }

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
 *  the schedule, so this stays a single-purpose "sell a package" card. */
export default function QuickSaleCard({
  packageTypes,
  activities,
  instructors,
  schoolSlug,
  schoolName,
}: {
  packageTypes: PackageOption[]
  activities: Activity[]
  instructors: Instructor[]
  schoolSlug: string
  schoolName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

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
          Venda Rápida
        </span>
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: '10px 16px',
            background: 'var(--slate)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '13px', fontWeight: '500',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            alignSelf: 'flex-start',
          }}
        >
          + Nova Venda de Pacote
        </button>
      </div>

      {open && (
        <UnifiedSaleBookingModal
          packageTypes={packageTypes}
          activities={activities}
          instructors={instructors}
          schoolSlug={schoolSlug}
          schoolName={schoolName}
          onClose={() => setOpen(false)}
          onSold={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
