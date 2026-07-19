import { createServiceClient } from '@/lib/supabase-server'
import { renderToBuffer } from '@react-pdf/renderer'
import { ReceiptPDF } from '@/lib/receipt-pdf'
import { NextResponse } from 'next/server'
import React from 'react'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function nextMonthFirstDay(period: string) {
  const [y, m] = period.split('-').map(Number)
  return new Date(y, m, 1).toISOString().slice(0, 10)
}

/** Receipt PDF for a specific closed payments row — the "Recibo" button
 *  in PaymentsClient.tsx. Deliberately separate from the older
 *  /api/receipt/[instructorId] route (still used by close-month/page.tsx,
 *  left untouched): that one recomputes commission from raw session price
 *  × commission_pct, ignoring fixed_per_hour instructors, variable-cost
 *  deductions, the school-wide fixed payout model, and bonus/advances
 *  entirely — it can't be trusted to match what's actually paid. This
 *  route instead reads the already-closed payments row directly (the
 *  same source PaymentsClient's table renders from), so the PDF always
 *  agrees with the real total_to_pay/netPayout, advances included. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params
  const supabase = createServiceClient()

  const { data: payment, error } = await supabase
    .from('payments')
    .select(`
      id, period, sessions_count, revenue_generated,
      commission_pct, commission_amount, bonus, total_to_pay, instructor_id,
      users!payments_instructor_id_fkey ( id, name, whatsapp )
    `)
    .eq('id', paymentId)
    .eq('school_id', SCHOOL_ID)
    .single()

  if (error || !payment) {
    return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
  }

  const user = Array.isArray(payment.users) ? payment.users[0] : payment.users

  const [{ data: sessions }, { data: advances }, { data: school }] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id, session_date, duration_min, price,
        checkins ( student_name ),
        activities ( name )
      `)
      .eq('school_id', SCHOOL_ID)
      .eq('instructor_id', payment.instructor_id)
      .gte('session_date', `${payment.period}-01`)
      .lt('session_date', nextMonthFirstDay(payment.period))
      .order('session_date', { ascending: false }),
    supabase
      .from('instructor_advances')
      .select('amount')
      .eq('school_id', SCHOOL_ID)
      .eq('instructor_id', payment.instructor_id)
      .eq('period', payment.period),
    supabase.from('schools').select('name').eq('id', SCHOOL_ID).single(),
  ])

  const sessionList = (sessions ?? []).map(s => ({
    student:  (s.checkins as any)?.student_name ?? '—',
    activity: (s.activities as any)?.name ?? '—',
    duration: s.duration_min ?? 0,
    price:    s.price ?? 0,
  }))

  const totalAdvances = (advances ?? []).reduce((sum, a) => sum + (a.amount ?? 0), 0)

  const pdf = await renderToBuffer(
    React.createElement(ReceiptPDF, {
      instructor:    user?.name ?? '—',
      school:        school?.name ?? '',
      season:        payment.period,
      period:        payment.period,
      sessions:      sessionList,
      revenue:       payment.revenue_generated ?? 0,
      commissionPct: payment.commission_pct ?? 0,
      commission:    payment.commission_amount ?? 0,
      bonus:         payment.bonus ?? 0,
      total:         payment.total_to_pay ?? 0,
      totalAdvances,
      generatedAt:   new Date().toLocaleDateString('pt-BR'),
    }) as any
  )

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="recibo_${(user?.name ?? 'instrutor').replace(/ /g, '_')}_${payment.period}.pdf"`,
    },
  })
}
