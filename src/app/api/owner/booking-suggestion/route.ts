import { getBookingSuggestion } from '@/repositories/scheduledLessonRepository'
import { getSchool } from '@/repositories/runwayRepository'
import { getHourlyWindForecast } from '@/lib/weather'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

/** Backs the "Sugestão do sistema" card in ScheduledLessons.tsx's "Agendar
 *  aula" modal — same instructor-availability search as reschedule-
 *  suggestion/route.ts, plus an hourly wind forecast layered on top so the
 *  suggestion prefers a slot with good sailing conditions when one's
 *  available in the search window. Only fetches a forecast if the school
 *  has actually configured its own spot (lat/lon in Settings → Geral) —
 *  the curated Ceará fallback list buildWeatherSpots() uses elsewhere isn't
 *  a real answer to "what's the wind at this school," so guessing one of
 *  those would be worse than no wind data at all. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const activityName = searchParams.get('activityName')
  const durationMin   = Number(searchParams.get('durationMin') ?? 60)

  try {
    const school = await getSchool(SCHOOL_ID)
    const hasOwnSpot = school?.latitude != null && school?.longitude != null

    const forecast = hasOwnSpot
      ? await getHourlyWindForecast({ id: 'school', label: '', lat: school!.latitude!, lon: school!.longitude! })
      : []
    const windMap = new Map(forecast.map(f => [`${f.dateStr}T${f.hour}`, f.windKn]))
    const windKnAt = (dateStr: string, hour: number) => windMap.get(`${dateStr}T${hour}`) ?? null

    const suggestion = await getBookingSuggestion(SCHOOL_ID, activityName, durationMin, windKnAt)
    return NextResponse.json({ suggestion })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
