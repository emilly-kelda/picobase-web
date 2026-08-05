import { requireMaster } from '@/lib/masterAuth'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const COOKIE_NAME = 'pb_impersonate_school_id'
const EIGHT_HOURS = 60 * 60 * 8

/** Starts master "viewing as" a specific school's /owner panel — sets the
 *  httpOnly cookie getAuthContext() (src/lib/auth.ts) reads on every
 *  subsequent request, and logs the start for later audit review
 *  (impersonation_log — see 20260817000000_impersonation_log.sql). Capped
 *  at 8h so a forgotten "Sair" doesn't leave the session impersonating
 *  indefinitely. */
export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const { school_id } = await request.json().catch(() => ({}))
  if (!school_id) {
    return NextResponse.json({ error: 'school_id é obrigatório' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('id', school_id)
    .single()
  if (!school) {
    return NextResponse.json({ error: 'Escola não encontrada' }, { status: 404 })
  }

  await supabase.from('impersonation_log').insert({
    master_user_id: auth.userId,
    school_id,
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, school_id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: EIGHT_HOURS,
    path: '/',
  })
  return response
}

/** Ends impersonation — clears the cookie. Still requires a real master
 *  session (not just "currently impersonating"), same as POST above. */
export async function DELETE() {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
