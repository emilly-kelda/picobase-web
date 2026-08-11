'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Toast, useToast } from '@/components/Toast'

type Integration = {
  mp_user_id: string | null
  mp_public_key: string | null
  created_at: string
  updated_at: string
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  fontFamily: 'var(--font-sans)',
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 'var(--radius-md)',
  background: '#009EE3', color: '#fff', border: 'none',
  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  fontFamily: 'var(--font-sans)', textDecoration: 'none',
  display: 'inline-block',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 'var(--radius-md)',
  background: '#fff', color: 'var(--slate)', border: '0.5px solid var(--border-strong)',
  fontSize: '13px', fontWeight: '500', cursor: 'pointer',
  fontFamily: 'var(--font-sans)', textDecoration: 'none',
  display: 'inline-block',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** "Pagamentos" card on /owner/settings — connect status + OAuth trigger
 *  for the school's own Mercado Pago account (marketplace model, see
 *  src/app/api/auth/mercadopago/connect and .../callback/mercadopago).
 *  Separate from FinancialSettingsModal — that one is reserve/seasonality
 *  targets, this is the actual payment-collection integration. */
export default function PaymentIntegrationCard({
  initialStatus,
}: {
  initialStatus: 'mp_connected' | 'mp_error' | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast, showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadStatus() {
      const res = await fetch('/api/owner/payment-integrations')
      const data = await res.json().catch(() => ({}))
      if (!cancelled) setIntegration(data.connected ? data.integration : null)
    }
    loadStatus()
      .catch(() => { if (!cancelled) setIntegration(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Fires once for the redirect back from the OAuth callback — then strips
  // ?status=... from the URL so a page refresh doesn't re-show the toast.
  useEffect(() => {
    if (!initialStatus) return
    showToast(
      initialStatus === 'mp_connected' ? 'ok' : 'err',
      initialStatus === 'mp_connected'
        ? 'Mercado Pago conectado com sucesso!'
        : 'Falha ao conectar Mercado Pago. Tente novamente.'
    )
    router.replace(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus])

  async function disconnect() {
    if (!window.confirm('Desconectar a conta do Mercado Pago desta escola? Pagamentos diretos param de funcionar até reconectar.')) return
    setDisconnecting(true)
    try {
      const res = await fetch('/api/owner/payment-integrations', { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        showToast('err', data.error ?? 'Erro ao desconectar.')
        return
      }
      setIntegration(null)
      showToast('ok', 'Mercado Pago desconectado.')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div style={cardStyle}>
      <div style={{
        fontSize: '11px', fontWeight: '500',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--mist)', marginBottom: '14px',
      }}>
        Pagamentos
      </div>

      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--mist)' }}>Carregando...</div>
      ) : integration ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '99px',
              background: '#E0F8F5', color: '#007868',
              fontSize: '11px', fontWeight: '600',
            }}>
              Conectado
            </span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)' }}>
              Mercado Pago
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '16px' }}>
            {integration.mp_user_id && <>Conta MP #{integration.mp_user_id} · </>}
            conectado em {fmtDate(integration.created_at)}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/api/auth/mercadopago/connect" style={secondaryButtonStyle}>
              Reconectar
            </a>
            <button onClick={disconnect} disabled={disconnecting} style={{ ...secondaryButtonStyle, color: '#DC2626', opacity: disconnecting ? 0.5 : 1, cursor: disconnecting ? 'not-allowed' : 'pointer' }}>
              {disconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)', marginBottom: '4px' }}>
            Mercado Pago
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '16px', maxWidth: '460px' }}>
            Receba pagamentos diretamente na sua conta do Mercado Pago — conecte sua conta para cobrar alunos com Pix e cartão.
          </div>
          <a href="/api/auth/mercadopago/connect" style={primaryButtonStyle}>
            Conectar Mercado Pago
          </a>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
