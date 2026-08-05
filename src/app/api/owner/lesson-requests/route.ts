import { NextResponse } from 'next/server'
import { getPendingLessonRequests } from '@/repositories/lessonRequestRepository'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET() {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const requests = await getPendingLessonRequests(school.ctx.schoolId)
  return NextResponse.json({ requests })
}
