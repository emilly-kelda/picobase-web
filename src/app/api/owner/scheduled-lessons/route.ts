import { getScheduledLessons } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

// Aulas Agendadas' 5-day tab strip only gets today/tomorrow pre-fetched
// server-side (owner/page.tsx's existing getScheduledLessons calls) — the
// other days in the window (and anything paged further out via "Ver
// próximas aulas") are fetched from here on demand, one call per missing
// date, reusing the exact same repository function and Lesson shape so
// the client can render them with zero special-casing.
export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  }
  const lessons = await getScheduledLessons(school.ctx.schoolId, date)
  return NextResponse.json({ lessons })
}
