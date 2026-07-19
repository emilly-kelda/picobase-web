import { createServiceClient } from '@/lib/supabase-server'
import { getStudents } from '@/repositories/studentRepository'
import { encrypt } from '@/utils/crypto'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

/** Backs AddBookingModal.tsx's customer search — reception looks up a
 *  student who already filled the public check-in/waiver form (that flow
 *  find-or-creates the students row) instead of re-typing their contact
 *  info. Reuses getStudents' existing name-or-document search, just
 *  capped for a live-typing dropdown rather than the full paginated
 *  students list. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ students: [] })

  const students = await getStudents(SCHOOL_ID, q)
  return NextResponse.json({
    students: students.slice(0, 8).map(s => ({
      id: s.id, name: s.name, whatsapp: s.whatsapp,
      document_number: s.document_number, document_type: s.document_type,
    })),
  })
}

export async function POST(request: Request) {
  const { name, nationality, whatsapp } = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('students')
    .insert({
      school_id:   SCHOOL_ID,
      name:        name.trim(),
      nationality: nationality ?? null,
      whatsapp:    whatsapp ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

/** Edit form on the student profile page (/owner/students/[id]). Partial
 *  update — only fields actually present in the body are written, same
 *  pattern as api/owner/settings and api/owner/crew. whatsapp is stored
 *  as typed (trimmed only) — the Brazil country-code backfill already
 *  happens at every point of use (src/lib/whatsapp.ts), so normalizing
 *  again here would just make the stored value less readable without
 *  fixing anything. health_conditions stays encrypted at rest, same as
 *  getStudentById() decrypts on read. */
export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

  const supabase = createServiceClient()
  const update: Record<string, unknown> = {}
  if ('name' in fields)        update.name = fields.name?.trim()
  if ('email' in fields)       update.email = fields.email?.trim() || null
  if ('whatsapp' in fields)    update.whatsapp = fields.whatsapp?.trim() || null
  if ('nationality' in fields) update.nationality = fields.nationality || null
  if ('health_conditions' in fields) {
    update.health_conditions = fields.health_conditions?.trim()
      ? encrypt(fields.health_conditions.trim())
      : null
  }

  const { error } = await supabase
    .from('students')
    .update(update)
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
