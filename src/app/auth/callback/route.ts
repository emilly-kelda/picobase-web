// Exchanges the Supabase Auth code (from invite/recovery emails) for a
// session, then redirects into the app. This route did not exist before —
// inviteUserByEmail/resetPasswordForEmail were sending links with nowhere to
// land, so owners could never actually complete account setup or a password
// reset. `next` defaults to /owner/setup (first-time password creation);
// same route is reused for password-recovery links.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')
  const next = nextParam?.startsWith('/') ? nextParam : '/owner/setup'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
