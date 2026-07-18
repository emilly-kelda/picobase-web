// Triggers a real Supabase Auth recovery email for a school's owner.
// redirectTo points at /auth/callback → /owner/setup, the same
// exchange-code-for-session + set-password flow used for new-owner invites
// (api/master/schools/route.ts) — one form handles both first-time setup and
// password recovery. Also requires https://picobase.com.br/** to be listed
// under Authentication → URL Configuration → Redirect URLs in the Supabase
// dashboard.

import { createAdminClient } from '@/utils/supabase/admin'
import { requireMaster } from '@/lib/masterAuth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const { email } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://picobase.com.br'}/auth/callback?next=/owner/setup`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
