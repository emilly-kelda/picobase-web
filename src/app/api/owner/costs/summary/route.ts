import { getCostsSummary } from '@/repositories/costRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

/** Backs the Costs page's KPI cards after a filter change — the initial
 *  load reads getCostsSummary directly server-side in page.tsx, same as
 *  getCosts; this route exists only so CostsClient can refresh the cards
 *  client-side when the owner picks a different period/category, the
 *  same split the paginated list already uses (GET /api/owner/costs vs.
 *  the server-side initial getCosts call). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  try {
    const summary = await getCostsSummary(SCHOOL_ID, {
      period:   searchParams.get('period') || null,
      category: searchParams.get('category') || null,
    })
    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
