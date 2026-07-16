import { getSchoolBySlug, getPackageBalanceForCheckin } from '@/repositories/checkinRepository'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const schoolSlug = searchParams.get('school')
  const name = searchParams.get('name')

  if (!schoolSlug || !name?.trim()) return NextResponse.json({ found: false })

  const school = await getSchoolBySlug(schoolSlug)
  if (!school) return NextResponse.json({ found: false })

  const balance = await getPackageBalanceForCheckin(school.id, name)
  return NextResponse.json(balance ? { found: true, ...balance } : { found: false })
}
