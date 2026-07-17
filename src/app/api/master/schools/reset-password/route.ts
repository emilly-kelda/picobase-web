// Triggers a real Supabase Auth recovery email for a school's owner. Note:
// this only sends the email — there's no "set new password" page anywhere in
// this app yet (checked), so where the recovery link lands depends entirely
// on the Supabase project's configured Site URL / redirect settings, same as
// inviteUserByEmail elsewhere in this app. Building an in-app password-reset
// confirmation page wasn't part of this task; flagging it as a follow-up if
// owners need to complete the reset inside the app itself.

import { createAdminClient } from '@/utils/supabase/admin'
import { requireMaster } from '@/lib/masterAuth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const { email } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  // No redirectTo — same as inviteUserByEmail elsewhere in this app
  // (api/master/schools/route.ts), relies on the Supabase project's
  // configured Site URL rather than a hardcoded one here.
  const admin = createAdminClient()
  const { error } = await admin.auth.resetPasswordForEmail(email.trim())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
