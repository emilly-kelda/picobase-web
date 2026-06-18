import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') // YYYY-MM

  const supabase = createServiceClient()

  let query = supabase
    .from('sessions')
    .select('payment_method, price')
    .eq('school_id', SCHOOL_ID)

  if (period) {
    const [y, m] = period.split('-').map(Number)
    const start = `${period}-01`
    const nextFirst = new Date(y, m, 1).toISOString().slice(0, 10)
    query = query.gte('session_date', start).lt('session_date', nextFirst)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const summary: Record<string, { count: number; revenue: number }> = {}
  for (const row of data ?? []) {
    const key = row.payment_method ?? 'unknown'
    if (!summary[key]) summary[key] = { count: 0, revenue: 0 }
    summary[key].count += 1
    summary[key].revenue += row.price ?? 0
  }

  return NextResponse.json(summary)
}
