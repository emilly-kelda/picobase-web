import { cookies } from 'next/headers'
import { getRunwayData, getRunwayProjection, getSchool } from '@/repositories/runwayRepository'
import { getRecentSessions, getTodayStats, getPendingLessons, getMonthComparison } from '@/repositories/sessionRepository'
import { getAlerts } from '@/repositories/alertRepository'
import { getInstructors } from '@/repositories/studentRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getScheduledLessons, getMissedLessons } from '@/repositories/scheduledLessonRepository'
import { getPackageSales, getPackageBalancesForCheckins } from '@/repositories/packageRepository'
import { getMonthlyCostTotal } from '@/repositories/costRepository'
import PendingLessons from '@/components/PendingLessons'
import ScheduledLessons from '@/components/ScheduledLessons'
import MissedLessons from '@/components/MissedLessons'
import RunwaySummary from '@/components/RunwaySummary'
import AlertsDrawer from '@/components/AlertsDrawer'
import WeatherWidget from '@/components/WeatherWidget'
import DailyNoticeEditor from '@/components/DailyNoticeEditor'
import { ReceptionModeProvider } from '@/components/ReceptionModeContext'
import ReceptionModeToggle from '@/components/ReceptionModeToggle'
import MaskableValue from '@/components/MaskableValue'
import { getWeather } from '@/lib/weather'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import Link from 'next/link'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n)
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })
}

export default async function OwnerPage() {
  const cookieStore = await cookies()
  const seasonId = cookieStore.get('active_season_id')?.value

  const [
    runway, sessions, alerts, today, lang, projection,
    pending, instructors, todayLessons, tomorrowLessons,
    activities, activePackages, missedLessons, packageBalances,
    monthComparison, realMonthlyCosts, weather, school,
  ] = await Promise.all([
    getRunwayData(SCHOOL_ID, seasonId),
    getRecentSessions(SCHOOL_ID),
    getAlerts(SCHOOL_ID),
    getTodayStats(SCHOOL_ID),
    getPortalLang(),
    getRunwayProjection(SCHOOL_ID),
    getPendingLessons(SCHOOL_ID),
    getInstructors(SCHOOL_ID),
    getScheduledLessons(SCHOOL_ID, 'today'),
    getScheduledLessons(SCHOOL_ID, 'tomorrow'),
    getActivitiesForCheckin(SCHOOL_ID),
    getPackageSales(SCHOOL_ID, 50),
    getMissedLessons(SCHOOL_ID),
    getPackageBalancesForCheckins(SCHOOL_ID),
    getMonthComparison(SCHOOL_ID),
    getMonthlyCostTotal(SCHOOL_ID),
    getWeather(),
    getSchool(SCHOOL_ID),
  ])

  const t = getT(lang)

  // Real itemized costs (operational_costs, via the Custos tab) take
  // priority over the view/season's manually-set burn_rate once a school
  // has any recurring entries — same rule as runwayRepository.getRunwayProjection,
  // so this tile and the Costs simulator never disagree.
  const monthlyBurn             = realMonthlyCosts > 0 ? realMonthlyCosts : ((runway as any).burn_rate ?? 0)
  const totalPartnerCommissions = projection?.totalPartnerCommissions ?? 0
  const adjustedNetProfit       = Math.max(0, (runway.season_profit ?? 0) - totalPartnerCommissions)
  const runwayMonths            = monthlyBurn > 0
    ? adjustedNetProfit / monthlyBurn
    : (runway.winter_runway_months ?? 0)
  const gapToTarget             = Math.max(0, 6 * monthlyBurn - adjustedNetProfit)

  const instructorList = instructors.map(i => ({
    id: i.id,
    name: i.name,
    commission_pct: (i as any).commission_pct ?? null,
  }))

  const colHeaders = ['Data', 'Aluno', 'Atividade', 'Instrutor', 'Duração', 'Valor']

  return (
    <div>
      <style>{`
        .tbl-row:hover > td { background: var(--powder); }
        .tbl-link { color: var(--slate); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .15s; }
        .tbl-link:hover { border-bottom-color: var(--glacial); }
        .dash-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .dash-grid-2col { grid-template-columns: 1fr; }
        }
      `}</style>

      <AlertsDrawer alerts={alerts} />

      <ReceptionModeProvider>

      {/* Page title — the Reception Mode toggle sits inline right next to
          "Base Camp", not pushed to the row's far-right edge. That corner
          also holds AlertsDrawer's bell trigger (position: fixed, top:
          20px, right: 24px, independent of this row's layout), and a
          right-aligned toggle here lands squarely inside the bell's
          44x44px hit zone whenever there's at least one active alert. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{
              fontSize: '22px', fontWeight: '600',
              color: 'var(--slate)', letterSpacing: '-0.02em',
            }}>
              Base Camp
            </h1>
            <ReceptionModeToggle />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)', lineHeight: '1.5' }}>
            {runway.school_name
              ? `${runway.school_name}${runway.current_season ? ' · ' + runway.current_season : ''}`
              : (runway.current_season ?? t.basecamp_season)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <WeatherWidget weather={weather} />
        <DailyNoticeEditor notice={(school as any)?.daily_notice ?? null} />
      </div>

      <div className="dash-grid-2col">

        {/* ════════════════════════════════════════════════════════════
            COLUMN 1 — KPIs + today's/tomorrow's agenda
        ════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>

          {/* Today stats */}
          <div style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '600',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '16px',
            }}>
              {t.today_label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
                  Alunos
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {today.students}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
                  Aulas
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {today.sessions}
                  {monthComparison.lessonDelta !== null && monthComparison.thisMonthLessons > 0 && (
                    <span style={{
                      fontSize: '11px',
                      color: monthComparison.lessonDelta >= 0 ? '#007868' : '#DC2626',
                      marginLeft: '6px',
                    }}>
                      {monthComparison.lessonDelta >= 0 ? '▲' : '▼'}{Math.abs(monthComparison.lessonDelta).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
                  Receita
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  <MaskableValue>{fmt(today.revenue ?? 0)}</MaskableValue>
                </div>
                {monthComparison.thisMonthRevenue === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '4px' }}>
                    Início do período
                  </div>
                ) : monthComparison.revenueDelta !== null ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', marginTop: '4px',
                  }}>
                    <span style={{
                      color: monthComparison.revenueDelta >= 0 ? '#007868' : '#DC2626',
                      fontWeight: '600',
                    }}>
                      {monthComparison.revenueDelta >= 0 ? '▲' : '▼'} {Math.abs(monthComparison.revenueDelta).toFixed(1)}%
                    </span>
                    <span style={{ color: 'var(--mist)' }}>
                      vs. mês passado
                    </span>
                  </div>
                ) : monthComparison.lastMonthRevenue === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '4px' }}>
                    Primeiro mês de operação
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
                  Comissões
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  <MaskableValue>{fmt(today.commissions ?? 0)}</MaskableValue>
                </div>
              </div>
            </div>
          </div>

          {/* Agenda */}
          <ScheduledLessons
            todayLessons={todayLessons as any}
            tomorrowLessons={tomorrowLessons as any}
            activities={activities}
            instructors={instructorList}
            activePackages={(activePackages as any).filter((p: any) => p.status === 'active')}
            schoolName={runway.school_name ?? 'Pico Base'}
            schoolSlug={runway.slug ?? ''}
          />

        </div>

        {/* ════════════════════════════════════════════════════════════
            COLUMN 2 — pending items + collapsible runway
        ════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>

          <MissedLessons lessons={missedLessons as any} />
          <PendingLessons
            checkins={pending as any}
            instructors={instructorList}
            activities={activities}
            packageBalances={packageBalances}
          />

          <RunwaySummary
            runwayMonths={runwayMonths}
            seasonRevenue={runway.season_revenue ?? 0}
            commissions={(runway.crew_commissions ?? 0) + totalPartnerCommissions}
            netProfit={adjustedNetProfit}
            monthlyBurn={monthlyBurn}
            gapToTarget={gapToTarget}
            projectedRunway={projection?.projectedRunway}
            daysLeft={projection?.daysLeft}
          />

        </div>

      </div>

      </ReceptionModeProvider>

      {/* ════════════════════════════════════════════════════════════
          Recent sessions — full width, below the two columns
      ════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: '28px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '12px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
            {t.recent_sessions}
          </span>
          <Link href="/owner/sessions" style={{ fontSize: '12px', color: 'var(--mist)', textDecoration: 'none' }}>
            {t.view_all} →
          </Link>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {colHeaders.map(h => (
                <th key={h} style={{
                  padding: '10px 24px', textAlign: 'left',
                  fontSize: '10px', fontWeight: '500',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--mist)', background: 'var(--powder)',
                  borderBottom: '0.5px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  padding: '40px 24px', textAlign: 'center',
                  fontSize: '13px', color: 'var(--mist)',
                }}>
                  {t.no_sessions}
                </td>
              </tr>
            ) : sessions.slice(0, 8).map((s, i) => (
              <tr
                key={s.id}
                className="tbl-row"
                style={{ borderBottom: i < Math.min(sessions.length, 8) - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <td style={{ padding: '20px 24px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                  {fmtDate(s.session_date)}
                </td>
                <td style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                  {(s.checkins as any)?.student_name ? (
                    <a
                      className="tbl-link"
                      href={`/owner/students/name/${encodeURIComponent((s.checkins as any).student_name)}`}
                    >
                      {(s.checkins as any).student_name}
                    </a>
                  ) : '—'}
                </td>
                <td style={{ padding: '20px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                  {(s.activities as any)?.name ?? '—'}
                </td>
                <td style={{ padding: '20px 24px', fontSize: '13px', color: 'var(--mist)' }}>
                  {(s as any).instructor?.name ?? '—'}
                  {(s as any).instructor?.role === 'owner' && (
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#EDE9FE',
                      color: '#5B21B6',
                      fontSize: '10px',
                      fontWeight: '600',
                      marginLeft: '4px',
                    }}>
                      Dono
                    </span>
                  )}
                </td>
                <td style={{ padding: '20px 24px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                  {s.duration_min ? `${s.duration_min}min` : '—'}
                </td>
                <td style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {fmt(s.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
