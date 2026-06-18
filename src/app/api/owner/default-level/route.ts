import { NextResponse } from 'next/server'
import { getDefaultLevelForStudent } from '@/repositories/sessionRepository'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentName = searchParams.get('student_name') ?? ''
  const activityId   = searchParams.get('activity_id')

  if (!studentName.trim()) {
    return NextResponse.json({ level: 'experimental', experimentalDisabled: false })
  }

  try {
    const result = await getDefaultLevelForStudent(SCHOOL_ID, studentName, activityId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
