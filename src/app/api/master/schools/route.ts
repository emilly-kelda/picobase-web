// SERVICE ROLE BOUNDARY: this route uses createAdminClient() (service role).
// It must never be refactored to run client-side. All writes bypass RLS intentionally.

import { createAdminClient } from '@/utils/supabase/admin'
import { CONTRACT_STATUSES, PAYMENT_METHODS, PAYMENT_TERMS } from '@/lib/schoolContract'
import { requireMaster } from '@/lib/masterAuth'
import { NextResponse } from 'next/server'

const STATUS_VALUES         = CONTRACT_STATUSES.map(s => s.value) as string[]
const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map(m => m.value) as string[]
const PAYMENT_TERMS_VALUES  = PAYMENT_TERMS.map(t => t.value) as string[]

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
  // redirectTo must be explicit: without it, Supabase falls back to the
  // project's dashboard-configured Site URL, which defaults to localhost and
  // left every invite link dead in production. Also requires
  // https://picobase.com.br/** to be added under Authentication → URL
  // Configuration → Redirect URLs in the Supabase dashboard — this code
  // change alone isn't sufficient if that allowlist doesn't already cover it.
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    ownerEmail.trim(),
    {
      data: { full_name: ownerName.trim(), school_id: schoolId },
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://picobase.com.br'}/auth/callback?next=/owner/setup`,
    }
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

// Partial update of contract/billing fields — status_assinatura,
// payment_method, payment_terms, subscription_value, cost_center. Only keys
// actually present in the body are written; this lets the dashboard's quick
// suspend/reactivate action send just { id, status_assinatura } without
// clobbering the other contract fields, while SchoolContractModal's full-form
// save (which always sends all five) behaves exactly as before. Everything
// else about a school (name, slug, country, currency, timezone) is set at
// creation and isn't editable from this endpoint.
export async function PATCH(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { id, status_assinatura } = body

  if (!id) return NextResponse.json({ error: 'Missing school id' }, { status: 400 })
  if (status_assinatura != null && !STATUS_VALUES.includes(status_assinatura)) {
    return NextResponse.json({ error: 'Invalid status_assinatura' }, { status: 400 })
  }
  if ('payment_method' in body && body.payment_method != null && !PAYMENT_METHOD_VALUES.includes(body.payment_method)) {
    return NextResponse.json({ error: 'Invalid payment_method' }, { status: 400 })
  }
  if ('payment_terms' in body && body.payment_terms != null && !PAYMENT_TERMS_VALUES.includes(body.payment_terms)) {
    return NextResponse.json({ error: 'Invalid payment_terms' }, { status: 400 })
  }
  if ('subscription_value' in body && body.subscription_value != null && !(Number(body.subscription_value) >= 0)) {
    return NextResponse.json({ error: 'Invalid subscription_value' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (status_assinatura != null) updates.status_assinatura = status_assinatura
  if ('payment_method' in body) updates.payment_method = body.payment_method || null
  if ('payment_terms' in body) updates.payment_terms = body.payment_terms || null
  if ('subscription_value' in body) updates.subscription_value = body.subscription_value != null ? Number(body.subscription_value) : null
  if ('cost_center' in body) updates.cost_center = body.cost_center?.trim() || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('schools').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
