import QRCode from 'qrcode'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'png'

  const supabase = createServiceClient()
  const { data: school } = await supabase
    .from('schools')
    .select('slug')
    .eq('id', SCHOOL_ID)
    .single()

  const slug = school?.slug ?? 'escola'
  const url  = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://picobase.com.br'}/checkin/${slug}`

  if (format === 'png') {
    const buffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: 800,
      margin: 2,
      color: { dark: '#1A1C22', light: '#FFFFFF' },
    })

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="checkin-${slug}.png"`,
      },
    })
  }

  if (format === 'svg') {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      width: 400,
      margin: 2,
      color: { dark: '#1A1C22', light: '#FFFFFF' },
    })

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="checkin-${slug}.svg"`,
      },
    })
  }

  return NextResponse.json({ url, slug })
}
