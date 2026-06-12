'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/owner',          label: 'Base Camp' },
  { href: '/owner/sessions', label: 'Sessions'  },
  { href: '/owner/students', label: 'Students'  },
  { href: '/owner/crew',     label: 'Crew'      },
  { href: '/owner/packages', label: 'Packages'  },
  { href: '/owner/payments', label: 'Payments'  },
  { href: '/owner/reports',  label: 'Reports'   },
  { href: '/owner/settings', label: 'Settings'  },
]

export default function OwnerNav({ schoolName }: { schoolName?: string }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/owner') return pathname === '/owner'
    return pathname.startsWith(href)
  }

  return (
    <header style={{
      background: '#fff',
      borderBottom: '0.5px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
        height: '52px',
      }}>

        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          <Link href="/owner" style={{
            fontSize: '15px',
            fontWeight: '600',
            color: 'var(--slate)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
          }}>
            Pico Base
          </Link>
        </div>

        {/* Nav links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          flex: 1,
        }}>
          {navItems.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: active ? '500' : '400',
                  color: active ? 'var(--slate)' : 'var(--mist)',
                  textDecoration: 'none',
                  background: active ? 'var(--powder)' : 'transparent',
                  transition: 'color 0.15s, background 0.15s',
                  whiteSpace: 'nowrap',
                  position: 'relative' as const,
                }}
              >
                {item.label}
                {active && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: '12px',
                    right: '12px',
                    height: '2px',
                    background: 'var(--glacial)',
                    borderRadius: 'var(--radius-full)',
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right — school name */}
        <div style={{
          fontSize: '11px',
          fontWeight: '500',
          color: 'var(--mist)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          {schoolName ?? 'Ventos do Norte'}
        </div>

      </div>
    </header>
  )
}

