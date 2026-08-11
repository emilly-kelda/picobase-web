import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'
import { createServiceClient } from '@/lib/supabase-server'

/** Connection status for the calling school's Mercado Pago marketplace
 *  integration (see supabase/migrations/20260817000005_school_payment_integrations.sql) —
 *  never returns access_token/refresh_token, this is a status/display
 *  endpoint only. */
export async function GET() {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('school_payment_integrations')
    .select('mp_user_id, mp_public_key, created_at, updated_at')
    .eq('school_id', school.ctx.schoolId)
    .eq('is_active', true)
    .maybeSingle()

  return NextResponse.json({ connected: !!data, integration: data ?? null })
}

/** Disconnects the calling school's Mercado Pago account. Soft-disconnect
 *  (is_active: false) rather than deleting the row — keeps the encrypted
 *  tokens' history for audit purposes; "Reconectar" always goes through a
 *  fresh OAuth authorization anyway (see connect route), so nothing reuses
 *  the deactivated tokens. */
export async function DELETE() {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('school_payment_integrations')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('school_id', school.ctx.schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
