'use client'

// LAYER 3 — Client-side UX guard (NOT the security boundary).
//
// This component is purely for user experience: it detects sign-out events
// (e.g. session expired, signed out in another tab) and redirects the browser
// to /login without waiting for a full page refresh.
//
// ⚠️  This is NOT a security control. Client-side checks can be bypassed by
//     disabling JavaScript or inspecting the initial HTML. The actual security
//     boundary is enforced by:
//       1. middleware.ts  — rejects unauthenticated requests before the page runs
//       2. app/owner/layout.tsx — validates the JWT in the server component

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Verify the current session on mount (covers hard refresh / initial load).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login')
    })

    // Subscribe to auth state changes so a sign-out in another tab triggers
    // an immediate redirect in this one.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
    })

    return () => subscription.unsubscribe()
  }, [router])

  return <>{children}</>
}
