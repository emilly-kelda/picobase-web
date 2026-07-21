import { closePackageSale } from '@/repositories/packageRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const { packageSaleId } = await request.json()

  if (!packageSaleId) {
    return NextResponse.json({ error: 'packageSaleId é obrigatório' }, { status: 400 })
  }

  try {
    await closePackageSale(SCHOOL_ID, packageSaleId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao encerrar pacote'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
