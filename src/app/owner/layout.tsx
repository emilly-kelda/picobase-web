// LAYER 2 — Server Component authorization guard (secondary defense; the real authorization boundary).
//
// Middleware (layer 1) already verified that a valid Supabase session exists.
// This layer goes further: it reads public.users to confirm the role and school scope.
// No /owner content ever renders before both checks complete.

import OwnerNav from '@/components/OwnerNav'
import AuthGuard from '@/components/AuthGuard'
import PendingRequestsAlert from '@/components/PendingRequestsAlert'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
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

  // A suspended school's owner never sees /owner at all — checked here rather
  // than inside getAuthContext() itself, since that function's contract
  // (role/schoolId resolution) is relied on elsewhere and shouldn't gain a
  // side effect. Master is exempt — this only applies to the owner branch.
  if (!auth.isMaster) {
    const { data: school } = await createServiceClient()
      .from('schools')
      .select('status_assinatura')
      .eq('id', auth.schoolId)
      .single()
    if (school?.status_assinatura === 'suspended') redirect('/account-suspended')
  }

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
      <AuthGuard>
        <OwnerNav
          seasons={seasons ?? []}
          activeSeasonId={activeSeason}
          activeSeasonLabel={activeLabel}
          lang={lang}
          pendingBookingsCount={pendingBookingsCount}
        >
          {children}
        </OwnerNav>
        {/* Unlike getPendingBookingsCount above, this doesn't need a real
            per-school auth.schoolId — /api/owner/lesson-requests reads the
            same hardcoded SCHOOL_ID every other /api/owner/* route already
            uses, so it resolves the same for master or owner. Gating it on
            !auth.isMaster would just make it inconsistent with the rest of
            /owner, which shows that one hardcoded school's data regardless
            of who's logged in. */}
        <PendingRequestsAlert />
      </AuthGuard>
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
