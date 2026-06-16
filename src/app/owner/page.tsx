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
import { Plus, Users, Banknote, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

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

  const runwayMonths  = runway.winter_runway_months ?? 0
  const barPct        = Math.min(100, (runwayMonths / (projection?.targetMonths ?? 6)) * 100)
  const runwayColor   = runwayMonths >= 6 ? '#00A896' : runwayMonths >= 3 ? '#D4A017' : '#E8471A'
  const runwayLabel   = runwayMonths >= 6
    ? (lang === 'pt' ? 'Saudável' : 'Healthy')
    : runwayMonths >= 3
      ? (lang === 'pt' ? 'Atenção' : 'Caution')
      : (lang === 'pt' ? 'Em risco' : 'At risk')

  const instructorList = instructors.map(i => ({
    id: i.id,
    name: i.name,
    commission_pct: (i as any).commission_pct ?? null,
  }))

  return (
    <div>
      <style>{`.tbl-link{color:var(--slate);text-decoration:none;border-bottom:1px solid transparent;transition:border-color .15s}.tbl-link:hover{border-bottom-color:var(--glacial)}`}</style>

      {/* ── 2-COLUMN GRID ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_272px] gap-6 items-start">

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT COLUMN — main flow
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-5 min-w-0">

          {/* Page title */}
          <div>
            <h1 className="text-[22px] font-semibold text-[var(--slate)] mb-0.5">
              Base Camp
            </h1>
            <p className="text-[13px] text-[var(--mist)]">
              {runway.current_season ?? t.basecamp_season}
              {runway.school_name ? ` · ${runway.school_name}` : ''}
            </p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                href:  '/owner/sessions',
                icon:  Plus,
                label: lang === 'pt' ? 'Nova aula' : 'New lesson',
                sub:   lang === 'pt' ? 'Confirmar check-in' : 'Confirm check-in',
                accent: true,
              },
              {
                href:  '/owner/crew',
                icon:  Users,
                label: lang === 'pt' ? 'Equipe' : 'Team',
                sub:   lang === 'pt' ? 'Instrutores e parceiros' : 'Instructors & partners',
                accent: false,
              },
              {
                href:  '/owner/payments',
                icon:  Banknote,
                label: lang === 'pt' ? 'Financeiro' : 'Financials',
                sub:   lang === 'pt' ? 'Repasses e fechamento' : 'Payouts & close',
                accent: false,
              },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className={[
                  'group flex items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-sm',
                  action.accent
                    ? 'bg-[var(--signal)] border-[var(--signal)] text-white hover:bg-[#C93810]'
                    : 'bg-white border-[var(--border)] hover:border-[var(--glacial-light)]',
                ].join(' ')}
              >
                <span className={[
                  'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                  action.accent
                    ? 'bg-white/15'
                    : 'bg-[var(--glacial-light)]',
                ].join(' ')}>
                  <action.icon
                    size={14}
                    className={action.accent ? 'text-white' : 'text-[var(--glacial-dark)]'}
                  />
                </span>
                <div>
                  <div className={`text-[13px] font-semibold ${action.accent ? 'text-white' : 'text-[var(--slate)]'}`}>
                    {action.label}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${action.accent ? 'text-white/70' : 'text-[var(--mist)]'}`}>
                    {action.sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Health alerts from DB */}
          {alerts.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
              {alerts.map((alert, i) => {
                const dot =
                  alert.type === 'error'   ? 'var(--signal)' :
                  alert.type === 'warning' ? '#D4A017' :
                  'var(--glacial)'
                const color =
                  alert.type === 'error'   ? 'var(--signal-dark)' :
                  alert.type === 'warning' ? 'var(--amber)' :
                  'var(--glacial-dark)'
                return (
                  <a
                    key={i}
                    href={alert.link ?? '#'}
                    className="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-[var(--powder)] transition-colors"
                    style={{ borderBottom: i < alerts.length - 1 ? '0.5px solid var(--border)' : 'none' }}
                  >
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ background: dot }}
                    />
                    <span className="flex-1 text-[13px] truncate" style={{ color }}>
                      {alert.message}
                    </span>
                    <span className="text-[11px] text-[var(--border-strong)] shrink-0">→</span>
                  </a>
                )
              })}
            </div>
          )}

          {/* Status chips for key counts */}
          {(missedLessons.length > 0 || pending.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {missedLessons.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--signal-light)] border border-[var(--signal)] px-3 py-1 text-[11px] font-medium text-[var(--signal-dark)]">
                  <AlertCircle size={11} />
                  {missedLessons.length} {lang === 'pt' ? 'aula(s) não realizada(s)' : 'missed lesson(s)'}
                </span>
              )}
              {pending.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--glacial-light)] border border-[#B2E8E3] px-3 py-1 text-[11px] font-medium text-[var(--glacial-dark)]">
                  <Clock size={11} />
                  {pending.length} {lang === 'pt' ? 'check-in(s) pendente(s)' : 'pending check-in(s)'}
                </span>
              )}
              {today.sessions > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--powder)] border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--mist)]">
                  <CheckCircle2 size={11} />
                  {today.sessions} {lang === 'pt' ? 'aula(s) hoje' : 'session(s) today'}
                </span>
              )}
            </div>
          )}

          {/* Missed lessons */}
          <MissedLessons lessons={missedLessons as any} lang={lang} />

          {/* Pending checkins */}
          <PendingLessons
            checkins={pending as any}
            instructors={instructorList}
          />

          {/* Scheduled lessons (today + tomorrow) */}
          <ScheduledLessons
            todayLessons={todayLessons as any}
            tomorrowLessons={tomorrowLessons as any}
            activities={activities}
            instructors={instructorList}
            activePackages={(activePackages as any).filter((p: any) => p.status === 'active')}
          />

          {/* Recent sessions table */}
          <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
              <span className="text-[14px] font-medium text-[var(--slate)]">
                {t.recent_sessions}
              </span>
              <a href="/owner/sessions" className="text-[12px] text-[var(--glacial)] no-underline hover:underline">
                {t.view_all}
              </a>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {[t.th_date, t.th_student, t.th_activity, t.th_instructor, t.th_duration, t.th_price, t.th_commission].map(h => (
                    <th key={h} style={{
                      padding: '9px 20px', textAlign: 'left',
                      fontSize: '11px', fontWeight: '500',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
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
                    <td colSpan={7} style={{ padding: '36px 20px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                      {t.no_sessions}
                    </td>
                  </tr>
                ) : (
                  sessions.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: i < sessions.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                        {fmtDate(s.session_date)}
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                        {(s.checkins as any)?.student_name ? (
                          <a
                            className="tbl-link"
                            href={`/owner/students?search=${encodeURIComponent((s.checkins as any).student_name)}`}
                          >
                            {(s.checkins as any).student_name}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                        {(s.activities as any)?.name ?? '—'}
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--slate)' }}>
                        {(s as any).instructor?.name ?? '—'}
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                        {s.duration_min ? `${s.duration_min} min` : '—'}
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(s.price)}
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(s.commission_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT COLUMN — season overview
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4 shrink-0">

          {/* Runway card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1B4B5A' }}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/50">
                  {t.runway_label}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: runwayMonths >= 6 ? '#E0F8F5' : runwayMonths >= 3 ? '#FFF8E8' : '#FDF0EC',
                    color: runwayColor,
                  }}
                >
                  {runwayLabel}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[48px] font-bold text-white leading-none tabular-nums">
                  {runwayMonths > 0 ? runwayMonths.toFixed(1) : '—'}
                </span>
              </div>
              <p className="text-[11px] text-white/35 mb-4">
                {t.runway_sub}
              </p>

              {/* Progress bar */}
              <div className="h-[3px] rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, background: runwayColor }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-white/25 mb-4">
                <span>0</span>
                <span style={{ color: '#00A896' }}>
                  {projection?.targetMonths ?? 6} mo ✓
                </span>
              </div>

              {/* Projection rows */}
              {projection && (
                <div className="space-y-1.5">
                  {projection.daysLeft > 0 && (
                    <div
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <span className="text-[11px] text-white/40">
                        {lang === 'pt' ? 'Projeção ao fim' : 'End projection'}
                      </span>
                      <span
                        className="text-[13px] font-semibold tabular-nums"
                        style={{
                          color: projection.projectedRunway >= projection.targetMonths
                            ? '#00A896'
                            : projection.projectedRunway >= 3
                              ? '#D4A017'
                              : '#E8471A',
                        }}
                      >
                        {projection.projectedRunway.toFixed(1)} mo
                      </span>
                    </div>
                  )}
                  {projection.gap > 0 && (
                    <div
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{ background: 'rgba(232,71,26,0.12)' }}
                    >
                      <span className="text-[11px] text-white/40">
                        {lang === 'pt' ? 'Faltam para meta' : 'Gap to target'}
                      </span>
                      <span className="text-[13px] font-semibold text-[#E8471A] tabular-nums">
                        {fmt(projection.gap)}
                      </span>
                    </div>
                  )}
                  {projection.daysLeft > 0 && (
                    <div
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <span className="text-[11px] text-white/30">
                        {lang === 'pt' ? 'Dias na temporada' : 'Days left'}
                      </span>
                      <span className="text-[13px] font-semibold text-white/50 tabular-nums">
                        {projection.daysLeft}d
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Today stats */}
          <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--mist)]">
                {t.today_label}
              </span>
              {!today.hasActivity && (
                <span className="text-[10px] text-[var(--mist)] bg-[var(--powder)] rounded-full px-2 py-0.5">
                  {lang === 'pt' ? 'Sem atividade' : 'No activity'}
                </span>
              )}
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[
                { label: lang === 'pt' ? 'Alunos'    : 'Students',    value: String(today.students),    empty: today.students === 0 },
                { label: lang === 'pt' ? 'Aulas'     : 'Sessions',    value: String(today.sessions),    empty: today.sessions === 0 },
                { label: lang === 'pt' ? 'Instrutores': 'Instructors', value: String(today.instructors), empty: today.instructors === 0 },
                { label: lang === 'pt' ? 'Receita'   : 'Revenue',     value: fmt(today.revenue ?? 0),   empty: (today.revenue ?? 0) === 0 },
                { label: lang === 'pt' ? 'Comissões' : 'Commissions', value: fmt(today.commissions ?? 0), empty: (today.commissions ?? 0) === 0 },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-[var(--mist)]">{row.label}</span>
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ color: row.empty ? 'var(--mist)' : 'var(--slate)' }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Season metrics */}
          <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--mist)]">
                {t.season_label}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[
                {
                  label: t.season_revenue,
                  value: fmt(runway.season_revenue),
                  color: 'var(--glacial-dark)',
                  empty: !runway.season_revenue,
                },
                {
                  label: t.season_commissions,
                  value: fmt(runway.crew_commissions),
                  color: 'var(--amber)',
                  empty: !runway.crew_commissions,
                },
                {
                  label: t.season_profit,
                  value: fmt(runway.season_profit),
                  color: (runway.season_profit ?? 0) > 0 ? 'var(--glacial-dark)' : 'var(--signal)',
                  empty: !runway.season_profit,
                },
              ].map(row => (
                <div key={row.label} className="px-4 py-3">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--mist)] mb-1 font-medium">
                    {row.label}
                  </div>
                  <div
                    className="text-[20px] font-semibold tabular-nums leading-none"
                    style={{ color: row.empty ? 'var(--mist)' : row.color }}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
