// Public, no-login page for the team to check today's notice — mirrors the
// /checkin/[school] and /book/[school] convention (public page keyed by
// school slug) rather than requiring a real instructor account, since no
// live instructor login/dashboard exists anywhere in this app yet (the
// /instructor/{sessions,students,receipts} pages are unbuilt placeholders,
// and /instructor itself just redirects to /login — this route is
// deliberately new and separate from that dead code, not wired into it).

import { getSchoolBySlug } from '@/repositories/checkinRepository'
import { notFound } from 'next/navigation'

export default async function InstructorNoticePage({
  params,
}: {
  params: Promise<{ school: string }>
}) {
  const { school: slug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const notice = (school as any).daily_notice as string | null

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--powder)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '600',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--mist)', marginBottom: '8px', textAlign: 'center',
        }}>
          {school.name}
        </div>
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
          padding: '28px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>📌</div>
          <div style={{
            fontSize: '13px', fontWeight: '600',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '12px',
          }}>
            Mural da Equipe
          </div>
          {notice ? (
            <div style={{ fontSize: '15px', color: 'var(--slate)', lineHeight: '1.6' }}>
              {notice}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
              Nenhum aviso no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
