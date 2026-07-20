'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getT } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import Logo from '@/components/Logo'
import NoticeBanner from '@/components/NoticeBanner'
import { createClient } from '@/utils/supabase/client'
import {
  HomeIcon, CalendarIcon, UserIcon, InboxIcon, UsersIcon,
  PackageIcon, WalletIcon, ChartIcon, GearIcon, ChevronLeftIcon, TagIcon, LinkIcon,
} from '@/components/nav-icons'

type Season = { id: string; label: string }
type NavIcon = (props: { size?: number }) => React.ReactElement

const EXPANDED_WIDTH  = 216
const COLLAPSED_WIDTH = 68
const COLLAPSE_STORAGE_KEY = 'pb-sidebar-collapsed'
const THEME_STORAGE_KEY    = 'pb-sidebar-theme'

type Props = {
  seasons?: Season[]
  activeSeasonId?: string
  activeSeasonLabel?: string
  lang?: Lang
  pendingBookingsCount?: number
  children?: React.ReactNode
}

export default function OwnerNav({
  seasons = [], activeSeasonId, activeSeasonLabel, lang = 'pt',
  pendingBookingsCount = 0, children,
}: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const t        = getT(lang)

  // Starts expanded on the server-rendered pass (no localStorage there) and
  // corrects itself from the saved preference right after mount — a one-time
  // possible flash on reload beats fighting SSR/client hydration mismatches
  // over a purely cosmetic preference.
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_STORAGE_KEY)
    if (saved === '1') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  // Dark (pb-storm) is the new default per picobase_design_system_dossie.md
  // Fase 4 — light is the previous white sidebar, kept as a toggle rather
  // than removed outright. Same SSR-can't-see-localStorage tradeoff as
  // `collapsed` above: starts dark, corrects itself post-mount.
  const [sidebarTheme, setSidebarTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') setSidebarTheme(saved)
  }, [])

  function toggleTheme() {
    setSidebarTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_STORAGE_KEY, next)
      return next
    })
  }

  const dark = sidebarTheme === 'dark'

  const navItems: Array<{ href: string; label: string; icon: NavIcon; badge?: number }> = [
    { href: '/owner',           label: t.nav_basecamp, icon: HomeIcon    },
    { href: '/owner/sessions',  label: t.nav_sessions,  icon: CalendarIcon },
    { href: '/owner/students',  label: t.nav_students,  icon: UserIcon     },
    { href: '/owner/bookings',  label: t.nav_bookings,  icon: InboxIcon, badge: pendingBookingsCount },
    { href: '/owner/crew',      label: t.nav_crew,      icon: UsersIcon    },
    { href: '/owner/partners',  label: t.nav_partners,  icon: LinkIcon     },
    { href: '/owner/packages',  label: t.nav_packages,  icon: PackageIcon  },
    { href: '/owner/payments',  label: t.nav_payments,  icon: WalletIcon   },
    { href: '/owner/costs',     label: t.nav_costs,     icon: TagIcon      },
    { href: '/owner/reports',   label: t.nav_reports,   icon: ChartIcon    },
    { href: '/owner/settings',  label: t.nav_settings,  icon: GearIcon     },
  ]

  function isActive(href: string) {
    if (href === '/owner') return pathname === '/owner'
    return pathname.startsWith(href)
  }

  function selectSeason(id: string) {
    document.cookie = `active_season_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  // Sign-out: clears the Supabase session cookie, then navigates to /login.
  // router.refresh() invalidates Next.js's server-component cache so that
  // if the user hits the back button, the middleware re-evaluates the (now
  // absent) session and redirects them back to /login instead of serving
  // stale /owner content.
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{`
        .nav-row {
          display: flex; align-items: center; gap: 12px;
          padding: 9px ${collapsed ? '0' : '12px'};
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          border-radius: var(--radius-md);
          color: ${dark ? 'rgba(255,255,255,0.6)' : 'var(--mist)'};
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }
        .nav-row:hover {
          color: ${dark ? '#fff' : 'var(--slate)'};
          background: ${dark ? 'rgba(255,255,255,0.06)' : 'var(--powder)'};
        }
        .nav-row.active {
          color: ${dark ? '#fff' : 'var(--slate)'};
          font-weight: 500;
          background: ${dark ? 'var(--color-pb-slate)' : 'var(--powder)'};
        }
        .nav-row svg { flex-shrink: 0; }
        .nav-active-dot {
          display: ${dark ? 'inline-block' : 'none'};
          width: 6px; height: 6px; border-radius: 999px;
          background: var(--color-pb-glacial);
          margin-left: auto;
          flex-shrink: 0;
        }
        .nav-label {
          font-size: 13px;
          opacity: ${collapsed ? 0 : 1};
          width: ${collapsed ? '0px' : 'auto'};
          overflow: hidden;
          transition: opacity 0.15s;
        }
        .season-group { position: relative; }
        .season-dropdown {
          display: none;
          position: absolute;
          bottom: 0;
          left: calc(100% + 8px);
          background: #fff;
          border: 0.5px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 6px;
          min-width: 160px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          z-index: 100;
          flex-direction: column;
          gap: 2px;
        }
        .season-group:hover .season-dropdown { display: flex; }
        .season-option {
          padding: 7px 12px;
          border-radius: var(--radius-md);
          font-size: 13px;
          color: var(--mist);
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .season-option:hover { background: var(--powder); color: var(--slate); }
        .season-option.active { background: var(--powder); color: var(--slate); font-weight: 500; }
      `}</style>

      <aside style={{
        width: `${sidebarWidth}px`,
        flexShrink: 0,
        background: dark ? 'var(--color-pb-storm)' : '#fff',
        borderRight: dark ? 'none' : '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, background 0.2s ease',
        zIndex: 50,
      }}>
        {/* Logo + collapse toggle */}
        <div style={{
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: collapsed ? '10px' : 0,
          padding: collapsed ? '18px 8px' : '18px 16px',
          flexShrink: 0,
        }}>
          <Link href="/owner" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Logo size={collapsed ? 14 : 17} variant={collapsed ? 'mark' : 'full'} theme={dark ? 'dark' : 'light'} />
          </Link>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            style={{
              width: '26px', height: '26px', borderRadius: 'var(--radius-md)',
              border: 'none', background: 'transparent', color: dark ? 'rgba(255,255,255,0.6)' : 'var(--mist)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
            }}
          >
            <ChevronLeftIcon size={15} />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{
          display: 'flex', flexDirection: 'column', gap: '2px',
          padding: '4px 10px', flex: 1,
        }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`nav-row${isActive(item.href) ? ' active' : ''}`}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <item.icon size={18} />
                {!!item.badge && item.badge > 0 && (
                  <span style={{
                    position: collapsed ? 'absolute' : 'static',
                    top: -4, right: -6,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: '15px', height: '15px', padding: '0 3px',
                    marginLeft: collapsed ? 0 : '2px',
                    borderRadius: '99px', background: 'var(--signal)', color: '#fff',
                    fontSize: '9px', fontWeight: '600', lineHeight: 1,
                  }}>
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="nav-label">{item.label}</span>
              {isActive(item.href) && !collapsed && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>

        {/* Theme toggle + season selector + sign-out */}
        <div style={{
          padding: '12px 10px',
          borderTop: dark ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0,
        }}>
          <button
            onClick={toggleTheme}
            title={dark ? 'Sidebar clara' : 'Sidebar escura'}
            style={{
              fontSize: '11px', fontWeight: '500',
              color: dark ? 'rgba(255,255,255,0.6)' : 'var(--mist)',
              background: dark ? 'rgba(255,255,255,0.06)' : 'var(--powder)',
              border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)',
              padding: collapsed ? '7px' : '7px 10px',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start', gap: '6px',
              transition: 'color 0.15s, background 0.15s',
            }}
          >
            <span>{dark ? '🌙' : '☀️'}</span>
            {!collapsed && <span>{dark ? 'Escura' : 'Clara'}</span>}
          </button>

          {seasons.length > 0 && (
            <div className="season-group">
              <div style={{
                fontSize: '11px', fontWeight: '500', color: dark ? 'rgba(255,255,255,0.6)' : 'var(--mist)',
                background: dark ? 'rgba(255,255,255,0.06)' : 'var(--powder)',
                border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)',
                padding: collapsed ? '7px' : '7px 10px',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between', gap: '6px',
              }}>
                <span style={{
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: collapsed ? 'none' : 'block',
                }}>
                  {activeSeasonLabel ?? '—'}
                </span>
                <span style={{ fontSize: '9px', opacity: 0.45, flexShrink: 0 }}>
                  {collapsed ? '🗓' : '▾'}
                </span>
              </div>
              <div className="season-dropdown">
                {seasons.map(s => (
                  <div
                    key={s.id}
                    className={`season-option${s.id === activeSeasonId ? ' active' : ''}`}
                    onClick={() => selectSeason(s.id)}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={signOut}
            title="Sair"
            style={{
              fontSize: '12px', fontWeight: '500', color: dark ? 'rgba(255,255,255,0.6)' : 'var(--mist)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: collapsed ? '7px' : '7px 10px',
              borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)',
              transition: 'color 0.15s, background 0.15s',
              textAlign: collapsed ? 'center' : 'left',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = dark ? '#fff' : 'var(--slate)'
              e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'var(--powder)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.6)' : 'var(--mist)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px' }}>
        <NoticeBanner />
        {children}
      </main>
    </div>
  )
}
