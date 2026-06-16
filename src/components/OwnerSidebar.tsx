'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, UserCheck,
  Package, Banknote, Settings, ChevronDown, Zap,
} from 'lucide-react'
import Logo from '@/components/Logo'

const NAV = [
  { href: '/owner',          label: 'Base Camp',     icon: LayoutDashboard },
  { href: '/owner/sessions', label: 'Aulas',         icon: Calendar        },
  { href: '/owner/students', label: 'Alunos',        icon: Users           },
  { href: '/owner/crew',     label: 'Equipe',        icon: UserCheck       },
  { href: '/owner/packages', label: 'Pacotes',       icon: Package         },
  { href: '/owner/payments', label: 'Financeiro',    icon: Banknote        },
  { href: '/owner/settings', label: 'Configurações', icon: Settings        },
]

type Props = { schoolName?: string }

export default function OwnerSidebar({ schoolName }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-[var(--border)] overflow-hidden">

      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <Logo size={18} variant="full" />
        {schoolName && (
          <div className="mt-3 flex items-center justify-between gap-1 text-[11px] text-[var(--mist)]">
            <span className="font-medium truncate">{schoolName}</span>
            <ChevronDown size={11} className="shrink-0" />
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/owner'
            ? pathname === '/owner'
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                active
                  ? 'bg-[var(--glacial-light)] text-[var(--glacial-dark)]'
                  : 'text-[var(--mist)] hover:bg-[var(--powder)] hover:text-[var(--slate)]',
              ].join(' ')}
            >
              <Icon size={14} className="shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Trial badge */}
      <div className="px-3 pb-4 pt-2 border-t border-[var(--border)]">
        <div className="rounded-xl bg-[var(--amber-light)] p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={11} className="text-[var(--amber)]" fill="currentColor" />
            <span className="text-[11px] font-semibold text-[var(--amber)]">Trial</span>
          </div>
          <p className="text-[11px] text-[var(--mist)] mb-2.5 leading-relaxed">
            12 dias restantes
          </p>
          <Link
            href="/owner/settings"
            className="block text-center text-[11px] font-medium text-[var(--amber)] border border-[var(--amber)] rounded-lg py-1.5 hover:bg-[var(--amber)] hover:text-white transition-colors"
          >
            Fazer upgrade
          </Link>
        </div>
      </div>
    </aside>
  )
}
