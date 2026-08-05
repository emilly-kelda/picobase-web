// Mirrors api/owner/qr/route.ts exactly (same QRCode calls, same options) —
// just pointed at a partner's tracked booking link instead of the school's
// plain checkin link.

import QRCode from 'qrcode'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'png'

  const supabase = createServiceClient()

  const [{ data: schoolRow }, { data: partner }] = await Promise.all([
    supabase.from('schools').select('slug').eq('id', school.ctx.schoolId).single(),
    supabase.from('partners').select('referral_code').eq('id', id).eq('school_id', school.ctx.schoolId).single(),
  ])

  if (!partner?.referral_code) {
    return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
  }

  const slug = schoolRow?.slug ?? 'escola'
  const url  = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://picobase.com.br'}/book/${slug}?ref=${partner.referral_code}`

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
        'Content-Disposition': `attachment; filename="parceiro-${partner.referral_code}.png"`,
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
        'Content-Disposition': `attachment; filename="parceiro-${partner.referral_code}.svg"`,
      },
    })
  }

  return NextResponse.json({ url })
}
