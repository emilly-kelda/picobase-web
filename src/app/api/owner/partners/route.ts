import { getPartners, createPartner, updatePartner, deactivatePartner } from '@/repositories/partnerRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function validate(body: any) {
  if (!body.name?.trim()) return 'Nome é obrigatório'
  if (!(Number(body.commissionPct) >= 0 && Number(body.commissionPct) <= 1)) return 'Comissão deve ser entre 0 e 1 (ex: 0.15 para 15%)'
  if (body.discountPct != null && !(Number(body.discountPct) >= 0 && Number(body.discountPct) <= 1)) return 'Desconto deve ser entre 0 e 1'
  return null
}

export async function GET() {
  try {
    const partners = await getPartners(SCHOOL_ID)
    return NextResponse.json({ ok: true, partners })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const error = validate(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  try {
    await createPartner({
      schoolId:      SCHOOL_ID,
      name:          body.name.trim(),
      type:          body.type?.trim() || null,
      commissionPct: Number(body.commissionPct),
      discountPct:   body.discountPct != null ? Number(body.discountPct) : null,
      financeEmail:  body.financeEmail?.trim() || null,
      referralCode:  body.referralCode?.trim() || null,
    })
    return NextResponse.json({ ok: true })
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
    await updatePartner(body.id, SCHOOL_ID, {
      name:          body.name.trim(),
      type:          body.type?.trim() || null,
      commissionPct: Number(body.commissionPct),
      discountPct:   body.discountPct != null ? Number(body.discountPct) : null,
      financeEmail:  body.financeEmail?.trim() || null,
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
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    await deactivatePartner(id, SCHOOL_ID)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
