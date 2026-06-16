import { cookies } from 'next/headers'
import { getRunwayData, getRunwayProjection } from '@/repositories/runwayRepository'
import { getRecentSessions, getTodayStats, getPendingLessons } from '@/repositories/sessionRepository'
import { getAlerts } from '@/repositories/alertRepository'
import { getInstructors } from '@/repositories/studentRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getScheduledLessons, getMissedLessons } from '@/repositories/scheduledLessonRepository'
import { getPackageSales } from '@/repositories/packageRepository'
import PendingLessons from '@/components/PendingLessons'
import ScheduledLessons from '@/components/ScheduledLessons'
import MissedLessons from '@/components/MissedLessons'
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
    activities, activePackages, missedLessons,
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
  ])

  const t = getT(lang)

  const runwayMonths = runway.winter_runway_months ?? 0
  const monthlyBurn  = (runway as any).burn_rate ?? 0
  const gapToTarget  = Math.max(0, 6 * monthlyBurn - (runway.season_revenue ?? 0))

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
        .tbl-row:hover > td { background: #FAFAF8; }
        .tbl-link { color: #1A1C22; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .15s; }
        .tbl-link:hover { border-bottom-color: #00A896; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px', fontWeight: '600',
          color: '#1A1C22', letterSpacing: '-0.02em',
          marginBottom: '4px',
        }}>
          Base Camp
        </h1>
        <div style={{ fontSize: '13px', color: '#8A8C98' }}>
          {runway.school_name
            ? `${runway.school_name}${runway.current_season ? ' · ' + runway.current_season : ''}`
            : (runway.current_season ?? t.basecamp_season)}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '32px',
        alignItems: 'flex-start',
      }}>

        {/* ════════════════════════════════════════════════════════════════
            LEFT — main flow
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div style={{
              background: '#F0EEE9',
              borderRadius: '12px',
              padding: '16px 20px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '500',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#8A8C98', marginBottom: '12px',
              }}>
                {lang === 'pt' ? 'Atenção' : 'Alerts'}
              </div>
              {alerts.map((alert, i) => (
                <a
                  key={i}
                  href={alert.link ?? '#'}
                  style={{
                    display: 'flex', alignItems: 'flex-start',
                    gap: '10px', textDecoration: 'none',
                    paddingBottom: i < alerts.length - 1 ? '10px' : '0',
                    marginBottom: i < alerts.length - 1 ? '10px' : '0',
                    borderBottom: i < alerts.length - 1 ? '0.5px solid #E4E0D8' : 'none',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: alert.type === 'error' ? '#E8471A' : '#D4A017',
                    marginTop: '5px', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '13px', color: '#1A1C22', lineHeight: '1.5' }}>
                    {alert.message}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Missed / Pending / Scheduled */}
          <MissedLessons lessons={missedLessons as any} lang={lang} />
          <PendingLessons checkins={pending as any} instructors={instructorList} />
          <ScheduledLessons
            todayLessons={todayLessons as any}
            tomorrowLessons={tomorrowLessons as any}
            activities={activities}
            instructors={instructorList}
            activePackages={(activePackages as any).filter((p: any) => p.status === 'active')}
          />

          {/* Sessions table */}
          <div style={{
            background: '#fff',
            border: '0.5px solid #E4E0D8',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '0.5px solid #F0EEE9',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#1A1C22' }}>
                {t.recent_sessions}
              </span>
              <Link href="/owner/sessions" style={{ fontSize: '12px', color: '#8A8C98', textDecoration: 'none' }}>
                {t.view_all}
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
                      color: '#8A8C98', background: '#FAFAF8',
                      borderBottom: '0.5px solid #F0EEE9',
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
                      fontSize: '13px', color: '#8A8C98',
                    }}>
                      {t.no_sessions}
                    </td>
                  </tr>
                ) : sessions.slice(0, 8).map((s, i) => (
                  <tr
                    key={s.id}
                    className="tbl-row"
                    style={{ borderBottom: i < Math.min(sessions.length, 8) - 1 ? '0.5px solid #F0EEE9' : 'none' }}
                  >
                    <td style={{ padding: '20px 24px', fontSize: '12px', color: '#8A8C98', whiteSpace: 'nowrap' }}>
                      {fmtDate(s.session_date)}
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '500', color: '#1A1C22' }}>
                      {(s.checkins as any)?.student_name ? (
                        <a
                          className="tbl-link"
                          href={`/owner/students?search=${encodeURIComponent((s.checkins as any).student_name)}`}
                        >
                          {(s.checkins as any).student_name}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '13px', color: '#1A1C22' }}>
                      {(s.activities as any)?.name ?? '—'}
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '13px', color: '#8A8C98' }}>
                      {(s as any).instructor?.name ?? '—'}
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '13px', color: '#8A8C98', whiteSpace: 'nowrap' }}>
                      {s.duration_min ? `${s.duration_min}min` : '—'}
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '500', color: '#1A1C22', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {fmt(s.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT — metrics sidebar
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Runway card */}
          <div style={{
            background: '#1B4B5A',
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
              fontSize: '72px', fontWeight: '700',
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

            <div style={{
              height: '1px', background: 'rgba(255,255,255,0.1)',
              marginBottom: '20px',
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                  {lang === 'pt' ? 'Receita da temporada' : 'Season revenue'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(runway.season_revenue ?? 0)}
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
                  fontSize: '12px', color: '#D4A017',
                  lineHeight: '1.5',
                }}>
                  {lang === 'pt'
                    ? `Faltam ${fmt(gapToTarget)} para 6 meses`
                    : `${fmt(gapToTarget)} short of 6 months`}
                </div>
              )}
            </div>
          </div>

          {/* Today card */}
          <div style={{
            background: '#fff',
            border: '0.5px solid #E4E0D8',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#8A8C98', marginBottom: '20px',
            }}>
              {t.today_label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: lang === 'pt' ? 'Alunos'    : 'Students',    value: String(today.students) },
                { label: lang === 'pt' ? 'Aulas'     : 'Sessions',    value: String(today.sessions) },
                { label: lang === 'pt' ? 'Receita'   : 'Revenue',     value: fmt(today.revenue ?? 0) },
                { label: lang === 'pt' ? 'Comissões' : 'Commissions', value: fmt(today.commissions ?? 0) },
              ].map((item, i, arr) => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < arr.length - 1 ? '0.5px solid #F0EEE9' : 'none',
                }}>
                  <span style={{ fontSize: '13px', color: '#8A8C98' }}>{item.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1A1C22', fontVariantNumeric: 'tabular-nums' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Season card */}
          <div style={{
            background: '#fff',
            border: '0.5px solid #E4E0D8',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#8A8C98', marginBottom: '16px',
            }}>
              {t.season_label}
            </div>
            {runway.current_season && (
              <div style={{
                fontSize: '14px', fontWeight: '500',
                color: '#1A1C22', marginBottom: '16px',
              }}>
                {runway.current_season}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: lang === 'pt' ? 'Receita total'  : 'Total revenue',  value: fmt(runway.season_revenue) },
                { label: lang === 'pt' ? 'Comissões'      : 'Commissions',    value: fmt(runway.crew_commissions) },
                { label: lang === 'pt' ? 'Lucro líquido'  : 'Net profit',     value: fmt(runway.season_profit) },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < arr.length - 1 ? '0.5px solid #F0EEE9' : 'none',
                }}>
                  <span style={{ fontSize: '12px', color: '#8A8C98' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#1A1C22', fontVariantNumeric: 'tabular-nums' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Projection note */}
          {projection && projection.daysLeft > 0 && (
            <div style={{
              background: '#F0EEE9',
              borderRadius: '12px',
              padding: '16px 20px',
              fontSize: '12px',
              color: '#8A8C98',
              lineHeight: '1.6',
            }}>
              <span style={{ fontWeight: '500', color: '#1A1C22' }}>
                {lang === 'pt' ? 'Projeção: ' : 'Projection: '}
              </span>
              {lang === 'pt'
                ? `${projection.projectedRunway.toFixed(1)} meses ao fim da temporada · ${projection.daysLeft} dias restantes`
                : `${projection.projectedRunway.toFixed(1)} months at season end · ${projection.daysLeft} days left`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
