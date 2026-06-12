import { createServiceClient } from '@/lib/supabase-server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? new Date().toISOString().slice(0, 7)
  const format = searchParams.get('format') ?? 'pix'

  const supabase = createServiceClient()

  const { data } = await supabase
    .from('payments')
    .select(`
      total_to_pay,
      users!payments_instructor_id_fkey ( name, pix_key, wise_email )
    `)
    .eq('school_id', SCHOOL_ID)
    .eq('period', period)
    .eq('status', 'approved')

  if (!data?.length) {
    return new Response('No approved payments', { status: 404 })
  }

  let csv = ''

  if (format === 'pix') {
    csv = 'nome,pix,valor,descricao\n'
    csv += data.map(p => {
      const u = p.users as any
      return `${u?.name ?? ''},${u?.pix_key ?? ''},${p.total_to_pay},Pico Base ${period}`
    }).join('\n')
  }

  if (format === 'wise') {
    csv = 'name,email,amount,currency,reference\n'
    csv += data.map(p => {
      const u = p.users as any
      return `${u?.name ?? ''},${u?.wise_email ?? ''},${p.total_to_pay},BRL,Pico Base ${period}`
    }).join('\n')
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${format}_${period}.csv"`,
    },
  })
}

