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

    const [{ data, error }, { data: allStudents, error: studentsError }] = await Promise.all([
      supabase
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
        .order('sold_at', { ascending: false }),
      // Students with no package sale at all (walk-ins, booking-only
      // contacts, agencies like a partner referral) never showed up in the
      // schedule modal's suggestion dropdown before — only package_sales
      // was queried, so they were only bookable by typing their name
      // exactly from memory, with no autocomplete to confirm the record.
      supabase
        .from('students')
        .select('name')
        .eq('school_id', SCHOOL_ID),
    ])

    if (error || studentsError) return NextResponse.json({ students: [] })

    // Exhausted packages are included too (not just remaining > 0) — the
    // owner needs to see and select them in order to get the insufficient-
    // balance warning when scheduling; hiding them just meant zero feedback.
    const withPackages = (data ?? []).map(s => {
      const pkg = unwrap(s.packages)
      return {
        student_name:      s.student_name ?? '—',
        package_sale_id:   s.id as string | null,
        package_name:      pkg?.name ?? null,
        activity_name:     pkg?.sport ?? null,
        minutes_purchased: s.minutes_purchased ?? 0,
        minutes_used:      s.minutes_used ?? 0,
        minutes_remaining: (s.minutes_purchased ?? 0) - (s.minutes_used ?? 0),
      }
    })

    const namesWithPackages = new Set(withPackages.map(s => s.student_name.toLowerCase()))
    const withoutPackages = (allStudents ?? [])
      .filter(s => s.name && !namesWithPackages.has(s.name.toLowerCase()))
      .map(s => ({
        student_name:      s.name as string,
        package_sale_id:   null as string | null,
        package_name:      null as string | null,
        activity_name:     null as string | null,
        minutes_purchased: 0,
        minutes_used:      0,
        minutes_remaining: 0,
      }))

    const students = [...withPackages, ...withoutPackages]
      .sort((a, b) => a.student_name.localeCompare(b.student_name))

    return NextResponse.json({ students })
  } catch {
    return NextResponse.json({ students: [] })
  }
}
