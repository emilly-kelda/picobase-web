import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const body = await request.json()
  const { student_id, level, notes, skills, session_id, sport } = body
  const supabase = createServiceClient()

  await supabase
    .from('students')
    .update({ skill_level: level })
    .eq('id', student_id)
    .eq('school_id', SCHOOL_ID)

  const { error } = await supabase
    .from('student_progression')
    .insert({
      school_id:  SCHOOL_ID,
      student_id,
      level,
      notes:      notes || null,
      skills:     skills || [],
      session_id: session_id || null,
      sport:      sport || null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
