import { getSchoolContext } from '@/lib/auth/get-school-context'
import { getActiveNoticeForSchool, dismissNotice } from '@/repositories/schoolNoticeRepository'
import { NextResponse } from 'next/server'

// Unscoped master (not impersonating) has no single school_id, so this
// route is a no-op for them — NoticeBanner is only ever rendered inside
// owner/layout.tsx anyway. getSchoolContext() resolves to the impersonated
// school when master is viewing as one, same as every other /api/owner/* route.
export async function GET() {
  const school = await getSchoolContext()
  if (!school.ok) return NextResponse.json({ notice: null })

  const notice = await getActiveNoticeForSchool(school.ctx.schoolId)
  return NextResponse.json({ notice })
}

export async function PATCH(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

  await dismissNotice(id, school.ctx.schoolId)
  return NextResponse.json({ ok: true })
}
