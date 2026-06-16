import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServiceClient()
  const { payment_id } = await request.json()

  const { error } = await supabase
    .from('payments')
    .update({
      status:      'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', payment_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
