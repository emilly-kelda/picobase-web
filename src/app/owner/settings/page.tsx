import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { getSchool, getSeasons } from '@/repositories/runwayRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import SettingsClient from './SettingsClient'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import DailyNoticeEditor from '@/components/DailyNoticeEditor'
import PaymentIntegrationCard from './PaymentIntegrationCard'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  // owner/layout.tsx already redirects to /login when there's no session at
  // all — by the time a child page renders, auth is guaranteed non-null.
  // The only case left to handle here is unscoped master (no school of
  // their own, and not currently impersonating one via /master's "Acessar").
  const auth = await getAuthContext()
  const schoolId = auth!.isMaster ? auth!.impersonatingSchoolId : auth!.schoolId
  if (!schoolId) redirect('/master')

  const { status } = await searchParams

  const [school, seasons, activities, lang] = await Promise.all([
    getSchool(schoolId),
    getSeasons(schoolId),
    getActivitiesForCheckin(schoolId),
    getPortalLang(),
  ])

  const t = getT(lang)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          {t.settings_title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          {t.settings_sub}
        </p>
      </div>

      <QRCodeDisplay
        slug={school?.slug ?? 'escola'}
        schoolName={school?.name ?? 'Escola'}
      />

      {/* Moved from Spot's dashboard — that slot now hosts Venda
          Rápida. The instructor-facing page (/instructor/[school]) still
          reads school.daily_notice, so editing stays available here. */}
      <div style={{ marginBottom: '24px' }}>
        <DailyNoticeEditor notice={school?.daily_notice ?? null} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <PaymentIntegrationCard initialStatus={status === 'mp_connected' || status === 'mp_error' ? status : null} />
      </div>

      <SettingsClient school={school} seasons={seasons} activities={activities} currentLang={lang} />
    </div>
  )
}
