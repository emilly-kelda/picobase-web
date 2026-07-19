import { getRescheduleSuggestion } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const activityName = searchParams.get('activityName')
  const durationMin   = Number(searchParams.get('durationMin') ?? 60)
  const excludeId     = searchParams.get('excludeId')

  if (!excludeId) {
    return NextResponse.json({ error: 'excludeId é obrigatório' }, { status: 400 })
  }

  try {
    const suggestion = await getRescheduleSuggestion(SCHOOL_ID, activityName, durationMin, excludeId)
    return NextResponse.json({ suggestion })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
