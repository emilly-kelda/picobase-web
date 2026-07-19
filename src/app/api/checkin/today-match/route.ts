import { getSchoolBySlug, getTodayScheduledMatchForCheckin } from '@/repositories/checkinRepository'
import { NextResponse } from 'next/server'

/** Replaces the old /api/checkin/scheduled-today, which returned every
 *  student scheduled that day so the form could offer name suggestions —
 *  an LGPD exposure (any anonymous visitor could browse the whole day's
 *  roster). This takes the exact name the visitor already typed and
 *  answers found/not-found only, same shape as /api/checkin/package-balance. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const schoolSlug = searchParams.get('school')
  const name = searchParams.get('name')

  if (!schoolSlug || !name?.trim()) return NextResponse.json({ found: false })

  const school = await getSchoolBySlug(schoolSlug)
  if (!school) return NextResponse.json({ found: false })

  const match = await getTodayScheduledMatchForCheckin(school.id, name)
  return NextResponse.json(match ? { found: true, ...match } : { found: false })
}
