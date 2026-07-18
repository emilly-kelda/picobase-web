import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB — legal documents can run longer than a logo image
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Formato inválido — use PDF ou Word (.doc/.docx)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande — máximo 10MB' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const path = `${SCHOOL_ID}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('school-waivers')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from('school-waivers').getPublicUrl(path)
  return NextResponse.json({ ok: true, url: data.publicUrl, fileName: file.name })
}
