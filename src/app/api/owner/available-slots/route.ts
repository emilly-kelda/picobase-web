import { getSchoolContext } from '@/lib/auth/get-school-context'
import { getAvailableSlotsForDate } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { searchParams } = new URL(request.url)
  const date         = searchParams.get('date')
  const activityName = searchParams.get('activityName')
  const durationMin  = Number(searchParams.get('durationMin') ?? 60)
  const studentName  = searchParams.get('studentName')

  if (!date) {
    return NextResponse.json({ error: 'date é obrigatório' }, { status: 400 })
  }

  try {
    const slots = await getAvailableSlotsForDate(school.ctx.schoolId, date, activityName, durationMin, studentName)
    return NextResponse.json({ slots })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
