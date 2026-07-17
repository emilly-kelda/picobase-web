'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Logo from '@/components/Logo'

const NAV_ITEMS = [
  { href: '/master/dashboard', label: 'Escolas' },
  { href: '/master/costs',     label: 'Centro de Custos' },
]

export default function MasterHeader() {
  const router = useRouter()
  const pathname = usePathname()

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <Link href="/master" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <Logo size={14} variant="mark" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)', letterSpacing: '0.02em' }}>
            Super Admin
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: '4px' }}>
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-md)',
                  fontSize: '13px', fontWeight: active ? '600' : '400',
                  color: active ? 'var(--slate)' : 'var(--mist)',
                  background: active ? 'var(--powder)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
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
