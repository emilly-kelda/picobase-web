import { getAvailableSlotsForDate } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date         = searchParams.get('date')
  const activityName = searchParams.get('activityName')
  const durationMin  = Number(searchParams.get('durationMin') ?? 60)
  const studentName  = searchParams.get('studentName')

  if (!date) {
    return NextResponse.json({ error: 'date é obrigatório' }, { status: 400 })
  }

  try {
    const slots = await getAvailableSlotsForDate(SCHOOL_ID, date, activityName, durationMin, studentName)
    return NextResponse.json({ slots })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
