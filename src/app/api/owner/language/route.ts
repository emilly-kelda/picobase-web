import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { lang } = await request.json()
  if (lang !== 'en' && lang !== 'pt') {
    return NextResponse.json({ error: 'invalid lang' }, { status: 400 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set('portal_lang', lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return response
}
