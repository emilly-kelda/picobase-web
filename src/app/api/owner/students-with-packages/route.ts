import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function unwrap<T>(raw: T | T[] | null): T | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('package_sales')
      .select(`
        id,
        student_name,
        minutes_purchased,
        minutes_used,
        packages ( name, sport )
      `)
      .eq('school_id', SCHOOL_ID)
      .gt('minutes_purchased', 0)
      .order('sold_at', { ascending: false })

    if (error) return NextResponse.json({ students: [] })

    // Exhausted packages are included too (not just remaining > 0) — the
    // owner needs to see and select them in order to get the insufficient-
    // balance warning when scheduling; hiding them just meant zero feedback.
    const students = (data ?? [])
      .map(s => {
        const pkg = unwrap(s.packages)
        return {
          student_name:      s.student_name ?? '—',
          package_sale_id:   s.id,
          package_name:      pkg?.name ?? '—',
          activity_name:     pkg?.sport ?? '—',
          minutes_purchased: s.minutes_purchased ?? 0,
          minutes_used:      s.minutes_used ?? 0,
          minutes_remaining: (s.minutes_purchased ?? 0) - (s.minutes_used ?? 0),
        }
      })
      .sort((a, b) => a.student_name.localeCompare(b.student_name))

    return NextResponse.json({ students })
  } catch {
    return NextResponse.json({ students: [] })
  }
}
