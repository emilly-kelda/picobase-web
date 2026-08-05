import { createServiceClient } from '@/lib/supabase-server'
import { getPackageBalanceForStudent } from '@/repositories/packageRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { searchParams } = new URL(request.url)
  const studentName      = searchParams.get('student_name')
  const packageSaleId    = searchParams.get('package_sale_id')
  const excludeLessonId  = searchParams.get('exclude_lesson_id')
  const activityId       = searchParams.get('activity_id')
  let sport               = searchParams.get('sport')

  if (!studentName) {
    return NextResponse.json({ hasPackage: false, packageSaleId: null, minutesRemaining: 0, minutesRemainingRaw: 0, minutesPurchased: 0, pricePaid: 0 })
  }

  // Same resolution as confirm-lesson/route.ts's own activityRow lookup —
  // callers that only know the activity being confirmed (not its sport
  // directly, e.g. ConfirmLessonModal's balance preview) can pass
  // activity_id instead, so the FIFO fallback below (when no
  // package_sale_id is already linked) can't land on a same-student,
  // different-sport package just because it happens to have room.
  if (!sport && activityId) {
    const supabase = createServiceClient()
    const { data: activityRow } = await supabase
      .from('activities')
      .select('sport')
      .eq('id', activityId)
      .maybeSingle()
    sport = activityRow?.sport ?? null
  }

  const result = await getPackageBalanceForStudent(school.ctx.schoolId, studentName, {
    packageSaleId:   packageSaleId || null,
    excludeLessonId: excludeLessonId || null,
    sport:           sport || null,
  })
  return NextResponse.json(result)
}
