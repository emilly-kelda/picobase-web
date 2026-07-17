import { getDocsForSchool, createDoc } from '@/repositories/financialDocRepository'
import { requireMaster } from '@/lib/masterAuth'
import { NextResponse } from 'next/server'

const DOC_TYPES = ['nota_fiscal', 'recibo', 'link_cobranca']

export async function GET(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get('school_id')
  if (!schoolId) return NextResponse.json({ error: 'Missing school_id' }, { status: 400 })

  const docs = await getDocsForSchool(schoolId)
  return NextResponse.json({ docs })
}

export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const { schoolId, docType, url, note } = await request.json()
  if (!schoolId) return NextResponse.json({ error: 'Missing schoolId' }, { status: 400 })
  if (!DOC_TYPES.includes(docType)) return NextResponse.json({ error: 'Invalid docType' }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  try {
    await createDoc({ schoolId, docType, url: url.trim(), note: note?.trim() || null, createdBy: auth.userId })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
