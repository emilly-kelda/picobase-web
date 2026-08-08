import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSchoolContext } from '@/lib/auth/get-school-context'
import { mpOAuth } from '@/lib/payments/mercadopago'

const STATE_COOKIE = 'pb_mp_oauth_state'

/** Starts the marketplace OAuth flow — redirects the school's owner to
 *  Mercado Pago to authorize connecting their own account.
 *
 *  schoolId is resolved from the real session (getSchoolContext), never
 *  taken from a query param, and never placed directly in the OAuth
 *  `state` value either: `state` is a random nonce, stored server-side in
 *  an httpOnly cookie alongside the schoolId it was issued for. The
 *  callback route only trusts whichever schoolId is paired with the nonce
 *  it receives back — a `state` value alone is guessable/replayable if it
 *  were the schoolId itself, which would let a forged callback link one
 *  MP account to an arbitrary school. */
export async function GET() {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const appId = process.env.NEXT_PUBLIC_MP_APP_ID
  const redirectUri = process.env.NEXT_PUBLIC_MP_REDIRECT_URI
  if (!appId || !redirectUri) {
    return NextResponse.json({ error: 'Integração com Mercado Pago não configurada' }, { status: 500 })
  }

  const nonce = randomBytes(16).toString('hex')
  const authorizationUrl = mpOAuth.getAuthorizationURL({
    options: { client_id: appId, state: nonce, redirect_uri: redirectUri },
  })

  const response = NextResponse.redirect(authorizationUrl)
  response.cookies.set(STATE_COOKIE, `${nonce}:${school.ctx.schoolId}`, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes — long enough to complete the MP authorization screen
    path: '/',
  })
  return response
}
