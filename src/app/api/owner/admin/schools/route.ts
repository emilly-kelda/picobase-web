// SERVICE ROLE BOUNDARY: this route uses createAdminClient() (service role).
// It must never be refactored to run client-side. All writes bypass RLS intentionally.

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // ── Auth: verify the caller is a master — not just any authenticated user ──
  // This check is independent of the page guard; the API route is directly
  // addressable and must enforce its own boundary.
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await userClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'master') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Validate input ────────────────────────────────────────────────────────
  const body = await request.json()
  const { schoolName, slug, country, currency, timezone, ownerName, ownerEmail } = body

  if (!schoolName?.trim())  return NextResponse.json({ error: 'School name is required' }, { status: 400 })
  if (!slug?.trim())        return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  if (!country?.trim())     return NextResponse.json({ error: 'Country is required' }, { status: 400 })
  if (!currency?.trim())    return NextResponse.json({ error: 'Currency is required' }, { status: 400 })
  if (!ownerName?.trim())   return NextResponse.json({ error: 'Owner name is required' }, { status: 400 })
  if (!ownerEmail?.trim())  return NextResponse.json({ error: 'Owner email is required' }, { status: 400 })

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')

  // SERVICE ROLE BOUNDARY: all mutations use the admin client from here on.
  const admin = createAdminClient()

  // ── Slug uniqueness check (public.schools.slug has a UNIQUE constraint) ───
  const { data: existing } = await admin
    .from('schools')
    .select('id')
    .eq('slug', cleanSlug)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: `Slug "${cleanSlug}" is already taken` }, { status: 409 })
  }

  // ── Step (a): insert the school ───────────────────────────────────────────
  const { data: school, error: schoolError } = await admin
    .from('schools')
    .insert({
      name:     schoolName.trim(),
      slug:     cleanSlug,
      country:  country.trim(),
      currency: currency.trim(),
      timezone: timezone?.trim() || 'America/Sao_Paulo',
    })
    .select('id')
    .single()

  if (schoolError || !school) {
    return NextResponse.json(
      { error: schoolError?.message ?? 'Failed to create school' },
      { status: 500 }
    )
  }

  const schoolId = school.id

  // ── Step (b): invite the owner ────────────────────────────────────────────
  // inviteUserByEmail sends a secure, time-limited invite email.
  // The invitee sets their own password — we never see or handle a password.
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    ownerEmail.trim(),
    { data: { full_name: ownerName.trim(), school_id: schoolId } }
  )

  if (inviteError || !inviteData?.user) {
    // Rollback strategy: delete the school so no ownerless school row persists.
    // Consistent with crew/route.ts pattern (auth user deleted on public.users failure).
    await admin.from('schools').delete().eq('id', schoolId)
    return NextResponse.json(
      { error: inviteError?.message ?? 'Failed to invite owner' },
      { status: 500 }
    )
  }

  const ownerId = inviteData.user.id

  // ── Step (c): insert the owner's public.users row ─────────────────────────
  const { error: userError } = await admin
    .from('users')
    .insert({
      id:        ownerId,
      school_id: schoolId,
      role:      'owner',
      active:    true,
      name:      ownerName.trim(),
      email:     ownerEmail.trim(),
    })

  if (userError) {
    // Full rollback: delete both the school and the auth user (prevents orphaned invite).
    await Promise.all([
      admin.from('schools').delete().eq('id', schoolId),
      admin.auth.admin.deleteUser(ownerId),
    ])
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, schoolId, ownerEmail: ownerEmail.trim() })
}
