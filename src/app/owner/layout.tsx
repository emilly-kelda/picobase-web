// LAYER 2 — Server Component authorization guard (secondary defense; the real authorization boundary).
//
// Middleware (layer 1) already verified that a valid Supabase session exists.
// This layer goes further: it reads public.users to confirm the role and school scope.
// No /owner content ever renders before both checks complete.

import OwnerNav from '@/components/OwnerNav'
import AuthGuard from '@/components/AuthGuard'
import PendingRequestsAlert from '@/components/PendingRequestsAlert'
import ImpersonationBanner from '@/components/owner/ImpersonationBanner'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPortalLang } from '@/lib/language'
import { getAuthContext } from '@/lib/auth'
import { getPendingBookingsCount } from '@/repositories/bookingRepository'
import { getAlerts } from '@/repositories/alertRepository'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  // ── Authorization check ───────────────────────────────────────────────────
  // getAuthContext() validates JWT + queries public.users for role/school_id.
  // Returns null if: no session, no matching public.users row, or role not in (owner, master).
  const auth = await getAuthContext()
  if (!auth) redirect('/login')

  // auth is now narrowed:
  //   { role: 'owner', isMaster: false, schoolId: string } — scoped to one school
  //   { role: 'master', isMaster: true, schoolId: null, impersonatingSchoolId: string|null }
  //     — no school of their own; impersonatingSchoolId is set while master
  //     is "viewing as" a specific school (see src/app/api/master/impersonate).

  // operationalSchoolId is what actually drives this page: a real owner's
  // own school, or the school master is currently impersonating. Unscoped
  // master (isMaster && no impersonation) has none — every branch below
  // that used to check `!auth.isMaster` now checks this instead, so an
  // impersonating master gets the exact same scoped experience a real owner
  // of that school would.
  const operationalSchoolId = auth.isMaster ? auth.impersonatingSchoolId : auth.schoolId

  // Suspended school's owner never sees /owner at all — checked here rather
  // than inside getAuthContext() itself, since that function's contract
  // (role/schoolId resolution) is relied on elsewhere and shouldn't gain a
  // side effect. Unscoped master is exempt — nothing to check.
  let impersonatedSchoolName: string | null = null
  if (operationalSchoolId) {
    const { data: school } = await createServiceClient()
      .from('schools')
      .select('name, status_assinatura')
      .eq('id', operationalSchoolId)
      .single()
    if (school?.status_assinatura === 'suspended') redirect('/account-suspended')
    if (auth.isMaster) impersonatedSchoolName = school?.name ?? 'Escola'
  }

  // ── Season data for the nav ───────────────────────────────────────────────
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const [lang, { data: seasons }, pendingBookingsCount, pulseAlerts] = await Promise.all([
    getPortalLang(),
    // Scoped (real owner, or master impersonating one school): seasons for
    // that school only. Unscoped master: all seasons across every school
    // (school switcher is a future concern).
    operationalSchoolId
      ? supabase
          .from('seasons')
          .select('id, label')
          .eq('school_id', operationalSchoolId)
          .order('start_date', { ascending: false })
      : supabase
          .from('seasons')
          .select('id, label')
          .order('start_date', { ascending: false }),
    // Unscoped master has no single school to scope this to — skip rather than guess.
    operationalSchoolId ? getPendingBookingsCount(operationalSchoolId) : Promise.resolve(0),
    // Same unscoped-master exemption as pendingBookingsCount above.
    operationalSchoolId ? getAlerts(operationalSchoolId) : Promise.resolve([]),
  ])

  const activeSeason = cookieStore.get('active_season_id')?.value ?? seasons?.[0]?.id ?? ''
  const activeLabel  = seasons?.find(s => s.id === activeSeason)?.label ?? seasons?.[0]?.label ?? '—'

  return (
    <div className="min-h-screen bg-[var(--powder)]">
      {auth.isMaster && impersonatedSchoolName && (
        <ImpersonationBanner schoolName={impersonatedSchoolName} />
      )}
      <AuthGuard>
        <OwnerNav
          seasons={seasons ?? []}
          activeSeasonId={activeSeason}
          activeSeasonLabel={activeLabel}
          lang={lang}
          pendingBookingsCount={pendingBookingsCount}
          pulseCount={pulseAlerts.length}
        >
          {children}
        </OwnerNav>
        {/* /api/owner/lesson-requests now requires a real session and scopes
            to getSchoolContext()'s resolved school (owner's own, or master's
            impersonated one) — unscoped master gets a 403 from it, which
            this component already treats as "no pending requests" (see its
            own poll()'s `data.requests ?? []`), so no gating needed here. */}
        <PendingRequestsAlert />
      </AuthGuard>
    </div>
  )
}

// ── How child pages/routes consume the auth context ───────────────────────────
//
// React's cache() in getAuthContext() means server components call it for
// free (zero extra DB queries — the result is reused from the layout's call).
// API routes (a separate request, so no cache() reuse) should use the
// dedicated wrapper instead, which also turns "no session"/"unscoped master"
// into the right HTTP response for you:
//
//   import { getSchoolContext } from '@/lib/auth/get-school-context'
//   const school = await getSchoolContext()
//   if (!school.ok) return school.response
//   // school.ctx.schoolId — the real owner's school, or master's
//   // currently-impersonated one; never present for unscoped master.
//
// Never read school_id from cookies, query params, or the request body
// directly. The authoritative value always comes from getAuthContext() /
// getSchoolContext() — never trust a client-supplied school id.
