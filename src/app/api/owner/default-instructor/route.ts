import { NextResponse } from 'next/server'
import { getDefaultInstructorForStudent } from '@/repositories/sessionRepository'
import { getSchoolContext } from '@/lib/auth/get-school-context'

/** Backs the Agendar Aula modal's Instrutor pre-fill — same trigger/shape
 *  as api/owner/default-level (fired on the student-name field's blur). */
export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { searchParams } = new URL(request.url)
  const studentName = searchParams.get('student_name') ?? ''
  const activityId  = searchParams.get('activity_id')

  if (studentName.trim().length < 2) {
    return NextResponse.json({ instructorId: null, instructorName: null })
  }

  try {
    const result = await getDefaultInstructorForStudent(school.ctx.schoolId, studentName, activityId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
