import { getExchangeRatesWithSource } from '@/lib/fx'
import { NextResponse } from 'next/server'

// This route has no dynamic function calls (no cookies/headers/params), so
// without this Next.js can treat it as a static route eligible for the Full
// Route Cache — meaning it could serve the SAME response (including a
// cached failure from a cold start) on every request, making the confirm
// modal's "Tentar novamente" button look broken even though its own retry
// logic is correct: the client was retrying, but the server kept returning
// whatever got cached the first time.
export const dynamic = 'force-dynamic'

export async function GET() {
  const { rates, source } = await getExchangeRatesWithSource()
  return NextResponse.json(
    { ok: true, rates, source },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  )
}
