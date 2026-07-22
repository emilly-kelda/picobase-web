import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

// Same allow-list/size pattern as upload-waiver and partners/upload-logo,
// but per `kind` — a signature needs transparency (PNG-only, small), a
// background or the school logo can be a regular photo/graphic.
const KIND_RULES: Record<string, { types: string[]; maxSize: number; label: string }> = {
  background: { types: ['image/png', 'image/jpeg', 'image/webp'], maxSize: 5 * 1024 * 1024, label: 'PNG, JPG ou WEBP — máximo 5MB' },
  signature:  { types: ['image/png'], maxSize: 1 * 1024 * 1024, label: 'PNG — máximo 1MB' },
  logo:       { types: ['image/png', 'image/jpeg', 'image/webp'], maxSize: 2 * 1024 * 1024, label: 'PNG, JPG ou WEBP — máximo 2MB' },
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')
  const kind = formData.get('kind')

  if (typeof kind !== 'string' || !(kind in KIND_RULES)) {
    return NextResponse.json({ error: 'Tipo de upload inválido' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  const rules = KIND_RULES[kind]
  if (!rules.types.includes(file.type)) {
    return NextResponse.json({ error: `Formato inválido — use ${rules.label}` }, { status: 400 })
  }
  if (file.size > rules.maxSize) {
    return NextResponse.json({ error: `Arquivo muito grande — ${rules.label}` }, { status: 400 })
  }

  const supabase = createServiceClient()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${SCHOOL_ID}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('certificate-assets')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from('certificate-assets').getPublicUrl(path)
  return NextResponse.json({ ok: true, url: data.publicUrl })
}
