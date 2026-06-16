'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, UserCheck,
  Package, Banknote, Settings, ChevronDown,
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

function PicoAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* backdrop */}
      <circle cx="20" cy="20" r="20" fill="#EDE7DD" />
      {/* ear — left outer */}
      <path d="M9 18 L5 7 L14.5 13.5Z" fill="#7A5030" />
      {/* ear — left inner */}
      <path d="M9.5 17 L6.5 9 L13.5 13.5Z" fill="#C8945A" />
      {/* ear — right outer */}
      <path d="M31 18 L35 7 L25.5 13.5Z" fill="#7A5030" />
      {/* ear — right inner */}
      <path d="M30.5 17 L33.5 9 L26.5 13.5Z" fill="#C8945A" />
      {/* head */}
      <ellipse cx="20" cy="23.5" rx="12.5" ry="10.5" fill="#D4975A" />
      {/* sable forehead */}
      <ellipse cx="20" cy="18" rx="11" ry="7" fill="#B87040" />
      {/* cream muzzle */}
      <ellipse cx="20" cy="27" rx="7.5" ry="5" fill="#F0C878" />
      {/* eye — left */}
      <circle cx="14.5" cy="21.5" r="2.3" fill="#1A1C22" />
      <circle cx="15.15" cy="20.85" r="0.6" fill="rgba(255,255,255,0.5)" />
      {/* eye — right */}
      <circle cx="25.5" cy="21.5" r="2.3" fill="#1A1C22" />
      <circle cx="26.15" cy="20.85" r="0.6" fill="rgba(255,255,255,0.5)" />
      {/* nose */}
      <ellipse cx="20" cy="26" rx="2.2" ry="1.6" fill="#1A1C22" />
      {/* smile */}
      <path d="M17 28.5 Q20 31.5 23 28.5" stroke="#1A1C22" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

type Props = { schoolName?: string }

export default function OwnerSidebar({ schoolName }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-[var(--border)] overflow-hidden">

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <Logo size={18} variant="full" />
        {schoolName && (
          <button className="mt-3 w-full flex items-center justify-between gap-1 text-[11px] text-[var(--mist)] hover:text-[var(--slate)] transition-colors">
            <span className="font-medium truncate text-left">{schoolName}</span>
            <ChevronDown size={10} className="shrink-0" />
          </button>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/owner'
            ? pathname === '/owner'
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'group flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors',
                active
                  ? 'bg-[var(--glacial-light)] text-[var(--glacial-dark)]'
                  : 'text-[var(--mist)] hover:bg-[var(--powder)] hover:text-[var(--slate)]',
              ].join(' ')}
            >
              <Icon
                size={14}
                className={[
                  'shrink-0 transition-colors',
                  active
                    ? 'text-[var(--glacial)]'
                    : 'text-[var(--border-strong)] group-hover:text-[var(--mist)]',
                ].join(' ')}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── Pico Section ──────────────────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-2 border-t border-[var(--border)]">
        <div className="rounded-2xl bg-[var(--powder)] overflow-hidden">
          {/* Corgi + message */}
          <div className="flex items-start gap-2.5 px-3.5 pt-3.5 pb-2.5">
            <div className="shrink-0 mt-0.5">
              <PicoAvatar size={36} />
            </div>
            <div className="min-w-0">
              <p className="text-[9.5px] font-semibold text-[var(--glacial-dark)] uppercase tracking-[0.1em] mb-0.5">
                Pico diz
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--mist)]">
                12 dias restantes<br />no seu trial.
              </p>
            </div>
          </div>
          {/* CTA */}
          <div className="px-3 pb-3">
            <Link
              href="/owner/settings"
              className="block text-center text-[11px] font-semibold text-white bg-[var(--slate)] rounded-xl py-2 hover:bg-[var(--storm)] transition-colors"
            >
              Fazer upgrade →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
