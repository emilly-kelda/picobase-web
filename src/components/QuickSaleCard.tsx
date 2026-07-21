'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SellPackageFlowModal, { type PackageOption } from './SellPackageFlowModal'

/** Replaces the old "Mural de Avisos" slot at the top of Spot — that
 *  widget had no operational use for a receptionist mid-shift; a one-click
 *  path into a package sale does. Opens the same unified sell modal used by
 *  Aguardando Vento's per-card "Vender Pacote" button, just without a student
 *  pre-selected. */
export default function QuickSaleCard({ packageTypes }: { packageTypes: PackageOption[] }) {
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
        <SellPackageFlowModal
          packageTypes={packageTypes}
          onClose={() => setOpen(false)}
          onSold={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
