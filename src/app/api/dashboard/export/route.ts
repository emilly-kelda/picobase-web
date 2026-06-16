import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ||
    new Date().toISOString().slice(0, 7)
  const format = searchParams.get('format') || 'wise'

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id, total_to_pay,
      users!payments_instructor_id_fkey ( id, name, email, pix_key, wise_email )
    `)
    .eq('school_id', SCHOOL_ID)
    .eq('period', period)
    .eq('status', 'approved')

  if (!payments || payments.length === 0) {
    return NextResponse.json(
      { error: 'No approved payments for this period' },
      { status: 404 }
    )
  }

  if (format === 'wise') {
    const rows = ['name,email,amount,currency,reference']
    for (const p of payments) {
      const user = p.users as any
      rows.push(
        `${user?.name || ''},${user?.wise_email || user?.email || ''},${p.total_to_pay},BRL,Pico Base ${period}`
      )
    }
    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': `attachment; filename="wise_payout_${period}.csv"`,
      },
    })
  }

  if (format === 'btg') {
    const rows = ['nome,pix,valor,descricao']
    for (const p of payments) {
      const user = p.users as any
      rows.push(
        `${user?.name || ''},${user?.pix_key || ''},${p.total_to_pay},Pico Base ${period}`
      )
    }
    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': `attachment; filename="btg_pix_${period}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Unknown format' }, { status: 400 })
}
