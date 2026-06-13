import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const isPublic =
    request.nextUrl.pathname.startsWith('/checkin') ||
    request.nextUrl.pathname.startsWith('/instructor') ||
    request.nextUrl.pathname.startsWith('/partner') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/'

  if (isPublic) {
    return NextResponse.next()
  }

  // Protected routes — add auth checks here in phase 2
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}


