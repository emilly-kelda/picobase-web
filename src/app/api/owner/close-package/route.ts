import { getSchoolContext } from '@/lib/auth/get-school-context'
import { closePackageSale } from '@/repositories/packageRepository'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { packageSaleId } = await request.json()

  if (!packageSaleId) {
    return NextResponse.json({ error: 'packageSaleId é obrigatório' }, { status: 400 })
  }

  try {
    await closePackageSale(school.ctx.schoolId, packageSaleId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao encerrar pacote'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
