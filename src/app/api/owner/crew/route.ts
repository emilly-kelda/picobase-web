import { createServiceClient } from '@/lib/supabase-server'
import { encrypt, decrypt } from '@/utils/crypto'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createServiceClient()

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!body.email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  // Step 1 — create auth.users record first (required by users_id_fkey → auth.users.id)
  // Instructors log in via log_token, not Supabase Auth, so no password is set.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:         body.email.trim(),
    email_confirm: true,
  })

  if (authError) {
    console.error('[crew/POST] auth.admin.createUser failed:', authError.message)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const newId = authData.user.id

  // Step 2 — insert into public.users using the id from auth.users
  const insertPayload = {
    id:               newId,
    school_id:        SCHOOL_ID,
    role:             'instructor',
    active:           true,
    name:             body.name.trim(),
    email:            body.email.trim(),
    commission_pct:   body.commission_pct ?? null,
    experience_years: body.experience_years ?? null,
    sports:           body.sports?.length > 0 ? body.sports : null,
    languages:        body.languages?.length > 0 ? body.languages : null,
    certifications:   body.certifications?.length > 0 ? body.certifications : null,
    pix_key:          body.pix_key ? encrypt(body.pix_key) : null,
  }
  console.log('[crew/POST] inserting into public.users, auth_id:', newId, 'payload:', insertPayload)

  const { data, error } = await supabase
    .from('users')
    .insert(insertPayload)
    .select(`
      id, name, email, whatsapp, commission_pct, pix_key, wise_email, active, created_at,
      nationality, languages, sports, certifications, bio, experience_years,
      max_students_per_session, first_aid_certified, contract_type
    `)
    .single()

  if (error) {
    console.error('[crew/POST] public.users insert failed:', error.message, '| auth_id:', newId)
    // Roll back the auth user so we don't leave an orphan in auth.users
    await supabase.auth.admin.deleteUser(newId)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const instructor = { ...data, pix_key: data.pix_key ? decrypt(data.pix_key) : data.pix_key }
  return NextResponse.json({ ok: true, instructor })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('users')
    .update({
      name:             fields.name?.trim(),
      email:            fields.email?.trim() || null,
      commission_pct:   fields.commission_pct ?? null,
      experience_years: fields.experience_years ?? null,
      sports:           fields.sports?.length > 0 ? fields.sports : null,
      languages:        fields.languages?.length > 0 ? fields.languages : null,
      certifications:   fields.certifications?.length > 0 ? fields.certifications : null,
      pix_key:          fields.pix_key ? encrypt(fields.pix_key) : null,
    })
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)
    .eq('role', 'instructor')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('users')
    .update({ active: false })
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)
    .eq('role', 'instructor')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
