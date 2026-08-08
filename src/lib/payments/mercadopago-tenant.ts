import { MercadoPagoConfig } from 'mercadopago'
import { mpOAuth } from '@/lib/payments/mercadopago'
import { createServiceClient } from '@/lib/supabase-server'
import { encrypt, decrypt } from '@/utils/crypto'

const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000

/** Returns a MercadoPagoConfig scoped to a specific school's own connected
 *  MP account (marketplace OAuth — see
 *  supabase/migrations/20260817000005_school_payment_integrations.sql and
 *  the connect/callback routes), refreshing the access token first if it's
 *  within 24h of expiring. Returns null when the school has no active
 *  integration — callers decide how to handle that (e.g. fall back to the
 *  platform account, or reject the request), this helper doesn't assume. */
export async function getTenantMercadoPagoClient(schoolId: string): Promise<MercadoPagoConfig | null> {
  const supabase = createServiceClient()
  const { data: integration } = await supabase
    .from('school_payment_integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .maybeSingle()

  if (!integration?.access_token) return null

  let accessToken = decrypt(integration.access_token)

  const expiresAt = integration.expires_at ? new Date(integration.expires_at).getTime() : null
  const needsRefresh = expiresAt !== null && expiresAt - Date.now() < REFRESH_WINDOW_MS

  if (needsRefresh && integration.refresh_token) {
    try {
      const refreshed = await mpOAuth.refresh({
        body: {
          client_id: process.env.NEXT_PUBLIC_MP_APP_ID,
          client_secret: process.env.MP_CLIENT_SECRET,
          refresh_token: decrypt(integration.refresh_token),
        },
      })

      if (refreshed.access_token) {
        accessToken = refreshed.access_token
        await supabase
          .from('school_payment_integrations')
          .update({
            access_token:  encrypt(refreshed.access_token),
            refresh_token: refreshed.refresh_token ? encrypt(refreshed.refresh_token) : integration.refresh_token,
            expires_at:    refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString() : null,
            updated_at:    new Date().toISOString(),
          })
          .eq('school_id', schoolId)
      }
    } catch (err) {
      // Falls through and uses the still-stored (not yet actually expired)
      // access token rather than failing the whole request — a genuinely
      // expired token just fails on first real use, surfacing Mercado
      // Pago's own error instead of one manufactured here.
      console.error('Mercado Pago tenant token refresh failed —', err instanceof Error ? err.message : err)
    }
  }

  return new MercadoPagoConfig({ accessToken })
}
