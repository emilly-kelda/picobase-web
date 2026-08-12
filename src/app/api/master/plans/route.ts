import { requireMaster } from '@/lib/masterAuth'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/** List every plan (active and retired), sorted cheapest-first — the master
 *  plans UI shows both so a retired plan a school is still on remains
 *  visible/editable instead of silently disappearing. */
export async function GET() {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly_cents', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, plans: data ?? [] })
}

/** Create a new plan, or update an existing one when `id` is present in the
 *  body — same single-endpoint upsert shape as /api/master/schools' own
 *  POST/PATCH split, just combined here since a plan's create and edit
 *  forms share the exact same field set. */
export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const {
    id, name, slug, price_monthly_cents, price_yearly_cents,
    max_students, max_storage_gb, features, is_active,
    billing_type, commission_percentage, setup_fee_cents, currency, payment_methods,
  } = body

  if (!id) {
    if (!name?.trim())  return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!slug?.trim())  return NextResponse.json({ error: 'Slug é obrigatório' }, { status: 400 })
  }

  if (billing_type !== undefined && !['commission', 'fixed_recurring'].includes(billing_type)) {
    return NextResponse.json({ error: 'billing_type inválido' }, { status: 400 })
  }
  if (commission_percentage !== undefined) {
    const pct = Number(commission_percentage)
    if (!(pct >= 0 && pct <= 100)) {
      return NextResponse.json({ error: 'commission_percentage deve estar entre 0 e 100' }, { status: 400 })
    }
  }
  if (setup_fee_cents !== undefined && !(Number(setup_fee_cents) >= 0)) {
    return NextResponse.json({ error: 'setup_fee_cents não pode ser negativo' }, { status: 400 })
  }
  const validPaymentMethods = ['pix', 'credit_card', 'boleto']
  if (payment_methods !== undefined) {
    if (!Array.isArray(payment_methods) || payment_methods.some((m: string) => !validPaymentMethods.includes(m))) {
      return NextResponse.json({ error: 'payment_methods inválido' }, { status: 400 })
    }
  }

  const supabase = createServiceClient()

  const row: Record<string, unknown> = {
    name:                name?.trim(),
    slug:                slug?.trim(),
    price_monthly_cents: price_monthly_cents ?? 0,
    price_yearly_cents:  price_yearly_cents ?? 0,
    max_students:        max_students ?? null,
    max_storage_gb:      max_storage_gb ?? null,
    features:            features ?? {},
    is_active:           is_active ?? true,
    updated_at:          new Date().toISOString(),
  }
  if (billing_type !== undefined)           row.billing_type = billing_type
  if (commission_percentage !== undefined)  row.commission_percentage = Number(commission_percentage)
  if (setup_fee_cents !== undefined)        row.setup_fee_cents = Number(setup_fee_cents)
  if (currency !== undefined)               row.currency = currency
  if (payment_methods !== undefined)        row.payment_methods = payment_methods

  if (id) {
    const { data, error } = await supabase
      .from('plans')
      .update(row)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, plan: data })
  }

  const { data, error } = await supabase
    .from('plans')
    .insert(row)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, plan: data })
}

/** Deletes a plan — refuses when any school is currently assigned to it
 *  (schools.plan_id), same "can't delete what's in use" rule the rest of
 *  this admin panel already follows implicitly (e.g. plans stay listed
 *  even when retired via is_active, rather than deleted, for exactly this
 *  reason). Deactivating a plan (is_active: false, via POST) is the way to
 *  retire one that's still assigned to schools. */
export async function DELETE(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

  const supabase = createServiceClient()

  const { count, error: countError } = await supabase
    .from('schools')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', id)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Não é possível excluir um plano em uso por escolas' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
