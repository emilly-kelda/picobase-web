'use client'

// First-time password setup after an invite link (or a password-reset
// link — same form serves both) lands here via /auth/callback. By the time
// this renders, exchangeCodeForSession already gave the browser a valid
// session, so supabase.auth.updateUser() below just needs the new password.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Logo from '@/components/Logo'

const inputStyle: React.CSSProperties = {
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
  boxSizing: 'border-box',
}

export default function OwnerSetupPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/owner')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

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
            <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', letterSpacing: '-0.01em', marginBottom: '4px' }}>
              Defina sua senha
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
              Última etapa para acessar o Spot
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--slate)' }}>Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--slate)' }}>Confirmar senha</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                style={inputStyle}
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
              {loading ? 'Salvando…' : 'Salvar e entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
