import { NextResponse } from 'next/server'
import {
  getCertificateTemplates,
  upsertCertificateTemplate,
  deleteCertificateTemplate,
} from '@/repositories/certificateTemplateRepository'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const templates = await getCertificateTemplates(SCHOOL_ID)
  return NextResponse.json({ ok: true, templates })
}

export async function POST(request: Request) {
  const body = await request.json()

  if (!['upload', 'fictitious', 'text'].includes(body.signature_type)) {
    return NextResponse.json({ error: 'Tipo de assinatura inválido' }, { status: 400 })
  }

  try {
    await upsertCertificateTemplate(SCHOOL_ID, {
      sportKey: body.sport_key ?? null,
      themeKey: body.theme_key ?? 'oceano',
      backgroundImageUrl: body.background_image_url ?? null,
      signatureType: body.signature_type,
      signatureData: body.signature_data ?? null,
      fontFamily: body.font_family ?? null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao salvar' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }
  try {
    await deleteCertificateTemplate(SCHOOL_ID, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao remover' }, { status: 500 })
  }
}
