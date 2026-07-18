import { getCosts, createCost, updateCost, deleteCost } from '@/repositories/costRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

const COST_TYPES  = ['fixo', 'variavel']
const RECURRENCES = ['mensal', 'anual', 'unico']

function validate(body: any) {
  if (!body.description?.trim()) return 'Descrição é obrigatória'
  if (!(Number(body.amount) > 0)) return 'Valor deve ser maior que zero'
  if (!COST_TYPES.includes(body.costType)) return 'Tipo de custo inválido'
  if (!RECURRENCES.includes(body.recurrence)) return 'Recorrência inválida'
  if (!body.dueDate) return 'Data é obrigatória'
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? '0')

  try {
    const result = await getCosts(SCHOOL_ID, page)
    return NextResponse.json({ ok: true, ...result })
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
    await createCost({
      schoolId:    SCHOOL_ID,
      description: body.description.trim(),
      amount:      Number(body.amount),
      costType:    body.costType,
      recurrence:  body.recurrence,
      dueDate:     body.dueDate,
      category:    body.category?.trim() || null,
      createdBy:   null,
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
    await updateCost(body.id, SCHOOL_ID, {
      description: body.description.trim(),
      amount:      Number(body.amount),
      costType:    body.costType,
      recurrence:  body.recurrence,
      dueDate:     body.dueDate,
      category:    body.category?.trim() || null,
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
    await deleteCost(id, SCHOOL_ID)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
