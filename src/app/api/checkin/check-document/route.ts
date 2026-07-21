import { getSchoolBySlug, findDuplicateDocument } from '@/repositories/checkinRepository'
import { NextResponse } from 'next/server'

/** Backs CheckinForm.tsx's onBlur duplicate check on the CPF/passport
 *  field — see findDuplicateDocument for why this only flags a document
 *  already tied to a *different* name. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const schoolSlug = searchParams.get('school')
  const documentNumber = searchParams.get('document_number')?.trim()
  const name = searchParams.get('name')?.trim()

  if (!schoolSlug || !documentNumber || !name) return NextResponse.json({ duplicate: false })

  const school = await getSchoolBySlug(schoolSlug)
  if (!school) return NextResponse.json({ duplicate: false })

  const existingName = await findDuplicateDocument(school.id, documentNumber, name)
  return NextResponse.json(existingName ? { duplicate: true, existingName } : { duplicate: false })
}
