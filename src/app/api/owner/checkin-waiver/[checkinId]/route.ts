import { getSignedWaiverData } from '@/repositories/checkinRepository'
import { renderToBuffer } from '@react-pdf/renderer'
import { SignedWaiverPDF } from '@/lib/waiver-signed-pdf'
import React from 'react'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ checkinId: string }> }
) {
  const { checkinId } = await params
  const data = await getSignedWaiverData(SCHOOL_ID, checkinId)

  if (!data) {
    return new Response(
      JSON.stringify({ error: 'Termo assinado não encontrado para este check-in' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const pdf = await renderToBuffer(React.createElement(SignedWaiverPDF, data) as any)

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="termo_${data.studentName.replace(/\s+/g, '_')}.pdf"`,
    },
  })
}
