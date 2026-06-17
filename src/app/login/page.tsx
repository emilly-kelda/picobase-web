'use client'

// Login page — client component using supabase.auth.signInWithPassword.
// After login, validates role from public.users:
//   - owner / master → redirect to /owner
//   - anything else  → sign out immediately and show an error
//     (instructor/partner/accountant never have sessions by design, so this
//      branch is a belt-and-suspenders guard, not an expected flow)

import { useState, Suspense } from 'react'
// (useEffect removed — not needed; auth redirect handled server-side by middleware)
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Logo from '@/components/Logo'

const ALLOWED_ROLES = ['owner', 'master'] as const

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  // Validate ?next= — accept internal paths only to prevent open redirect.
  const nextParam   = searchParams.get('next')
  const destination = nextParam?.startsWith('/') ? nextParam : '/owner'

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // ── Step 1: authenticate ────────────────────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Authentication failed.')
      setLoading(false)
      return
    }

    // ── Step 2: verify role ─────────────────────────────────────────────────
    // Only owner and master should ever reach a successful login.
    // instructor/partner/accountant have no auth.users record and therefore
    // cannot reach this point — this check is a structural safety net.
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    const role = profile?.role

    if (profileError || !role || !ALLOWED_ROLES.includes(role as typeof ALLOWED_ROLES[number])) {
      // Not owner/master — revoke the session immediately so no auth cookie persists.
      await supabase.auth.signOut()
      setError('Acesso não permitido. Este login é exclusivo para gestores de escola.')
      setLoading(false)
      return
    }

    // ── Step 3: navigate ────────────────────────────────────────────────────
    // router.refresh() forces the Next.js cache to re-read cookies so the
    // new session is visible to the middleware and server components on the next request.
    router.push(destination)
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--powder)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo size={22} variant="full" />
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          <div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--slate)',
              letterSpacing: '-0.01em',
              marginBottom: '4px',
            }}>
              Entrar na Base Camp
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
              Acesso exclusivo para gestores de escola
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--slate)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                style={{
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  color: 'var(--slate)',
                  outline: 'none',
                  width: '100%',
                  background: 'var(--surface)',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--glacial)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--slate)' }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  color: 'var(--slate)',
                  outline: 'none',
                  width: '100%',
                  background: 'var(--surface)',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--glacial)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--error-light)',
                border: '1px solid rgba(197,48,48,0.15)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--error)',
                lineHeight: '1.5',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                height: '40px',
                background: loading ? 'var(--mist)' : 'var(--slate)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                width: '100%',
              }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

// Wrapped in Suspense because useSearchParams() requires it in App Router.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
