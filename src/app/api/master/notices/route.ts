import { createNotice } from '@/repositories/schoolNoticeRepository'
import { requireMaster } from '@/lib/masterAuth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const { schoolId, message } = await request.json()
  if (!schoolId) return NextResponse.json({ error: 'Missing schoolId' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  try {
    await createNotice(schoolId, message.trim(), auth.userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
