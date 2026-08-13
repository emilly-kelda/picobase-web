import { createServiceClient } from '@/lib/supabase-server'
import { ensureActiveCheckinForToday } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function POST(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const { package_id, student_name, payment_method, amount_paid } = await request.json()

  if (!package_id || !student_name?.trim()) {
    return NextResponse.json({ error: 'package_id e student_name são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('id, total_minutes, base_price, final_price, sport')
    .eq('id', package_id)
    .eq('school_id', school.ctx.schoolId)
    .single()

  if (pkgError || !pkg) {
    return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
  }

  // Find or create student record so they appear on the Students page
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', school.ctx.schoolId)
    .ilike('name', student_name.trim())
    .limit(1)
    .maybeSingle()

  if (!existingStudent) {
    await supabase
      .from('students')
      .insert({ school_id: school.ctx.schoolId, name: student_name.trim() })
  }

  const finalPrice = pkg.final_price ?? pkg.base_price ?? 0

  // 'a_receber' means the school is extending credit — nothing collected
  // at sale time, settled later via PATCH /api/owner/package-sales/[id]/payment.
  // Otherwise amount_paid defaults to the full price (today's exact
  // behavior for callers that don't send it, e.g. SellPackageFlowModal),
  // but a caller can also pass a smaller amount to record a partial
  // payment upfront.
  const resolvedAmountPaid = payment_method === 'a_receber'
    ? 0
    : (typeof amount_paid === 'number' && amount_paid >= 0 && amount_paid <= finalPrice)
      ? amount_paid
      : finalPrice

  const { data: sale, error: saleError } = await supabase
    .from('package_sales')
    .insert({
      school_id:         school.ctx.schoolId,
      package_id:        pkg.id,
      student_name:      student_name.trim(),
      minutes_purchased: pkg.total_minutes ?? 60,
      minutes_used:      0,
      price_paid:        finalPrice,
      amount_paid:       resolvedAmountPaid,
      payment_method:    payment_method ?? null,
    })
    .select('id')
    .single()

  if (saleError || !sale) {
    return NextResponse.json({ error: saleError?.message ?? 'Falha ao registrar venda' }, { status: 500 })
  }

  // Credit balance is derived live from package_sales (getPackageBalancesForCheckins
  // sums minutes_purchased - minutes_used), so it's already "updated" the instant
  // the row above lands — nothing else to write for that part. What doesn't
  // happen automatically: a student who was sold a package from Spot's
  // "Venda Rápida" (no checkin required to open that flow) has no checkins row
  // for today at all, so they never appear in Aguardando Vento afterward — that's
  // the actual bug. Best-effort: never let this block the sale response, since
  // package_sales is the real source of truth for the transaction.
  // checkin_id returned so a caller that goes on to actually schedule a
  // lesson right after this sale (UnifiedSaleBookingModal's Step 3) can mark
  // this same checkin deferred_to_schedule instead of leaving it visible in
  // Aguardando Vento alongside the now-scheduled lesson.
  let checkinId: string | null = null
  try {
    checkinId = await ensureActiveCheckinForToday(school.ctx.schoolId, student_name.trim(), { sport: pkg.sport })
  } catch (err) {
    // Still never blocks the sale response (package_sales already
    // committed above is the real source of truth for the transaction) —
    // but a swallowed error here previously meant a student could vanish
    // from Aguardando Vento with zero trace anywhere. Logging so that
    // failure is at least visible in server logs instead of silent.
    console.error('ensureActiveCheckinForToday failed for', student_name, err)
  }

  return NextResponse.json({ ok: true, package_sale_id: sale.id, checkin_id: checkinId })
}
