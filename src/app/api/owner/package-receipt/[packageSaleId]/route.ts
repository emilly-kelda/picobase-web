import { getPackageReceiptData } from '@/repositories/packageRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ packageSaleId: string }> }
) {
  const { packageSaleId } = await params
  const data = await getPackageReceiptData(SCHOOL_ID, packageSaleId)

  if (!data) {
    return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, ...data })
}
