import { getTodayDetail } from '@/repositories/sessionRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET() {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const data = await getTodayDetail(school.ctx.schoolId)
  return NextResponse.json({ ok: true, ...data })
}
