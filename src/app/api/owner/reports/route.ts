import { getReportData } from '@/repositories/reportRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const data = await getReportData(SCHOOL_ID)
  return NextResponse.json(data)
}
