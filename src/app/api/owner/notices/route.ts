import { getAuthContext } from '@/lib/auth'
import { getActiveNoticeForSchool, dismissNotice } from '@/repositories/schoolNoticeRepository'
import { NextResponse } from 'next/server'

// Master has no single school_id, so this route is a no-op for them —
// NoticeBanner is only ever rendered inside owner/layout.tsx anyway.
export async function GET() {
  const auth = await getAuthContext()
  if (!auth || auth.isMaster) return NextResponse.json({ notice: null })

  const notice = await getActiveNoticeForSchool(auth.schoolId)
  return NextResponse.json({ notice })
}

export async function PATCH(request: Request) {
  const auth = await getAuthContext()
  if (!auth || auth.isMaster) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await dismissNotice(id, auth.schoolId)
  return NextResponse.json({ ok: true })
}
