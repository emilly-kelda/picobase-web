import { getSessionHistoryForPackageSale } from '@/repositories/packageRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ packageSaleId: string }> }
) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { packageSaleId } = await params
  const result = await getSessionHistoryForPackageSale(school.ctx.schoolId, packageSaleId)

  if (!result) {
    return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, ...result })
}
