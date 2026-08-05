import { getReportData } from '@/repositories/reportRepository'
import { getMonthlyCostTotal } from '@/repositories/costRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET() {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const [data, monthlyCostTotal] = await Promise.all([
    getReportData(school.ctx.schoolId),
    // Same figure the Custos page's Reserva de Baixa Temporada card uses
    // for "Lucro após custos operacionais" — one informational stat here
    // mirrors it instead of leaving Reports with no operational-cost
    // context at all.
    getMonthlyCostTotal(school.ctx.schoolId),
  ])
  return NextResponse.json({ ...data, monthlyCostTotal })
}
