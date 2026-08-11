import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export async function POST(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Formato inválido — use PNG, JPG ou WEBP' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande — máximo 2MB' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${school.ctx.schoolId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('package-icons')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from('package-icons').getPublicUrl(path)
  return NextResponse.json({ ok: true, url: data.publicUrl })
}
