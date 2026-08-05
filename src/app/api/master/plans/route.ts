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
  } = body

  if (!id) {
    if (!name?.trim())  return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!slug?.trim())  return NextResponse.json({ error: 'Slug é obrigatório' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const row = {
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
