// SERVICE ROLE BOUNDARY: this route uses createAdminClient() (service role).
// It must never be refactored to run client-side. All writes bypass RLS intentionally.

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { CONTRACT_STATUSES, PAYMENT_METHODS, PAYMENT_TERMS } from '@/lib/schoolContract'
import { NextResponse } from 'next/server'

const STATUS_VALUES         = CONTRACT_STATUSES.map(s => s.value) as string[]
const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map(m => m.value) as string[]
const PAYMENT_TERMS_VALUES  = PAYMENT_TERMS.map(t => t.value) as string[]

// Auth check is independent of the page guard — this route is directly
// addressable and must enforce its own boundary regardless of what UI called it.
async function requireMaster(): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
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
  return { ok: true }
}

export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  // ── Validate input ────────────────────────────────────────────────────────
  const body = await request.json()
  const {
    schoolName, slug, country, currency, timezone, ownerName, ownerEmail,
    ownerWhatsapp, paymentMethod, paymentTerms, subscriptionValue, costCenter,
  } = body

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
  // status_assinatura always starts at 'trial' regardless of whatever payment
  // info was entered — becoming 'active' is a deliberate status change once
  // the contract is actually signed, not implied by filling out the form.
  const { data: school, error: schoolError } = await admin
    .from('schools')
    .insert({
      name:                schoolName.trim(),
      slug:                cleanSlug,
      country:             country.trim(),
      currency:            currency.trim(),
      timezone:            timezone?.trim() || 'America/Sao_Paulo',
      status_assinatura:   'trial',
      payment_method:      paymentMethod || null,
      payment_terms:       paymentTerms || null,
      subscription_value:  subscriptionValue ?? null,
      cost_center:         costCenter?.trim() || null,
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
      whatsapp:  ownerWhatsapp?.trim() || null,
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

// Updates contract/billing fields only — status_assinatura, payment_method,
// payment_terms, subscription_value, cost_center. Everything else about a
// school (name, slug, country, currency, timezone) is set at creation and
// isn't editable from this endpoint.
export async function PATCH(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { id, status_assinatura, payment_method, payment_terms, subscription_value, cost_center } = body

  if (!id) return NextResponse.json({ error: 'Missing school id' }, { status: 400 })
  if (!STATUS_VALUES.includes(status_assinatura)) {
    return NextResponse.json({ error: 'Invalid status_assinatura' }, { status: 400 })
  }
  if (payment_method != null && !PAYMENT_METHOD_VALUES.includes(payment_method)) {
    return NextResponse.json({ error: 'Invalid payment_method' }, { status: 400 })
  }
  if (payment_terms != null && !PAYMENT_TERMS_VALUES.includes(payment_terms)) {
    return NextResponse.json({ error: 'Invalid payment_terms' }, { status: 400 })
  }
  if (subscription_value != null && !(Number(subscription_value) >= 0)) {
    return NextResponse.json({ error: 'Invalid subscription_value' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('schools')
    .update({
      status_assinatura,
      payment_method:      payment_method || null,
      payment_terms:       payment_terms || null,
      subscription_value:  subscription_value != null ? Number(subscription_value) : null,
      cost_center:         cost_center?.trim() || null,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
