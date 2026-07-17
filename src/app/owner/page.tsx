import { cookies } from 'next/headers'
import { getRunwayData, getRunwayProjection } from '@/repositories/runwayRepository'
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
import RunwayCalculator from '@/components/RunwayCalculator'
import AlertsDrawer from '@/components/AlertsDrawer'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import Link from 'next/link'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
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
    monthComparison, realMonthlyCosts,
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
  ])

  const t = getT(lang)

  // Real itemized costs (operational_costs, via the Custos tab) take
  // priority over the view/season's manually-set burn_rate once a school
  // has any recurring entries — same rule as runwayRepository.getRunwayProjection,
  // so this tile and the Runway Calculator never disagree.
  const monthlyBurn             = realMonthlyCosts > 0 ? realMonthlyCosts : ((runway as any).burn_rate ?? 0)
  const totalPartnerCommissions = projection?.totalPartnerCommissions ?? 0
  const adjustedNetProfit       = Math.max(0, (runway.season_profit ?? 0) - totalPartnerCommissions)
  const runwayMonths            = monthlyBurn > 0
    ? adjustedNetProfit / monthlyBurn
    : (runway.winter_runway_months ?? 0)
  const gapToTarget             = Math.max(0, 6 * monthlyBurn - adjustedNetProfit)

  console.log(
    '[runway] season_profit=%s  burn_rate=%s  → computed=%s months  (db.winter_runway_months=%s)',
    runway.season_profit,
    monthlyBurn,
    monthlyBurn > 0 ? ((runway.season_profit ?? 0) / monthlyBurn).toFixed(2) : 'n/a',
    runway.winter_runway_months,
  )

  const instructorList = instructors.map(i => ({
    id: i.id,
    name: i.name,
    commission_pct: (i as any).commission_pct ?? null,
  }))

  const colHeaders = lang === 'pt'
    ? ['Data', 'Aluno', 'Atividade', 'Instrutor', 'Duração', 'Valor']
    : ['Date', 'Student', 'Activity', 'Instructor', 'Duration', 'Price']

  return (
    <div>
      <style>{`
        .tbl-row:hover > td { background: var(--powder); }
        .tbl-link { color: var(--slate); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .15s; }
        .tbl-link:hover { border-bottom-color: var(--glacial); }
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 1080px) {
          .dash-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <AlertsDrawer alerts={alerts} lang={lang} />

      <div className="dash-grid">

        {/* ════════════════════════════════════════════════════════════
            LEFT — identity + today's numbers
        ════════════════════════════════════════════════════════════ */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Page title */}
          <div>
            <h1 style={{
              fontSize: '22px', fontWeight: '600',
              color: 'var(--slate)', letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}>
              Base Camp
            </h1>
            <div style={{ fontSize: '12px', color: 'var(--mist)', lineHeight: '1.5' }}>
              {runway.school_name
                ? `${runway.school_name}${runway.current_season ? ' · ' + runway.current_season : ''}`
                : (runway.current_season ?? t.basecamp_season)}
            </div>
          </div>

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
                  {lang === 'pt' ? 'Alunos' : 'Students'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {today.students}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
                  {lang === 'pt' ? 'Aulas' : 'Sessions'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {today.sessions}
                  {monthComparison.lessonDelta !== null && (
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
                  {lang === 'pt' ? 'Receita' : 'Revenue'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(today.revenue ?? 0)}
                </div>
                {monthComparison.revenueDelta !== null && (
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
                      {lang === 'pt' ? 'vs. mês passado' : 'vs. last month'}
                    </span>
                  </div>
                )}
                {monthComparison.revenueDelta === null && monthComparison.lastMonthRevenue === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '4px' }}>
                    {lang === 'pt' ? 'Primeiro mês de operação' : 'First month of operation'}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
                  {lang === 'pt' ? 'Comissões' : 'Commissions'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(today.commissions ?? 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Runway Calculator — interactive slider widget, left column */}
          <RunwayCalculator
            seasonProfit={adjustedNetProfit}
            burnRate={monthlyBurn}
            daysLeft={projection?.daysLeft}
            projectedRunway={projection?.projectedRunway}
            gap={projection?.gap}
          />

        </aside>

        {/* ════════════════════════════════════════════════════════════
            CENTER — activity feed
        ════════════════════════════════════════════════════════════ */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>

          {/* Missed / Pending / Scheduled */}
          <MissedLessons lessons={missedLessons as any} lang={lang} />
          <PendingLessons
            checkins={pending as any}
            instructors={instructorList}
            activities={activities}
            packageBalances={packageBalances}
            lang={lang}
          />
          <ScheduledLessons
            todayLessons={todayLessons as any}
            tomorrowLessons={tomorrowLessons as any}
            activities={activities}
            instructors={instructorList}
            activePackages={(activePackages as any).filter((p: any) => p.status === 'active')}
          />

          {/* Sessions table */}
          <div>
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

        </main>

        {/* ════════════════════════════════════════════════════════════
            RIGHT — financial metrics + runway
        ════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Off-Season Runway */}
          <div style={{
            background: 'var(--ocean-deep)',
            borderRadius: '16px',
            padding: '28px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)', marginBottom: '16px',
            }}>
              {lang === 'pt' ? 'Reserva de Baixa Temporada' : 'Off-Season Runway'}
            </div>

            <div style={{
              fontSize: '64px', fontWeight: '700',
              color: '#fff', lineHeight: '1',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em', marginBottom: '6px',
            }}>
              {runwayMonths > 0 ? runwayMonths.toFixed(1) : '—'}
            </div>

            <div style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.4)',
              marginBottom: '24px',
            }}>
              {lang === 'pt' ? 'meses cobertos' : 'months covered'}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                  {lang === 'pt' ? 'Receita da temporada' : 'Season revenue'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(runway.season_revenue ?? 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                  {lang === 'pt' ? 'Comissões pagas' : 'Commissions paid'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(220,100,100,0.8)', fontVariantNumeric: 'tabular-nums' }}>
                  − {fmt((runway.crew_commissions ?? 0) + totalPartnerCommissions)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
                  {lang === 'pt' ? 'Lucro líquido' : 'Net profit'}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(adjustedNetProfit)}
                </span>
              </div>
              {monthlyBurn > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                    {lang === 'pt' ? 'Custo mensal' : 'Monthly burn'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(monthlyBurn)}
                  </span>
                </div>
              )}
              {runwayMonths < 6 && gapToTarget > 0 && (
                <div style={{
                  marginTop: '4px', padding: '10px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  fontSize: '12px', color: 'var(--warning)',
                  lineHeight: '1.5',
                }}>
                  {lang === 'pt'
                    ? `Faltam ${fmt(gapToTarget)} para 6 meses`
                    : `${fmt(gapToTarget)} short of 6 months`}
                </div>
              )}
            </div>
          </div>

          {/* Season totals */}
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
              color: 'var(--mist)',
              marginBottom: runway.current_season ? '4px' : '16px',
            }}>
              {t.season_label}
            </div>
            {runway.current_season && (
              <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '16px' }}>
                {runway.current_season}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: lang === 'pt' ? 'Receita total'  : 'Total revenue',  value: fmt(runway.season_revenue) },
                { label: lang === 'pt' ? 'Comissões'      : 'Commissions',    value: fmt((runway.crew_commissions ?? 0) + totalPartnerCommissions) },
                { label: lang === 'pt' ? 'Lucro líquido'  : 'Net profit',     value: fmt(adjustedNetProfit) },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11px', color: 'var(--mist)', fontWeight: '500' }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Projection */}
          {projection && projection.daysLeft > 0 && (
            <div style={{
              background: 'var(--powder-dark)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              fontSize: '12px',
              color: 'var(--mist)',
              lineHeight: '1.6',
            }}>
              <span style={{ fontWeight: '500', color: 'var(--slate)' }}>
                {lang === 'pt' ? 'Projeção: ' : 'Projection: '}
              </span>
              {lang === 'pt'
                ? `${projection.projectedRunway.toFixed(1)} meses ao fim da temporada · ${projection.daysLeft} dias restantes`
                : `${projection.projectedRunway.toFixed(1)} months at season end · ${projection.daysLeft} days left`}
            </div>
          )}

        </section>

      </div>
    </div>
  )
}
