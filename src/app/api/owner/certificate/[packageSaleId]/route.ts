import { getCertificateData } from '@/repositories/packageRepository'
import { renderToBuffer } from '@react-pdf/renderer'
import { CertificatePDF } from '@/lib/certificate-pdf'
import React from 'react'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ packageSaleId: string }> }
) {
  const { packageSaleId } = await params
  const data = await getCertificateData(SCHOOL_ID, packageSaleId)

  if (!data) {
    return new Response(
      JSON.stringify({ error: 'Pacote não encontrado ou ainda não concluído' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const pdf = await renderToBuffer(React.createElement(CertificatePDF, data) as any)

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado_${data.studentName.replace(/\s+/g, '_')}.pdf"`,
    },
  })
}
