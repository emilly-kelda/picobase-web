import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function unwrap<T>(raw: T | T[] | null): T | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

export async function GET() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      price,
      currency,
      price_original,
      received_at,
      checkins ( student_name ),
      activities ( name ),
      instructor:users!sessions_instructor_id_fkey ( name )
    `)
    .eq('school_id', SCHOOL_ID)
    .eq('payment_method', 'a_receber')
    .is('received_at', null)
    .order('session_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const receivables = (data ?? []).map(s => {
    const daysSince = Math.floor(
      (Date.now() - new Date(s.session_date).getTime()) / 86400000
    )
    return {
      id:             s.id,
      student_name:   unwrap(s.checkins)?.student_name ?? '—',
      activity_name:  unwrap(s.activities)?.name ?? '—',
      instructor:     unwrap(s.instructor)?.name ?? '—',
      session_date:   s.session_date,
      price:          s.price ?? 0,
      currency:       s.currency ?? 'BRL',
      price_original: s.price_original ?? null,
      days_overdue:   daysSince,
      at_risk:        daysSince > 7,
    }
  })

  const total = receivables.reduce((s, r) => s + r.price, 0)
  const at_risk_total = receivables
    .filter(r => r.at_risk)
    .reduce((s, r) => s + r.price, 0)

  return NextResponse.json({ receivables, total, at_risk_total })
}

export async function PATCH(request: Request) {
  const { session_id } = await request.json()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      received_at:    new Date().toISOString(),
      payment_method: 'pix', // default to PIX when marking received
    })
    .eq('id', session_id)
    .eq('school_id', SCHOOL_ID)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
