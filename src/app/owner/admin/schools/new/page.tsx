// Master-only page: creates a school and invites its owner.
//
// Although this page lives under /owner (which the layout guards for any
// authenticated owner or master), this page adds a tighter check: only
// master may render it. A regular owner who navigates here directly is
// redirected to /owner before any content renders.

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewSchoolForm from './NewSchoolForm'

export default async function NewSchoolPage() {
  const auth = await getAuthContext()
  if (!auth) redirect('/login')
  if (!auth.isMaster) redirect('/owner')

  return (
    <div style={{ maxWidth: '520px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Nova escola
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Cria a escola e envia um convite de acesso ao owner.
        </p>
      </div>

      <NewSchoolForm />
    </div>
  )
}
