import { getReportData } from '@/repositories/reportRepository'
import { getMonthlyCostTotal } from '@/repositories/costRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const [data, monthlyCostTotal] = await Promise.all([
    getReportData(SCHOOL_ID),
    // Same figure the Custos page's Reserva de Baixa Temporada card uses
    // for "Lucro após custos operacionais" — one informational stat here
    // mirrors it instead of leaving Reports with no operational-cost
    // context at all.
    getMonthlyCostTotal(SCHOOL_ID),
  ])
  return NextResponse.json({ ...data, monthlyCostTotal })
}
