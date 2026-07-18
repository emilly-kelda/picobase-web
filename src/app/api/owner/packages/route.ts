import {
  createPackageType,
  updatePackageType,
  deactivatePackageType,
} from '@/repositories/packageRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function validate(body: any) {
  if (!body.name?.trim()) return 'Nome é obrigatório'
  if (!(Number(body.total_minutes) > 0)) return 'Duração do pacote deve ser maior que zero'
  if (!(Number(body.base_price) >= 0)) return 'Preço inválido'
  return null
}

export async function POST(request: Request) {
  const body = await request.json()
  const error = validate(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  try {
    const data = await createPackageType({
      school_id:     SCHOOL_ID,
      name:          body.name.trim(),
      sport:         body.sport?.trim() || null,
      total_minutes: Number(body.total_minutes),
      base_price:    Number(body.base_price),
    })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  const error = validate(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  try {
    await updatePackageType(body.id, SCHOOL_ID, {
      name:          body.name.trim(),
      sport:         body.sport?.trim() || null,
      total_minutes: Number(body.total_minutes),
      base_price:    Number(body.base_price),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

  try {
    await deactivatePackageType(id, SCHOOL_ID)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
