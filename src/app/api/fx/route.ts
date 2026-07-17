import { getExchangeRates } from '@/lib/fx'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rates = await getExchangeRates()
    return NextResponse.json({ ok: true, rates })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
