// LAYER 2 — Server Component authorization guard (secondary defense; the real authorization boundary).
//
// Middleware (layer 1) already verified that a valid Supabase session exists.
// This layer goes further: it reads public.users to confirm the role and school scope.
// No /owner content ever renders before both checks complete.

import OwnerNav from '@/components/OwnerNav'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPortalLang } from '@/lib/language'
import { getAuthContext } from '@/lib/auth'
import { getPendingBookingsCount } from '@/repositories/bookingRepository'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  // ── Authorization check ───────────────────────────────────────────────────
  // getAuthContext() validates JWT + queries public.users for role/school_id.
  // Returns null if: no session, no matching public.users row, or role not in (owner, master).
  const auth = await getAuthContext()
  if (!auth) redirect('/login')

  // auth is now narrowed:
  //   { role: 'owner', isMaster: false, schoolId: string } — scoped to one school
  //   { role: 'master', isMaster: true,  schoolId: null  } — all schools, placeholder school_id ignored

  // ── Season data for the nav ───────────────────────────────────────────────
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const [lang, { data: seasons }, pendingBookingsCount] = await Promise.all([
    getPortalLang(),
    // owner: seasons for their school only.
    // master: all seasons across all schools (school switcher is a future concern).
    auth.isMaster
      ? supabase
          .from('seasons')
          .select('id, label')
          .order('start_date', { ascending: false })
      : supabase
          .from('seasons')
          .select('id, label')
          .eq('school_id', auth.schoolId)
          .order('start_date', { ascending: false }),
    // master has no single school to scope this to — skip rather than guess.
    auth.isMaster ? Promise.resolve(0) : getPendingBookingsCount(auth.schoolId),
  ])

  const activeSeason = cookieStore.get('active_season_id')?.value ?? seasons?.[0]?.id ?? ''
  const activeLabel  = seasons?.find(s => s.id === activeSeason)?.label ?? seasons?.[0]?.label ?? '—'

  return (
    <div className="min-h-screen bg-[var(--powder)]">
      <OwnerNav
        seasons={seasons ?? []}
        activeSeasonId={activeSeason}
        activeSeasonLabel={activeLabel}
        lang={lang}
        isMaster={auth.isMaster}
        pendingBookingsCount={pendingBookingsCount}
      />
      <main style={{ width: '100%', padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  )
}

// ── How child pages consume the auth context ─────────────────────────────────
//
// React's cache() in getAuthContext() means child pages call it for free (zero
// extra DB queries — the result is reused from the layout's call):
//
//   import { getAuthContext } from '@/lib/auth'
//   const auth = await getAuthContext()   // cached — no second DB hit
//   if (!auth) redirect('/login')
//
//   const SCHOOL_ID = auth.isMaster
//     ? undefined                         // master: no filter, query all schools
//     : auth.schoolId                     // owner: filter to their school
//
// Never read school_id from cookies, query params, or the request body.
// The authoritative value is always auth.schoolId from getAuthContext().
