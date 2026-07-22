import { NextResponse } from 'next/server'
import { getPendingLessonRequests } from '@/repositories/lessonRequestRepository'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const requests = await getPendingLessonRequests(SCHOOL_ID)
  return NextResponse.json({ requests })
}
