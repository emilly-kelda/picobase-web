import { cookies } from 'next/headers'
import { getRunwayData, getSchool } from '@/repositories/runwayRepository'
import { getRecentSessions, getTodayStats, getPendingLessons, getMonthComparison } from '@/repositories/sessionRepository'
import { getAlerts } from '@/repositories/alertRepository'
import { getInstructors } from '@/repositories/studentRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getScheduledLessons, getMissedLessons } from '@/repositories/scheduledLessonRepository'
import { getPackageSales, getPackageBalancesForCheckins, getPackages } from '@/repositories/packageRepository'
import PendingLessons from '@/components/PendingLessons'
import ScheduledLessons from '@/components/ScheduledLessons'
import MissedLessons from '@/components/MissedLessons'
import AlertsDrawer from '@/components/AlertsDrawer'
import WeatherWidget from '@/components/WeatherWidget'
import QuickSaleCard from '@/components/QuickSaleCard'
import { ReceptionModeProvider } from '@/components/ReceptionModeContext'
import ReceptionModeToggle from '@/components/ReceptionModeToggle'
import AutoRefresh from '@/components/AutoRefresh'
import MaskableValue from '@/components/MaskableValue'
import { getWeather } from '@/lib/weather'
import { formatCurrency } from '@/lib/currency'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import Link from 'next/link'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number | null | undefined) {
  return formatCurrency(n, { decimals: 2 })
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
    runway, sessions, alerts, today, lang,
    pending, instructors, todayLessons, tomorrowLessons,
    activities, activePackages, missedLessons, packageBalances,
    monthComparison, weather, school, packageTypes,
  ] = await Promise.all([
    getRunwayData(SCHOOL_ID, seasonId),
    getRecentSessions(SCHOOL_ID),
    getAlerts(SCHOOL_ID),
    getTodayStats(SCHOOL_ID),
    getPortalLang(),
    getPendingLessons(SCHOOL_ID),
    getInstructors(SCHOOL_ID),
    getScheduledLessons(SCHOOL_ID, 'today'),
    getScheduledLessons(SCHOOL_ID, 'tomorrow'),
    getActivitiesForCheckin(SCHOOL_ID),
    getPackageSales(SCHOOL_ID, 50),
    getMissedLessons(SCHOOL_ID),
    getPackageBalancesForCheckins(SCHOOL_ID),
    getMonthComparison(SCHOOL_ID),
    getWeather(),
    getSchool(SCHOOL_ID),
    getPackages(SCHOOL_ID),
  ])

  const t = getT(lang)

  const instructorList = instructors.map(i => ({
    id: i.id,
    name: i.name,
    commission_pct: (i as any).commission_pct ?? null,
  }))

  // Team occupancy for today — hours of lessons scheduled today ÷ today's
  // instructor capacity. Group lessons share one instructor/duration across
  // N students, so they're deduped by group_id first — same collapse
  // ScheduledLessons.tsx uses for its own rows — otherwise a 3-student group
  // would triple-count as 3x the instructor-hours it actually costs.
  const todayLessonsForOccupancy = todayLessons as any[]
  const individualDurations = todayLessonsForOccupancy
    .filter(l => !l.group_id)
    .map(l => l.duration_min ?? 0)
  const groupDurations = Array.from(
    new Map(
      todayLessonsForOccupancy.filter(l => l.group_id).map(l => [l.group_id, l.duration_min ?? 0])
    ).values()
  )
  const hoursScheduledToday = [...individualDurations, ...groupDurations]
    .reduce((sum, min) => sum + min, 0) / 60

  // weekly_capacity_hours is set per instructor (Crew page) — daily capacity
  // spreads it evenly across the week. Falls back to a friendly default
  // (6h/instructor/day) only when nobody has capacity configured at all,
  // rather than showing a broken 0%/blank stat.
  const FALLBACK_DAILY_HOURS_PER_INSTRUCTOR = 6
  const instructorsWithCapacity = instructors.filter(i => (i as any).weekly_capacity_hours != null)
  const dailyCapacityHours = instructorsWithCapacity.length > 0
    ? instructorsWithCapacity.reduce((sum, i) => sum + ((i as any).weekly_capacity_hours ?? 0), 0) / 7
    : instructors.length * FALLBACK_DAILY_HOURS_PER_INSTRUCTOR

  const occupancyPct = dailyCapacityHours > 0
    ? Math.round((hoursScheduledToday / dailyCapacityHours) * 100)
    : null

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
        <AutoRefresh />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <WeatherWidget weather={weather} />
        <QuickSaleCard packageTypes={packageTypes as any} />
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
                {monthComparison.thisMonthLessons === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '4px' }}>
                    Início do período
                  </div>
                )}
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

            <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0 12px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--mist)', fontWeight: '500' }}>
                Ocupação da Equipe
              </span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                {occupancyPct === null ? '—' : `${occupancyPct}%`}
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--powder)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${occupancyPct === null ? 0 : Math.min(100, Math.max(0, occupancyPct))}%`,
                background: 'var(--glacial-dark)',
                borderRadius: '99px',
                transition: 'width 0.4s ease',
              }} />
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
            schoolSlug={(school as any)?.slug ?? runway.slug ?? ''}
          />

        </div>

        {/* ════════════════════════════════════════════════════════════
            COLUMN 2 — pending items
            The Reserva de Baixa Temporada card used to sit here too — moved
            to /owner/costs (next to the interactive Simulador de Cenários,
            same real numbers) so Sala de Espera and Aulas Agendadas get the
            full column height for a receptionist working the counter.
        ════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>

          <MissedLessons
            lessons={missedLessons as any}
            instructors={instructorList}
            schoolName={runway.school_name ?? 'Pico Base'}
          />
          <PendingLessons
            checkins={pending as any}
            instructors={instructorList}
            activities={activities}
            packageBalances={packageBalances}
            payoutModel={(school as any)?.payout_model ?? 'percentage'}
            fixedPayoutValue={(school as any)?.fixed_payout_value ?? null}
            packageTypes={packageTypes as any}
            schoolSlug={(school as any)?.slug ?? runway.slug ?? ''}
            schoolName={runway.school_name ?? 'Pico Base'}
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
