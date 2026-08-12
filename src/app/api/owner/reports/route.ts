import { getReportData } from '@/repositories/reportRepository'
import { getMonthlyCostTotal } from '@/repositories/costRepository'
import { getSchool } from '@/repositories/runwayRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET() {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const [data, monthlyCostTotal, schoolRow] = await Promise.all([
    getReportData(school.ctx.schoolId),
    // Same figure the Custos page's Reserva de Baixa Temporada card uses
    // for "Lucro após custos operacionais" — one informational stat here
    // mirrors it instead of leaving Reports with no operational-cost
    // context at all.
    getMonthlyCostTotal(school.ctx.schoolId),
    // high_season_start_month/end_month back the Sazonalidade tab's season
    // summary — same fields Settings → Financeiro already lets the owner
    // configure, not a new concept invented for that tab.
    getSchool(school.ctx.schoolId),
  ])
  return NextResponse.json({
    ...data,
    monthlyCostTotal,
    highSeasonStartMonth: (schoolRow as any)?.high_season_start_month ?? null,
    highSeasonEndMonth:   (schoolRow as any)?.high_season_end_month ?? null,
  })
}
