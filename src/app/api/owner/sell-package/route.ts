import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const { package_id, student_name } = await request.json()

  if (!package_id || !student_name?.trim()) {
    return NextResponse.json({ error: 'package_id e student_name são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('id, total_minutes, base_price, final_price')
    .eq('id', package_id)
    .eq('school_id', SCHOOL_ID)
    .single()

  if (pkgError || !pkg) {
    return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
  }

  // Find or create student record so they appear on the Students page
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', SCHOOL_ID)
    .ilike('name', student_name.trim())
    .limit(1)
    .maybeSingle()

  if (!existingStudent) {
    await supabase
      .from('students')
      .insert({ school_id: SCHOOL_ID, name: student_name.trim() })
  }

  const { error: saleError } = await supabase
    .from('package_sales')
    .insert({
      school_id:         SCHOOL_ID,
      package_id:        pkg.id,
      student_name:      student_name.trim(),
      minutes_purchased: pkg.total_minutes ?? 60,
      minutes_used:      0,
      price_paid:        pkg.final_price ?? pkg.base_price ?? 0,
    })

  if (saleError) {
    return NextResponse.json({ error: saleError.message }, { status: 500 })
  }

  // Credit balance is derived live from package_sales (getPackageBalancesForCheckins
  // sums minutes_purchased - minutes_used), so it's already "updated" the instant
  // the row above lands — nothing else to write for that part. What doesn't
  // happen automatically: a student who was sold a package from Base Camp's
  // "Venda Rápida" (no checkin required to open that flow) has no checkins row
  // for today at all, so they never appear in Sala de Espera afterward — that's
  // the actual bug. Best-effort: never let this block the sale response, since
  // package_sales is the real source of truth for the transaction.
  try {
    await ensureActiveCheckinForToday(supabase, student_name.trim())
  } catch {}

  return NextResponse.json({ ok: true })
}

/** Makes sure `student_name` shows up in today's Sala de Espera
 *  (getPendingLessons: status='checked_in', deferred_to_schedule=false,
 *  checkin_at >= today) right after a package sale.
 *
 *  checkins has a DB check constraint ("lgpd_required", verified live) that
 *  rejects any row with lgpd_consent != true — so a brand new row can't be
 *  fabricated out of thin air for a walk-up sale with no waiver on file.
 *  Two cases:
 *   - A checkins row for today already exists (e.g. sold from the Sala de
 *     Espera card itself) → just reactivate it if something had moved it
 *     out of the pending view. Untouched if it's already showing, or if the
 *     student's lesson today was already confirmed (status 'session_confirmed'
 *     stays as-is — they don't belong back in the waiting queue).
 *   - No row for today → copy the identity/consent fields from that
 *     student's most recent already-consented checkin (any date) into a
 *     fresh row for today, same as a returning customer not having to
 *     re-sign a waiver they already have on file. If they have no prior
 *     consented checkin at all, there's nothing legitimate to copy — skip
 *     silently and leave them to check in for real (QR/waiver flow).
 */
async function ensureActiveCheckinForToday(
  supabase: ReturnType<typeof createServiceClient>,
  studentName: string
) {
  const today = new Date().toISOString().slice(0, 10)

  const { data: todayCheckin } = await supabase
    .from('checkins')
    .select('id, status, deferred_to_schedule')
    .eq('school_id', SCHOOL_ID)
    .ilike('student_name', studentName)
    .gte('checkin_at', `${today}T00:00:00`)
    .order('checkin_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (todayCheckin) {
    if (todayCheckin.status === 'checked_in' && !todayCheckin.deferred_to_schedule) return
    if (todayCheckin.status === 'session_confirmed' || todayCheckin.status === 'cancelled') return
    await supabase
      .from('checkins')
      .update({ status: 'checked_in', deferred_to_schedule: false })
      .eq('id', todayCheckin.id)
    return
  }

  const { data: priorCheckin } = await supabase
    .from('checkins')
    .select(`
      student_email, student_whatsapp, student_nationality,
      document_number, document_type, health_condition,
      emergency_name, emergency_phone, birthdate, is_minor,
      guardian_name, guardian_consent, lgpd_consent, gdpr_consent,
      waiver_signed_at, waiver_pdf_url, zapsign_doc_id, signature_data, source
    `)
    .eq('school_id', SCHOOL_ID)
    .ilike('student_name', studentName)
    .eq('lgpd_consent', true)
    .order('checkin_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!priorCheckin) return

  await supabase.from('checkins').insert({
    school_id:    SCHOOL_ID,
    student_name: studentName,
    ...priorCheckin,
    status:       'checked_in',
    checkin_at:   new Date().toISOString(),
    deferred_to_schedule: false,
  })
}
