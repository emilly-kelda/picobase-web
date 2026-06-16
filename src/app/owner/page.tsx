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
import { Plus, Users, Banknote, AlertCircle, Clock } from 'lucide-react'

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
  const barPct       = Math.min(100, (runwayMonths / (projection?.targetMonths ?? 6)) * 100)
  const runwayColor  = runwayMonths >= 6 ? '#00A896' : runwayMonths >= 3 ? '#D4A017' : '#E8471A'
  const runwayLabel  = runwayMonths >= 6
    ? (lang === 'pt' ? 'Saudável'  : 'Healthy')
    : runwayMonths >= 3
      ? (lang === 'pt' ? 'Atenção'  : 'Caution')
      : (lang === 'pt' ? 'Em risco' : 'At risk')
  const runwayBadgeBg = runwayMonths >= 6 ? 'rgba(0,168,150,.18)' : runwayMonths >= 3 ? 'rgba(212,160,23,.18)' : 'rgba(232,71,26,.18)'

  const intPart = runwayMonths > 0 ? Math.floor(runwayMonths) : null
  const decPart = runwayMonths > 0 ? Math.round((runwayMonths % 1) * 10) : null

  const instructorList = instructors.map(i => ({
    id: i.id,
    name: i.name,
    commission_pct: (i as any).commission_pct ?? null,
  }))

  const QUICK_ACTIONS = [
    {
      href:   '/owner/sessions',
      icon:   Plus,
      label:  lang === 'pt' ? 'Nova aula'   : 'New lesson',
      sub:    lang === 'pt' ? 'Confirmar check-in' : 'Confirm check-in',
      accent: true,
    },
    {
      href:   '/owner/crew',
      icon:   Users,
      label:  lang === 'pt' ? 'Equipe'      : 'Team',
      sub:    lang === 'pt' ? 'Instrutores e parceiros' : 'Instructors & partners',
      accent: false,
    },
    {
      href:   '/owner/payments',
      icon:   Banknote,
      label:  lang === 'pt' ? 'Financeiro'  : 'Financials',
      sub:    lang === 'pt' ? 'Pagamentos e fechamento'  : 'Payouts & close',
      accent: false,
    },
  ]

  return (
    <div>
      <style>{`
        .tbl-row:hover > td { background: var(--powder); }
        .tbl-link { color: var(--slate); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .15s; }
        .tbl-link:hover { border-bottom-color: var(--glacial); }
        .qa-arrow { opacity: 0; transition: opacity .15s, transform .15s; transform: translateX(-4px); }
        .qa-card:hover .qa-arrow { opacity: 1; transform: translateX(0); }
      `}</style>

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 pb-6 border-b border-[var(--border)]">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[var(--slate)] leading-none mb-1.5">
            Base Camp
          </h1>
          <p className="text-[13px] text-[var(--mist)]">
            {runway.current_season ?? t.basecamp_season}
            {runway.school_name ? ` · ${runway.school_name}` : ''}
          </p>
        </div>
        {projection && projection.daysLeft > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3.5 py-1.5">
            <span className="size-1.5 rounded-full shrink-0" style={{ background: runwayColor }} />
            <span className="text-[11px] font-medium text-[var(--mist)] whitespace-nowrap">
              {projection.daysLeft} {lang === 'pt' ? 'dias restantes' : 'days left'}
            </span>
          </div>
        )}
      </div>

      {/* ── 2-column grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_272px] gap-6 items-start">

        {/* ══════════════════════════════════════════════════════════════
            LEFT — main flow
        ══════════════════════════════════════════════════════════════ */}
        <div className="space-y-5 min-w-0">

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map(action => (
              <Link
                key={action.href}
                href={action.href}
                className={[
                  'qa-card group flex flex-col justify-between rounded-xl border p-4 h-[90px] transition-all hover:shadow-sm no-underline',
                  action.accent
                    ? 'bg-[var(--signal)] border-[var(--signal)] hover:bg-[#C93810]'
                    : 'bg-white border-[var(--border)] hover:border-[var(--border-strong)]',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span className={[
                    'flex size-[28px] items-center justify-center rounded-lg',
                    action.accent ? 'bg-white/15' : 'bg-[var(--glacial-light)]',
                  ].join(' ')}>
                    <action.icon
                      size={13}
                      className={action.accent ? 'text-white' : 'text-[var(--glacial-dark)]'}
                    />
                  </span>
                  <span className={`qa-arrow text-[13px] ${action.accent ? 'text-white/50' : 'text-[var(--mist)]'}`}>→</span>
                </div>
                <div>
                  <div className={`text-[13px] font-semibold leading-tight ${action.accent ? 'text-white' : 'text-[var(--slate)]'}`}>
                    {action.label}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${action.accent ? 'text-white/65' : 'text-[var(--mist)]'}`}>
                    {action.sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Health alerts */}
          {alerts.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
              {alerts.map((alert, i) => {
                const dot   = alert.type === 'error' ? 'var(--signal)' : alert.type === 'warning' ? '#D4A017' : 'var(--glacial)'
                const color = alert.type === 'error' ? 'var(--signal-dark)' : alert.type === 'warning' ? 'var(--amber)' : 'var(--glacial-dark)'
                return (
                  <a
                    key={i}
                    href={alert.link ?? '#'}
                    className="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-[var(--powder)] transition-colors"
                    style={{ borderBottom: i < alerts.length - 1 ? '0.5px solid var(--border)' : 'none' }}
                  >
                    <span className="size-1.5 rounded-full shrink-0" style={{ background: dot }} />
                    <span className="flex-1 text-[13px] truncate" style={{ color }}>{alert.message}</span>
                    <span className="text-[11px] text-[var(--border-strong)] shrink-0">→</span>
                  </a>
                )
              })}
            </div>
          )}

          {/* Status chips */}
          {(missedLessons.length > 0 || pending.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {missedLessons.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--signal-light)] border border-[var(--signal)] px-3 py-1 text-[11px] font-medium text-[var(--signal-dark)]">
                  <AlertCircle size={10} />
                  {missedLessons.length} {lang === 'pt' ? 'não realizada(s)' : 'missed'}
                </span>
              )}
              {pending.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--glacial-light)] border border-[#B2E8E3] px-3 py-1 text-[11px] font-medium text-[var(--glacial-dark)]">
                  <Clock size={10} />
                  {pending.length} {lang === 'pt' ? 'check-in(s) pendente(s)' : 'pending check-in(s)'}
                </span>
              )}
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

          {/* ── Sessions table (Jeton style) ─────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
              <span className="text-[14px] font-semibold text-[var(--slate)]">
                {t.recent_sessions}
              </span>
              <a href="/owner/sessions" className="text-[12px] text-[var(--glacial)] no-underline hover:underline font-medium">
                {t.view_all}
              </a>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {[t.th_date, t.th_student, t.th_activity, t.th_instructor, t.th_duration, t.th_price, t.th_commission].map(h => (
                    <th key={h} style={{
                      padding: '8px 16px', textAlign: 'left',
                      fontSize: '10.5px', fontWeight: '600',
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      color: 'var(--border-strong)',
                      borderBottom: '0.5px solid var(--border)',
                      whiteSpace: 'nowrap', background: 'white',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                      {t.no_sessions}
                    </td>
                  </tr>
                ) : sessions.map((s, i) => (
                  <tr
                    key={s.id}
                    className="tbl-row transition-colors"
                    style={{ borderBottom: i < sessions.length - 1 ? '0.5px solid var(--border)' : 'none' }}
                  >
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtDate(s.session_date)}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)', maxWidth: '140px' }}>
                      {(s.checkins as any)?.student_name ? (
                        <a className="tbl-link" href={`/owner/students?search=${encodeURIComponent((s.checkins as any).student_name)}`}>
                          {(s.checkins as any).student_name}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--mist)' }}>
                      {(s.activities as any)?.name ?? '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--mist)' }}>
                      {(s as any).instructor?.name ?? '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                      {s.duration_min ? `${s.duration_min} min` : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--slate)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(s.price)}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(s.commission_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT — season overview
        ══════════════════════════════════════════════════════════════ */}
        <div className="space-y-4 shrink-0">

          {/* ── Runway hero card ──────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1B4B5A' }}>

            {/* Header strip */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {t.runway_label}
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{ background: runwayBadgeBg, color: runwayColor }}
              >
                {runwayLabel}
              </span>
            </div>

            {/* Big number */}
            <div className="px-5 pt-5 pb-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
              {intPart !== null ? (
                <div className="flex items-end leading-none mb-1.5">
                  <span className="text-[76px] font-bold text-white tracking-tight tabular-nums" style={{ lineHeight: 1 }}>
                    {intPart}
                  </span>
                  <div className="pb-2 pl-0.5">
                    <span className="text-[40px] font-extralight text-white/35 tracking-tight tabular-nums">
                      .{decPart}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[76px] font-bold text-white/20" style={{ lineHeight: 1 }}>—</div>
              )}
              <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/30 mb-4">
                {lang === 'pt' ? 'meses de reserva' : 'months of runway'}
              </p>

              {/* Progress bar */}
              <div className="h-[2px] w-full rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, background: runwayColor }} />
              </div>
              <div className="flex justify-between" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                <span>0</span>
                <span style={{ color: runwayColor + 'AA' }}>{projection?.targetMonths ?? 6} {lang === 'pt' ? 'mo meta' : 'mo target'} ✓</span>
              </div>
            </div>

            {/* Financial breakdown */}
            <div className="px-5 py-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
              {/* Revenue */}
              <div className="flex items-center justify-between py-1.5">
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                  {t.season_revenue}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(runway.season_revenue)}
                </span>
              </div>
              {/* Commissions */}
              <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                  − {t.season_commissions}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(232,150,130,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(runway.crew_commissions)}
                </span>
              </div>
              {/* Profit (result) */}
              <div
                className="flex items-center justify-between px-2.5 py-2 -mx-2.5 rounded-lg mt-1"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                  = {t.season_profit}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: runwayColor, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(runway.season_profit)}
                </span>
              </div>
              {/* Burn rate */}
              {(runway as any).burn_rate != null && (
                <div className="flex items-center justify-between pt-2 mt-1">
                  <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.22)' }}>
                    ÷ {lang === 'pt' ? 'custo fixo / mês' : 'fixed cost / mo'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt((runway as any).burn_rate)}
                  </span>
                </div>
              )}
            </div>

            {/* Projection rows */}
            {projection && (
              <div className="px-5 py-3.5 space-y-1.5">
                {projection.daysLeft > 0 && (
                  <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {lang === 'pt' ? 'Projeção ao fim' : 'End projection'}
                    </span>
                    <span
                      style={{
                        fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                        color: projection.projectedRunway >= projection.targetMonths ? '#00A896'
                          : projection.projectedRunway >= 3 ? '#D4A017' : '#E8471A',
                      }}
                    >
                      {projection.projectedRunway.toFixed(1)} mo
                    </span>
                  </div>
                )}
                {projection.gap > 0 && (
                  <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(232,71,26,0.1)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {lang === 'pt' ? 'Gap para meta' : 'Gap to target'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#E8471A', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(projection.gap)}
                    </span>
                  </div>
                )}
                {projection.daysLeft > 0 && (
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.2)' }}>
                      {lang === 'pt' ? 'Dias na temporada' : 'Days left'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
                      {projection.daysLeft}d
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Today card ────────────────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--mist)]">
                {t.today_label}
              </span>
              {!today.hasActivity && (
                <span className="text-[10px] text-[var(--mist)] bg-[var(--powder)] rounded-full px-2 py-0.5">
                  {lang === 'pt' ? 'Sem atividade' : 'No activity'}
                </span>
              )}
            </div>
            <div>
              {[
                { label: lang === 'pt' ? 'Alunos'      : 'Students',    value: String(today.students),       empty: today.students === 0 },
                { label: lang === 'pt' ? 'Aulas'       : 'Sessions',    value: String(today.sessions),       empty: today.sessions === 0 },
                { label: lang === 'pt' ? 'Instrutores' : 'Instructors', value: String(today.instructors),    empty: today.instructors === 0 },
                { label: lang === 'pt' ? 'Receita'     : 'Revenue',     value: fmt(today.revenue ?? 0),      empty: (today.revenue ?? 0) === 0 },
                { label: lang === 'pt' ? 'Comissões'   : 'Commissions', value: fmt(today.commissions ?? 0),  empty: (today.commissions ?? 0) === 0 },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none' }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--mist)' }}>{row.label}</span>
                  <span style={{
                    fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    color: row.empty ? 'var(--border-strong)' : 'var(--slate)',
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Season card ───────────────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--mist)]">
                {t.season_label}
              </span>
            </div>
            {[
              {
                label: t.season_revenue,
                value: fmt(runway.season_revenue),
                color: (runway.season_revenue ?? 0) > 0 ? 'var(--glacial-dark)' : 'var(--mist)',
              },
              {
                label: t.season_commissions,
                value: fmt(runway.crew_commissions),
                color: (runway.crew_commissions ?? 0) > 0 ? 'var(--amber)' : 'var(--mist)',
              },
              {
                label: t.season_profit,
                value: fmt(runway.season_profit),
                color: (runway.season_profit ?? 0) > 0 ? 'var(--glacial-dark)' : (runway.season_profit ?? 0) < 0 ? 'var(--signal)' : 'var(--mist)',
              },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none' }}
              >
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--mist)', marginBottom: '4px' }}>
                  {row.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: row.color }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
