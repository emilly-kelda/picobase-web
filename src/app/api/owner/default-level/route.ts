import { NextResponse } from 'next/server'
import { getDefaultLevelForStudent } from '@/repositories/sessionRepository'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { searchParams } = new URL(request.url)
  const studentName = searchParams.get('student_name') ?? ''
  const activityId   = searchParams.get('activity_id')

  if (!studentName.trim()) {
    return NextResponse.json({ level: 'experimental', experimentalDisabled: false })
  }

  try {
    const result = await getDefaultLevelForStudent(school.ctx.schoolId, studentName, activityId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
