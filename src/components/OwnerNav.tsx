'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getT } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import Logo from '@/components/Logo'
import { createClient } from '@/utils/supabase/client'

type Season = { id: string; label: string }

type Props = {
  seasons?: Season[]
  activeSeasonId?: string
  activeSeasonLabel?: string
  lang?: Lang
}

export default function OwnerNav({ seasons = [], activeSeasonId, activeSeasonLabel, lang = 'pt' }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const t        = getT(lang)

  const navItems = [
    { href: '/owner',           label: t.nav_basecamp },
    { href: '/owner/sessions',  label: t.nav_sessions  },
    { href: '/owner/students',  label: t.nav_students  },
    { href: '/owner/crew',      label: t.nav_crew      },
    { href: '/owner/packages',  label: t.nav_packages  },
    { href: '/owner/payments',  label: t.nav_payments  },
    { href: '/owner/settings',  label: t.nav_settings  },
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

  return (
    <>
      <style>{`
        .nav-link {
          padding: 4px 10px;
          font-size: 13px;
          color: var(--mist);
          text-decoration: none;
          white-space: nowrap;
          transition: color 0.15s;
          border-bottom: 2px solid transparent;
          line-height: 1;
        }
        .nav-link:hover { color: var(--slate); }
        .nav-link.active {
          color: var(--slate);
          font-weight: 500;
          background: transparent;
          border-bottom-color: var(--glacial);
        }
        .season-group { position: relative; }
        .season-dropdown {
          display: none;
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: #fff;
          border: 0.5px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 6px;
          min-width: 140px;
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

      <header style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          width: '100%',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          height: '56px',
        }}>

          {/* Logo */}
          <Link href="/owner" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Logo size={18} variant="full" />
          </Link>

          {/* Flat nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${isActive(item.href) ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right — season selector + sign-out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {seasons.length > 0 && (
              <div className="season-group">
                <div style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: 'var(--mist)',
                  background: 'var(--powder)',
                  border: '1px solid var(--border)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {activeSeasonLabel ?? '—'}
                  <span style={{ fontSize: '9px', opacity: 0.45 }}>▾</span>
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
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--mist)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--slate)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--mist)')}
            >
              Sair
            </button>
          </div>

        </div>
      </header>
    </>
  )
}
