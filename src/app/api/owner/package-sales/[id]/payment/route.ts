import { createServiceClient } from '@/lib/supabase-server'
import { getSchoolContext } from '@/lib/auth/get-school-context'
import { NextResponse } from 'next/server'

const VALID_METHODS = ['pix', 'dinheiro', 'cartao']

/** Registers a payment against a package sold on credit (or partially
 *  paid) — adds `amount` to the sale's existing amount_paid, capped at
 *  price_paid, so an owner can settle in installments (partial now, rest
 *  later) rather than only ever marking the whole thing paid at once.
 *  Never 'a_receber' here — that value only makes sense at sale time
 *  (see sell-package/route.ts); settling always means money actually
 *  changed hands. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { id } = await params

  const { amount, payment_method } = await request.json().catch(() => ({}))

  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amount deve ser maior que zero' }, { status: 400 })
  }
  if (!VALID_METHODS.includes(payment_method)) {
    return NextResponse.json({ error: 'payment_method inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: sale, error: fetchError } = await supabase
    .from('package_sales')
    .select('id, price_paid, amount_paid')
    .eq('id', id)
    .eq('school_id', school.ctx.schoolId)
    .single()

  if (fetchError || !sale) {
    return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
  }

  const newAmountPaid = Math.min(sale.price_paid ?? 0, (sale.amount_paid ?? 0) + amount)

  const { error: updateError } = await supabase
    .from('package_sales')
    .update({ amount_paid: newAmountPaid, payment_method })
    .eq('id', id)
    .eq('school_id', school.ctx.schoolId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, amount_paid: newAmountPaid })
}
