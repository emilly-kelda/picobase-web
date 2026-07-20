import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const { instructor_id, amount, period, note } = await request.json()

  if (!instructor_id || !period || !(amount > 0)) {
    return NextResponse.json({ error: 'instructor_id, period e amount (> 0) são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('instructor_advances')
    .insert({
      school_id: SCHOOL_ID,
      instructor_id,
      amount,
      period,
      note: note ?? null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Advances are real cash out the door, so they should also land in Custos
  // — same money, different screen. recurrence is 'unico' (one-time), not
  // 'mensal', on purpose: getMonthlyCostTotal() only excludes 'unico' from
  // the recurring burn-rate sum, so tagging this 'mensal' would make a
  // single advance permanently inflate every future month's burn
  // calculation instead of counting once, in the month it was actually
  // given. Best-effort — the advance record above (the source of truth for
  // the payroll deduction) already succeeded, so a failure here shouldn't
  // fail the whole request.
  try {
    const { data: instructor } = await supabase
      .from('users')
      .select('name')
      .eq('id', instructor_id)
      .single()

    await supabase.from('operational_costs').insert({
      school_id:   SCHOOL_ID,
      description: `Adiantamento - ${instructor?.name ?? 'Instrutor'}`,
      amount,
      cost_type:   'variavel',
      recurrence:  'unico',
      due_date:    new Date().toISOString().slice(0, 10),
      category:    'Adiantamentos',
    })
  } catch {}

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instructorId = searchParams.get('instructor_id')
  const period = searchParams.get('period')

  if (!instructorId || !period) {
    return NextResponse.json({ error: 'instructor_id e period são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('instructor_advances')
    .select('id, amount, note, created_at')
    .eq('school_id', SCHOOL_ID)
    .eq('instructor_id', instructorId)
    .eq('period', period)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = (data ?? []).reduce((s, a) => s + (a.amount ?? 0), 0)
  return NextResponse.json({ advances: data ?? [], total })
}
