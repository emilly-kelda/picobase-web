import { getSchool, getSeasons } from '@/repositories/runwayRepository'
import { createServiceClient } from '@/lib/supabase-server'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import SettingsClient from './SettingsClient'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import SeasonLaunchChecklist from '@/components/SeasonLaunchChecklist'
import DailyNoticeEditor from '@/components/DailyNoticeEditor'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function SettingsPage() {
  const supabase = createServiceClient()

  const [school, seasons, lang, { count: instructorCount }, { count: partnerCount }, { count: sessionCount }] = await Promise.all([
    getSchool(SCHOOL_ID),
    getSeasons(SCHOOL_ID),
    getPortalLang(),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', SCHOOL_ID).eq('role', 'instructor'),
    supabase.from('partners').select('*', { count: 'exact', head: true }).eq('school_id', SCHOOL_ID).eq('active', true),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('school_id', SCHOOL_ID),
  ])

  const t = getT(lang)

  const checklistItems = [
    {
      label: 'Escola configurada',
      done:  !!school?.name,
      sub:   school?.name ?? 'Nome da escola não definido',
    },
    {
      label: 'Primeiro instrutor adicionado',
      done:  (instructorCount ?? 0) > 0,
      sub:   `${instructorCount ?? 0} instrutor${(instructorCount ?? 0) !== 1 ? 'es' : ''} configurado${(instructorCount ?? 0) !== 1 ? 's' : ''}`,
      href:  '/owner/crew',
    },
    {
      label: 'Parceiros configurados',
      done:  (partnerCount ?? 0) > 0,
      sub:   (partnerCount ?? 0) > 0
        ? `${partnerCount} parceiro${(partnerCount ?? 0) !== 1 ? 's' : ''} ativo${(partnerCount ?? 0) !== 1 ? 's' : ''}`
        : 'Hotéis, agências e operadores de turismo',
      href:  '/owner/crew',
    },
    {
      label: 'Custo operacional mensal definido',
      done:  !!(school?.burn_rate),
      sub:   'Necessário para calcular a Reserva de Baixa Temporada',
      href:  '/owner/settings',
    },
    {
      label: 'Waiver configurado',
      done:  school?.waiver_type === 'file'
        ? !!(school?.waiver_file_global_url) || Object.keys(school?.waiver_files_by_lang ?? {}).length > 0
        : !!(school?.waiver_pt),
      sub:   'Termo de responsabilidade para os alunos',
      href:  '/owner/settings',
    },
    {
      label: 'Primeira aula confirmada',
      done:  (sessionCount ?? 0) > 0,
      sub:   (sessionCount ?? 0) > 0
        ? `${sessionCount} aula${(sessionCount ?? 0) !== 1 ? 's' : ''} confirmada${(sessionCount ?? 0) !== 1 ? 's' : ''}`
        : 'Confirme a primeira aula pelo Spot',
      href:  '/owner',
    },
  ]

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

      <SeasonLaunchChecklist items={checklistItems} />

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

      <SettingsClient school={school} seasons={seasons} currentLang={lang} />
    </div>
  )
}
