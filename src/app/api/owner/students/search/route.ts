import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'
import { createServiceClient } from '@/lib/supabase-server'

function unwrap<T>(raw: T | T[] | null): T | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

/** Live search backing ScheduledLessons.tsx's "Aluno" combobox — same
 *  output shape /api/owner/students-with-packages already returns (one row
 *  per package sale, plus a no-package row for students with none), just
 *  scoped to the top 15 name/email matches for `q` instead of loading
 *  every student in the school up front. */
export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ students: [] })

  const supabase = createServiceClient()

  const { data: matched, error: matchError } = await supabase
    .from('students')
    .select('id, name, email')
    .eq('school_id', school.ctx.schoolId)
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .order('name')
    .limit(15)

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 })
  if (!matched || matched.length === 0) return NextResponse.json({ students: [] })

  const names = matched.map(s => s.name).filter((n): n is string => !!n)
  const { data: packageSales, error: pkgError } = await supabase
    .from('package_sales')
    .select('id, student_name, minutes_purchased, minutes_used, packages ( name, sport )')
    .eq('school_id', school.ctx.schoolId)
    .in('student_name', names)
    .gt('minutes_purchased', 0)
    .order('sold_at', { ascending: false })

  if (pkgError) return NextResponse.json({ error: pkgError.message }, { status: 500 })

  const byName = new Map(matched.map(s => [s.name?.toLowerCase() ?? '', s]))

  const withPackages = (packageSales ?? []).map(s => {
    const pkg = unwrap(s.packages)
    const student = byName.get(s.student_name?.toLowerCase() ?? '')
    return {
      id:                 student?.id ?? null,
      student_name:       s.student_name ?? '—',
      email:              student?.email ?? null,
      package_sale_id:    s.id as string,
      package_name:       pkg?.name ?? null,
      activity_name:      pkg?.sport ?? null,
      minutes_purchased:  s.minutes_purchased ?? 0,
      minutes_used:       s.minutes_used ?? 0,
      minutes_remaining: (s.minutes_purchased ?? 0) - (s.minutes_used ?? 0),
    }
  })

  const namesWithPackages = new Set(withPackages.map(s => s.student_name.toLowerCase()))
  const withoutPackages = matched
    .filter(s => s.name && !namesWithPackages.has(s.name.toLowerCase()))
    .map(s => ({
      id:                 s.id,
      student_name:       s.name as string,
      email:              s.email ?? null,
      package_sale_id:    null as string | null,
      package_name:       null as string | null,
      activity_name:      null as string | null,
      minutes_purchased:  0,
      minutes_used:       0,
      minutes_remaining:  0,
    }))

  const students = [...withPackages, ...withoutPackages]
    .sort((a, b) => a.student_name.localeCompare(b.student_name))

  return NextResponse.json({ students })
}
