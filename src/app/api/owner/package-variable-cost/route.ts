import { createServiceClient } from '@/lib/supabase-server'
import { getVariableCostForStudent } from '@/lib/commission'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { searchParams } = new URL(request.url)
  const studentName = searchParams.get('student_name')

  const supabase = createServiceClient()
  const result = await getVariableCostForStudent(supabase, school.ctx.schoolId, studentName)
  return NextResponse.json(result)
}
