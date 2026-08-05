import { getRescheduleSuggestion } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const { searchParams } = new URL(request.url)
  const activityName = searchParams.get('activityName')
  const durationMin   = Number(searchParams.get('durationMin') ?? 60)
  const excludeId     = searchParams.get('excludeId')

  if (!excludeId) {
    return NextResponse.json({ error: 'excludeId é obrigatório' }, { status: 400 })
  }

  try {
    const suggestion = await getRescheduleSuggestion(school.ctx.schoolId, activityName, durationMin, excludeId)
    return NextResponse.json({ suggestion })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
