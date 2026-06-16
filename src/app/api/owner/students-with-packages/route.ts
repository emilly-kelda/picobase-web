import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('package_sales')
      .select('student_name, minutes_purchased, minutes_used, packages ( name )')
      .eq('school_id', SCHOOL_ID)

    if (error) return NextResponse.json({ students: [] })

    const students = (data ?? [])
      .filter(s => {
        const remaining = (s.minutes_purchased ?? 0) - (s.minutes_used ?? 0)
        return remaining > 0
      })
      .map(s => ({
        name:             s.student_name ?? '—',
        packageName:      (s.packages as any)?.name ?? '—',
        minutesRemaining: (s.minutes_purchased ?? 0) - (s.minutes_used ?? 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ students })
  } catch {
    return NextResponse.json({ students: [] })
  }
}
