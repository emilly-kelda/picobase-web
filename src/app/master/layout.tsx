// Super Admin scope — entirely separate from /owner. Every route under
// /master is gated here: no session → /login, session but not master → /owner.
// Child pages don't need to repeat this check.

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MasterHeader from './MasterHeader'

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext()
  if (!auth) redirect('/login')
  if (!auth.isMaster) redirect('/owner')

  return (
    <div className="min-h-screen bg-[var(--powder)]">
      <MasterHeader />
      <main style={{ padding: '32px 40px', maxWidth: '960px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
