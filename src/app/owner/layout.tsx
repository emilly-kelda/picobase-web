// LAYER 2 — Server Component auth guard (secondary defense-in-depth).
// Runs after middleware passes but before any page content renders.
// Protects the entire /owner/** subtree even if the middleware matcher is ever misconfigured.
import OwnerNav from '@/components/OwnerNav'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPortalLang } from '@/lib/language'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  // getUser() validates JWT server-side; more secure than getSession() which only reads cookies.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: seasons }, lang] = await Promise.all([
    supabase
      .from('seasons')
      .select('id, label')
      .eq('school_id', SCHOOL_ID)
      .order('start_date', { ascending: false }),
    getPortalLang(),
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
      />
      <main style={{ width: '100%', padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  )
}
