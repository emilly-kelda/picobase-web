import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Get partner
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('id, name, type, commission_pct, finance_email, school_id')
    .eq('id', id)
    .single()

  if (partnerError || !partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  // Get school
  const { data: school } = await supabase
    .from('schools')
    .select('name, currency')
    .eq('id', partner.school_id)
    .single()

  // Get referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      id,
      period,
      commission_amount,
      status,
      package_sale_id,
      package_sales (
        student_name,
        price_paid,
        packages ( name )
      )
    `)
    .eq('partner_id', id)
    .order('created_at', { ascending: false })

  // Build monthly summary
  const monthlyMap: Record<string, any> = {}
  for (const r of referrals || []) {
    if (!monthlyMap[r.period]) {
      monthlyMap[r.period] = {
        period: r.period,
        count: 0,
        total: 0,
        status: r.status,
      }
    }
    monthlyMap[r.period].count++
    monthlyMap[r.period].total += r.commission_amount
    if (r.status !== 'paid') monthlyMap[r.period].status = r.status
  }

  const monthly = Object.values(monthlyMap).sort((a: any, b: any) =>
    b.period.localeCompare(a.period)
  )

  return NextResponse.json({
    partner,
    school,
    referrals: referrals || [],
    monthly,
  })
}
