import { getSchool, getSeasons } from '@/repositories/runwayRepository'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import SettingsClient from './SettingsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function SettingsPage() {
  const [school, seasons, lang] = await Promise.all([
    getSchool(SCHOOL_ID),
    getSeasons(SCHOOL_ID),
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
      <SettingsClient school={school} seasons={seasons} currentLang={lang} />
    </div>
  )
}
