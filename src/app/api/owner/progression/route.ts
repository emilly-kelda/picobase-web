import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { resolveLevelAfterSkillsUpdate, getLatestProgressionForSport } from '@/repositories/studentRepository'
import { getSchoolContext } from '@/lib/auth/get-school-context'

// Seeds ConfirmLessonModal's embedded ProgressionEditor with the student's
// real current level/skills for this sport instead of a hardcoded blank
// level_1_discovery slate — see getLatestProgressionForSport's own comment.
export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')
  const sport = searchParams.get('sport')
  if (!studentId || !sport) {
    return NextResponse.json({ level: 'level_1_discovery', skills: [] })
  }
  const progression = await getLatestProgressionForSport(school.ctx.schoolId, studentId, sport)
  return NextResponse.json({
    level:  progression?.level ?? 'level_1_discovery',
    skills: progression?.skills ?? [],
  })
}

export async function POST(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const body = await request.json()
  const { student_id, level, notes, skills, session_id, sport } = body
  const supabase = createServiceClient()

  // Auto-advance: if every skill required for the level being saved is
  // already checked, persist the next level up instead of the submitted one.
  const finalLevel = resolveLevelAfterSkillsUpdate(sport || 'default', level, skills || [])

  await supabase
    .from('students')
    .update({ skill_level: finalLevel })
    .eq('id', student_id)
    .eq('school_id', school.ctx.schoolId)

  const { error } = await supabase
    .from('student_progression')
    .insert({
      school_id:  school.ctx.schoolId,
      student_id,
      level:      finalLevel,
      notes:      notes || null,
      skills:     skills || [],
      session_id: session_id || null,
      sport:      sport || null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, level: finalLevel })
}
