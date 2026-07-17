import { getCosts, createCost } from '@/repositories/picobaseCostRepository'
import { requireMaster } from '@/lib/masterAuth'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const costs = await getCosts()
  return NextResponse.json({ costs })
}

export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const { category, description, amount, costDate } = await request.json()
  if (!category?.trim())    return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  if (!(Number(amount) > 0)) return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })

  try {
    await createCost({
      category:    category.trim(),
      description: description.trim(),
      amount:      Number(amount),
      costDate:    costDate?.trim() || new Date().toISOString().slice(0, 10),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
