import { createClient } from '@supabase/supabase-js'
import { renderToBuffer } from '@react-pdf/renderer'
import { ReceiptPDF } from '@/lib/receipt-pdf'
import React from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  const { instructorId } = await params
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ||
    new Date().toISOString().slice(0, 7)

  const { data: instructor } = await supabase
    .from('users')
    .select('id, name, school_id, commission_pct')
    .eq('id', instructorId)
    .single()

  if (!instructor) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', instructor.school_id)
    .single()

  const { data: rawSessions } = await supabase
    .from('sessions')
    .select(`
      id,
      price,
      duration_min,
      session_date,
      checkins ( student_name )
    `)
    .eq('instructor_id', instructorId)
    .gte('session_date', `${period}-01`)
    .lte('session_date', `${period}-31`)

  const sessionList = (rawSessions || []).map((s: any) => ({
    student:  s.checkins?.student_name || 'Student',
    activity: 'Session',
    duration: s.duration_min || 0,
    price:    parseFloat(s.price) || 0,
  }))

  const revenue    = sessionList.reduce((sum, s) => sum + s.price, 0)
  const commission = revenue * (instructor.commission_pct || 0)

  const pdf = await renderToBuffer(
    React.createElement(ReceiptPDF, {
      instructor:    instructor.name,
      school:        school?.name || '',
      season:        '2025-2026',
      period,
      sessions:      sessionList,
      revenue,
      commissionPct: instructor.commission_pct || 0,
      commission,
      bonus:         0,
      total:         commission,
      generatedAt:   new Date().toLocaleDateString('pt-BR'),
    }) as any
  )

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="receipt_${instructor.name.replace(/ /g,'_')}_${period}.pdf"`,
    },
  })
}
