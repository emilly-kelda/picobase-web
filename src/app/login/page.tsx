'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Logo from '@/components/Logo'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  // Derive the post-login destination from ?next= (internal paths only to prevent open redirect).
  const nextPath = searchParams.get('next')
  const destination = nextPath?.startsWith('/') ? nextPath : '/owner'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Session cookie is now set by @supabase/ssr in the browser.
    // router.push triggers a server-side navigation, so the middleware
    // will read the new cookie and allow access to /owner.
    router.push(destination)
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
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

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo size={22} variant="full" />
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
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
                  background: '#fff',
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
                  background: '#fff',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--glacial)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--signal-light)',
                border: '1px solid rgba(232,71,26,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--signal-dark)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                height: '40px',
                background: loading ? 'var(--mist)' : 'var(--glacial)',
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

// Wrapped in Suspense because useSearchParams() requires it.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
