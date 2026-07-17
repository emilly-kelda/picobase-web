// Creates a school and invites its owner. Master-only — enforced by
// src/app/master/layout.tsx, which redirects any non-master caller before
// this (or any other /master route) ever renders.

import NewSchoolForm from './NewSchoolForm'

export default function NewSchoolPage() {
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
