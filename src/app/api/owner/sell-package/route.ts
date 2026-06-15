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

  return NextResponse.json({ ok: true })
}
