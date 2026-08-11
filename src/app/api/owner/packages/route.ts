import {
  createPackageType,
  updatePackageType,
  deactivatePackageType,
} from '@/repositories/packageRepository'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

function validate(body: any) {
  if (!body.name?.trim()) return 'Nome é obrigatório'
  if (!(Number(body.total_minutes) > 0)) return 'Duração do pacote deve ser maior que zero'
  if (!(Number(body.base_price) >= 0)) return 'Preço inválido'
  return null
}

export async function POST(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const body = await request.json()
  const error = validate(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  try {
    const data = await createPackageType({
      school_id:     school.ctx.schoolId,
      name:          body.name.trim(),
      sport:         body.sport?.trim() || null,
      total_minutes: Number(body.total_minutes),
      base_price:    Number(body.base_price),
      icon_url:      body.icon_url?.trim() || null,
    })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  const error = validate(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  try {
    await updatePackageType(body.id, school.ctx.schoolId, {
      name:          body.name.trim(),
      sport:         body.sport?.trim() || null,
      total_minutes: Number(body.total_minutes),
      base_price:    Number(body.base_price),
      icon_url:      body.icon_url?.trim() || null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

  try {
    await deactivatePackageType(id, school.ctx.schoolId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
