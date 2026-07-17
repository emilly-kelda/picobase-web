import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/** Shared guard for every /api/master/* route — independent of the page
 *  guard (middleware, master/layout.tsx), since API routes are directly
 *  addressable and must enforce their own boundary regardless of what UI
 *  called them. Returns the caller's user id on success, for created_by-style
 *  columns (school_notices, school_financial_documents). */
export async function requireMaster(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await userClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'master') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true, userId: user.id }
}
