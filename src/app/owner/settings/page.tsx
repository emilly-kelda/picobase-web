import { getSchool, getSeasons } from '@/repositories/runwayRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import SettingsClient from './SettingsClient'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import DailyNoticeEditor from '@/components/DailyNoticeEditor'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function SettingsPage() {
  const [school, seasons, activities, lang] = await Promise.all([
    getSchool(SCHOOL_ID),
    getSeasons(SCHOOL_ID),
    getActivitiesForCheckin(SCHOOL_ID),
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
        <DailyNoticeEditor notice={(school as any)?.daily_notice ?? null} />
      </div>

      <SettingsClient school={school} seasons={seasons} activities={activities} currentLang={lang} />
    </div>
  )
}
