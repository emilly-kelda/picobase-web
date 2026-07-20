'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/Logo'

const NAV = [
  { href: '/owner',          label: 'Spot'          },
  { href: '/owner/sessions', label: 'Aulas'         },
  { href: '/owner/students', label: 'Alunos'        },
  { href: '/owner/crew',     label: 'Equipe'        },
  { href: '/owner/packages', label: 'Pacotes'       },
  { href: '/owner/payments', label: 'Pagamentos'    },
  { href: '/owner/settings', label: 'Configurações' },
]

type Props = { schoolName?: string }

export default function OwnerSidebar({ schoolName }: Props) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '200px',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      borderRight: '0.5px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <Logo size={16} variant="full" />
        {schoolName && (
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            color: 'var(--mist)',
            fontWeight: '500',
          }}>
            {schoolName}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: '8px',
        overflowY: 'auto',
      }}>
        {NAV.map(({ href, label }) => {
          const active = href === '/owner'
            ? pathname === '/owner'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: active ? '500' : '400',
                color: active ? 'var(--glacial-dark)' : 'var(--mist)',
                background: active ? 'var(--glacial-light)' : 'transparent',
                textDecoration: 'none',
                marginBottom: '2px',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
