'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Persistent top banner shown across every /owner page while master is
 *  impersonating a school (see src/app/api/master/impersonate/route.ts) —
 *  the only visual cue that the session isn't a real owner login, plus the
 *  one way out of it. */
export default function ImpersonationBanner({ schoolName }: { schoolName: string }) {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  async function exit() {
    setExiting(true)
    await fetch('/api/master/impersonate', { method: 'DELETE' })
    router.push('/master')
    router.refresh()
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
      padding: '8px 20px',
      background: '#1A1C22', color: '#fff',
      fontSize: '13px', fontFamily: 'var(--font-sans)',
    }}>
      <span>
        Visualizando como <strong>{schoolName}</strong> — modo administrador
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={exiting}
        style={{
          padding: '4px 12px', borderRadius: '6px',
          border: '0.5px solid rgba(255,255,255,0.4)',
          background: 'transparent', color: '#fff',
          fontSize: '12px', fontWeight: '500',
          cursor: exiting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {exiting ? 'Saindo...' : 'Sair'}
      </button>
    </div>
  )
}
