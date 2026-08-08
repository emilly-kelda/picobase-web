import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { mpOAuth } from '@/lib/payments/mercadopago'
import { createServiceClient } from '@/lib/supabase-server'
import { encrypt } from '@/utils/crypto'

const STATE_COOKIE = 'pb_mp_oauth_state'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

function redirectToSettings(status: 'mp_connected' | 'mp_error') {
  const response = NextResponse.redirect(`${BASE_URL}/owner/settings?status=${status}`)
  response.cookies.set(STATE_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' })
  return response
}

/** Completes the marketplace OAuth flow started by
 *  /api/auth/mercadopago/connect. Trusts the schoolId paired with the
 *  returned `state` nonce in the httpOnly cookie the connect route set —
 *  never the `state` value alone, and never a schoolId from the query
 *  string (see connect route's own comment for why). */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')

  const cookieStore = await cookies()
  const stateCookie = cookieStore.get(STATE_COOKIE)?.value ?? ''
  const [expectedNonce, schoolId] = stateCookie.split(':')

  if (!code || !returnedState || !expectedNonce || !schoolId || returnedState !== expectedNonce) {
    console.error('Mercado Pago OAuth callback: state inválido ou ausente')
    return redirectToSettings('mp_error')
  }

  const appId = process.env.NEXT_PUBLIC_MP_APP_ID
  const clientSecret = process.env.MP_CLIENT_SECRET
  const redirectUri = process.env.NEXT_PUBLIC_MP_REDIRECT_URI
  if (!appId || !clientSecret || !redirectUri) {
    console.error('Mercado Pago OAuth: variáveis de ambiente ausentes')
    return redirectToSettings('mp_error')
  }

  try {
    const token = await mpOAuth.create({
      body: {
        client_id: appId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
    })

    if (!token.access_token) {
      console.error('Mercado Pago OAuth callback: resposta sem access_token')
      return redirectToSettings('mp_error')
    }

    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('school_payment_integrations')
      .upsert({
        school_id:     schoolId,
        provider:      'mercadopago',
        mp_user_id:    token.user_id != null ? String(token.user_id) : null,
        mp_public_key: token.public_key ?? null,
        access_token:  encrypt(token.access_token),
        refresh_token: token.refresh_token ? encrypt(token.refresh_token) : null,
        expires_at:    expiresAt,
        is_active:     true,
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'school_id' })

    if (error) {
      console.error('Mercado Pago OAuth callback: erro ao salvar integração —', error.message)
      return redirectToSettings('mp_error')
    }

    return redirectToSettings('mp_connected')
  } catch (err) {
    console.error('Mercado Pago OAuth callback: erro na troca de token —', err instanceof Error ? err.message : err)
    return redirectToSettings('mp_error')
  }
}
