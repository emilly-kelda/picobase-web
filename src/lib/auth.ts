// Auth context helper — used by LAYER 2 (server layout) and any child server component
// that needs to know the current user's role and school scope.
//
// Wrapped in React's cache() so the DB query runs at most once per render tree,
// regardless of how many server components call it.

import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'

// Discriminated union keeps TypeScript honest: master.schoolId is structurally null,
// so it can never accidentally flow into a WHERE clause.
export type AuthContext =
  | { role: 'owner'; isMaster: false; schoolId: string }
  | { role: 'master'; isMaster: true; schoolId: null }

type UserRole = 'owner' | 'master' | 'instructor' | 'partner' | 'accountant'

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient()

  // Validate JWT server-side (getUser makes a network call to Supabase Auth).
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Load role + school_id from public.users (1:1 with auth.users via id FK).
  const { data: profile, error } = await supabase
    .from('users')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null

  const role = profile.role as UserRole

  if (role === 'master') {
    // master.school_id is a placeholder (NOT NULL constraint) — never use it as a filter.
    return { role: 'master', isMaster: true, schoolId: null }
  }

  if (role === 'owner' && profile.school_id) {
    return { role: 'owner', isMaster: false, schoolId: profile.school_id as string }
  }

  // instructor / partner / accountant never hold a session — this branch is a
  // belt-and-suspenders guard. Returning null causes the layout to redirect to /login.
  return null
})
