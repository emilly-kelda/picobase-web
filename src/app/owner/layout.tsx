import OwnerSidebar from '@/components/OwnerSidebar'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPortalLang } from '@/lib/language'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const [{ data: seasons }] = await Promise.all([
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
    <div className="flex min-h-screen bg-[var(--powder)]">
      <OwnerSidebar schoolName={activeLabel} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1080px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
