import { createServiceClient } from '@/lib/supabase-server'
import { getVariableCostForStudent } from '@/lib/commission'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentName = searchParams.get('student_name')

  const supabase = createServiceClient()
  const result = await getVariableCostForStudent(supabase, SCHOOL_ID, studentName)
  return NextResponse.json(result)
}
