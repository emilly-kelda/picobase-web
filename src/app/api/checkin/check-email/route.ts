import { getSchoolBySlug, findDuplicateEmail } from '@/repositories/checkinRepository'
import { NextResponse } from 'next/server'

/** Backs CheckinForm.tsx's onBlur duplicate check on the email field —
 *  see findDuplicateEmail for why this only flags an email already tied
 *  to a *different* name. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const schoolSlug = searchParams.get('school')
  const email = searchParams.get('email')?.trim()
  const name = searchParams.get('name')?.trim()

  if (!schoolSlug || !email || !name) return NextResponse.json({ duplicate: false })

  const school = await getSchoolBySlug(schoolSlug)
  if (!school) return NextResponse.json({ duplicate: false })

  const existingName = await findDuplicateEmail(school.id, email, name)
  return NextResponse.json(existingName ? { duplicate: true, existingName } : { duplicate: false })
}
