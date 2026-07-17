// LAYER 1 — Middleware auth guard (primary security boundary).
// Runs on the server before any page code executes.
// An unauthenticated request to /owner/** or /master/** never reaches the
// page or layout, and /master/** additionally requires role = 'master'.
//
// auth_is_master() (used in RLS policies) is a Postgres function, not
// something this Edge/Node runtime can call — the equivalent check here is
// a direct public.users role lookup, same shape as getAuthContext() uses
// server-side in master/layout.tsx. That layout guard stays in place; this
// is defense-in-depth, not a replacement for it.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // supabaseResponse is mutated by setAll so cookies are forwarded downstream.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Apply to the request object so subsequent middleware reads see them.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Rebuild the response so cookie headers are forwarded to the browser.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT with the Supabase server — never trust getSession() here
  // because it only reads cookies without verifying the token signature.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect /owner and every nested route.
  if (!user && pathname.startsWith('/owner')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect /master and every nested route — session required, and that
  // session's role must be 'master'.
  if (pathname.startsWith('/master')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'master') {
      const ownerUrl = request.nextUrl.clone()
      ownerUrl.pathname = '/owner'
      ownerUrl.searchParams.delete('next')
      return NextResponse.redirect(ownerUrl)
    }
  }

  // Redirect already-authenticated users away from /login.
  if (user && pathname === '/login') {
    const ownerUrl = request.nextUrl.clone()
    ownerUrl.pathname = '/owner'
    ownerUrl.searchParams.delete('next')
    return NextResponse.redirect(ownerUrl)
  }

  // Return supabaseResponse (not NextResponse.next()) so refreshed session cookies
  // are included in the response and the browser stays in sync.
  return supabaseResponse
}

export const config = {
  // Only run on /owner/**, /master/**, and /login — avoids unnecessary overhead on static assets.
  matcher: ['/owner/:path*', '/master/:path*', '/login'],
}
