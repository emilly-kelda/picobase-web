import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const schoolSlug = searchParams.get('school')

  if (!schoolSlug) return NextResponse.json({ students: [] })

  const supabase = createServiceClient()

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('slug', schoolSlug)
    .single()

  if (!school) return NextResponse.json({ students: [] })

  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('scheduled_lessons')
    .select(`
      id,
      student_name,
      activity_id,
      instructor_id,
      scheduled_at,
      activities ( name ),
      instructor:users!scheduled_lessons_instructor_id_fkey ( id, name )
    `)
    .eq('school_id', school.id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', `${today}T00:00:00`)
    .lte('scheduled_at', `${today}T23:59:59`)
    .order('scheduled_at', { ascending: true })

  const students = (data ?? []).map(s => {
    const activity   = Array.isArray(s.activities) ? s.activities[0] : s.activities
    const instructor = Array.isArray(s.instructor) ? s.instructor[0] : s.instructor
    return {
      id:              s.id,
      student_name:    s.student_name,
      activity_id:     s.activity_id,
      activity_name:   activity?.name ?? null,
      instructor_id:   s.instructor_id,
      instructor_name: instructor?.name ?? null,
      scheduled_at:    s.scheduled_at,
    }
  })

  return NextResponse.json({ students })
}
