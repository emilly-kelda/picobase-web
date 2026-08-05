import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function PATCH(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { id, type, price_brl, price_eur, price_usd } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const table = type === 'activity' ? 'activities' : 'packages'

  const updateData: Record<string, number | null> = {}

  if (type === 'activity') {
    // activities table uses price_brl/price_eur/price_usd directly
    if (price_brl !== undefined) updateData.price_brl = price_brl
  } else {
    // packages table's BRL price column is base_price (no plain "price" column)
    if (price_brl !== undefined) updateData.base_price = price_brl
  }
  if (price_eur !== undefined) updateData.price_eur = price_eur
  if (price_usd !== undefined) updateData.price_usd = price_usd

  const { error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', id)
    .eq('school_id', school.ctx.schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
