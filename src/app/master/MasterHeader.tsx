'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Logo from '@/components/Logo'

export default function MasterHeader() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 32px',
      background: '#fff', borderBottom: '1px solid var(--border)',
    }}>
      <Link href="/master" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <Logo size={14} variant="mark" />
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)', letterSpacing: '0.02em' }}>
          Super Admin
        </span>
      </Link>
      <button
        onClick={signOut}
        style={{
          fontSize: '12px', fontWeight: '500', color: 'var(--mist)',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '7px 10px', borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-sans)',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--slate)'; e.currentTarget.style.background = 'var(--powder)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--mist)'; e.currentTarget.style.background = 'transparent' }}
      >
        Sair
      </button>
    </header>
  )
}
