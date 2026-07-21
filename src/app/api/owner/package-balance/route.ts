import { getPackageBalanceForStudent } from '@/repositories/packageRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentName      = searchParams.get('student_name')
  const packageSaleId    = searchParams.get('package_sale_id')
  const excludeLessonId  = searchParams.get('exclude_lesson_id')

  if (!studentName) {
    return NextResponse.json({ hasPackage: false, packageSaleId: null, minutesRemaining: 0, minutesPurchased: 0, pricePaid: 0 })
  }

  const result = await getPackageBalanceForStudent(SCHOOL_ID, studentName, {
    packageSaleId:   packageSaleId || null,
    excludeLessonId: excludeLessonId || null,
  })
  return NextResponse.json(result)
}
