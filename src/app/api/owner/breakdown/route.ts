import { getSchoolContext } from '@/lib/auth/get-school-context'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { searchParams } = new URL(request.url)
  const instructorId = searchParams.get('instructor')
  const period       = searchParams.get('period') ?? new Date().toISOString().slice(0, 7)

  if (!instructorId) {
    return NextResponse.json({ error: 'instrutor é obrigatório' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const [y, m] = period.split('-').map(Number)
  const start    = `${period}-01`
  const nextFirst = new Date(y, m, 1).toISOString().slice(0, 10)

  // checkins is null for group-confirmed lessons (and any individual one
  // confirmed without going through the check-in kiosk) — scheduled_lessons
  // is the fallback source, see confirm-lesson/route.ts.
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      duration_min,
      price,
      commission_pct,
      commission_amount,
      checkins ( student_name ),
      scheduled_lessons ( student_name ),
      activities ( name )
    `)
    .eq('school_id', school.ctx.schoolId)
    .eq('instructor_id', instructorId)
    .gte('session_date', start)
    .lt('session_date', nextFirst)
    .order('session_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}
