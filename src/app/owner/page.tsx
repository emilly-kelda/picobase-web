import { cookies } from 'next/headers'
import { getRunwayData, getSchool } from '@/repositories/runwayRepository'
import { getRecentSessions, getTodayStats, getPendingLessons, getMonthComparison } from '@/repositories/sessionRepository'
import { getInstructors, getCompletedHoursByStudent } from '@/repositories/studentRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getScheduledLessons, getMissedLessons, getStudentsWithUpcomingLessons } from '@/repositories/scheduledLessonRepository'
import { getPackageSales, getPackageBalancesForCheckins, getPackages } from '@/repositories/packageRepository'
import PendingLessons from '@/components/PendingLessons'
import ScheduledLessons from '@/components/ScheduledLessons'
import MissedLessons from '@/components/MissedLessons'
import WeatherWidget from '@/components/WeatherWidget'
import QuickSaleCard from '@/components/QuickSaleCard'
import { ReceptionModeProvider } from '@/components/ReceptionModeContext'
import ReceptionModeToggle from '@/components/ReceptionModeToggle'
import AutoRefresh from '@/components/AutoRefresh'
import SpotTodayStats from '@/components/SpotTodayStats'
import { getWeather, buildWeatherSpots, resolveWeatherSpot } from '@/lib/weather'
import { formatCurrency } from '@/lib/currency'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import { normalizeStudentName } from '@/lib/text'
import { todayBR } from '@/lib/date'
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
  const weatherSpotId = cookieStore.get('weather_spot')?.value

  // Fetched ahead of the big parallel batch below — getWeather() needs to
  // know which spot to call Open-Meteo for, and that now depends on the
  // school's own saved location (Settings → Geral), not just a hardcoded
  // default.
  const school = await getSchool(SCHOOL_ID)
  const weatherSpots       = buildWeatherSpots(school as any)
  const selectedWeatherSpot = resolveWeatherSpot(weatherSpots, weatherSpotId)

  const [
    runway, sessions, today, lang,
    pending, instructors, todayLessons, tomorrowLessons,
    activities, activePackages, missedLessons, packageBalances,
    monthComparison, weather, packageTypes, hoursMap,
    studentsWithUpcoming,
  ] = await Promise.all([
    getRunwayData(SCHOOL_ID, seasonId),
    getRecentSessions(SCHOOL_ID),
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
    getWeather(selectedWeatherSpot),
    getPackages(SCHOOL_ID),
    // IKO/VDWS 10h autonomy-certificate eligibility — Aguardando Vento's
    // medal icon next to a student's name.
    getCompletedHoursByStudent(SCHOOL_ID),
    // Post-confirmation "what's next" button — a Set isn't a plain
    // serializable prop across the client boundary, so this crosses as
    // an array and ScheduledLessons rebuilds the Set client-side.
    getStudentsWithUpcomingLessons(SCHOOL_ID),
  ])

  const t = getT(lang)

  const instructorList = instructors.map(i => ({
    id: i.id,
    name: i.name,
    commission_pct: (i as any).commission_pct ?? null,
    commission_mode: (i as any).commission_mode ?? null,
    fixed_per_hour: (i as any).fixed_per_hour ?? null,
    sports: (i as any).sports ?? null,
  }))

  // QuickSaleCard's header chips — sold_at is a timestamptz, so comparing
  // its Fortaleza-local calendar date (not a UTC slice, which rolls over
  // 3h early) against todayBR() to match every other "is this today" check
  // in this app. activePackages here is the RAW getPackageSales(50) list
  // (any status), not the status==='active' filtered one passed to
  // ScheduledLessons below — a package sold today that's already fully
  // used should still count toward today's sales total.
  const todaySalesTotal = (activePackages as any[])
    .filter(p => p.sold_at && new Date(p.sold_at).toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }) === todayBR())
    .reduce((sum, p) => sum + (p.price_paid ?? 0), 0)

  // Team occupancy for today — % of instructors with at least one lesson
  // scheduled today. Used to be hours-booked ÷ (weekly_capacity_hours ÷ 7),
  // an hours-utilization ratio that depended on every instructor having
  // weekly_capacity_hours configured on the Crew page (falling back to a
  // guessed 6h/instructor default otherwise) — a headcount read ("is my
  // team busy today") is a more direct answer for reception than a
  // capacity-hours ratio, and doesn't silently depend on unconfigured data.
  const todayLessonsForOccupancy = todayLessons as any[]
  const instructorIdsScheduledToday = new Set(
    todayLessonsForOccupancy.map(l => l.instructor?.id).filter(Boolean)
  )
  const occupancyPct = instructors.length > 0
    ? Math.round((instructorIdsScheduledToday.size / instructors.length) * 100)
    : null

  // "Alunos na água agora" — each scheduled_lessons row is one student (group
  // lessons are N rows sharing a group_id, per ScheduledLessons.tsx's own
  // collapsing logic), so counting rows whose [scheduled_at, scheduled_at +
  // duration_min) window contains the current instant already gives a
  // correct headcount without needing to dedupe by group. todayLessons only
  // ever has status 'scheduled'/'confirmed' (the query excludes 'cancelled',
  // and scheduled_lessons has no other status value), so no extra filter
  // is needed there.
  //
  // picobase_chameleon_button_dossie.md Fase 4 asked to make this count's
  // source of truth checkins.stage = 'na_agua' instead. Done as a union
  // with the existing schedule-window heuristic, not a straight
  // replacement: ChameleonButton's "Iniciar Velejo" is a brand-new,
  // manual action nobody has a habit of clicking yet, so switching this
  // badge to depend on it alone would make it under-count (likely show 0)
  // until staff actually adopt the button — a visible regression on the
  // one number reception glances at most. Counting either signal means the
  // badge can only go up from what it already showed, while still genuinely
  // reflecting stage as staff start using it.
  const now = Date.now()
  const scheduledWindowNames = new Set(
    (todayLessons as any[])
      .filter(l => {
        if (!l.scheduled_at) return false
        const start = new Date(l.scheduled_at).getTime()
        const end   = start + (l.duration_min ?? 0) * 60000
        return now >= start && now < end
      })
      .map(l => normalizeStudentName(l.student_name))
  )
  const inWaterStageNames = new Set(
    (pending as any[])
      .filter(c => c.stage === 'na_agua')
      .map(c => normalizeStudentName(c.student_name))
  )
  const studentsInWaterNow = new Set([...scheduledWindowNames, ...inWaterStageNames]).size

  const colHeaders = ['Data', 'Aluno', 'Atividade', 'Instrutor', 'Duração', 'Valor']

  return (
    <div>
      <style>{`
        .tbl-row:hover > td { background: var(--powder); }
        .tbl-link { color: var(--slate); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .15s; }
        .tbl-link:hover { border-bottom-color: var(--glacial); }
        .dash-grid-2col {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .dash-grid-2col { grid-template-columns: 1fr; }
        }
      `}</style>

      <ReceptionModeProvider>

      {/* Page title — the Reception Mode toggle sits inline right next to
          "The Spot". Alerts used to be inline here (before that, a
          floating bell in this same top-right corner) — now its own page
          (/owner/alerts, linked from the sidebar) so this dashboard's top
          stays on the high-level KPIs below, not a variable-height
          alerts panel. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{
              fontSize: '22px', fontWeight: '600',
              color: 'var(--slate)', letterSpacing: '-0.02em',
            }}>
              The Spot
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

      <div className="dash-grid-2col">

        {/* ════════════════════════════════════════════════════════════
            COLUMN 1 (left, wider) — operational: what reception acts on.
            Venda Rápida + Aguardando Vento stacked at the top, right above
            Aulas Agendadas — this is the column someone working the
            counter actually looks at all day, so it gets the extra width.
        ════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>

          <QuickSaleCard
            packageTypes={packageTypes as any}
            activities={activities}
            schoolSlug={(school as any)?.slug ?? runway.slug ?? ''}
            schoolName={runway.school_name ?? 'Pico Base'}
            instructors={instructorList}
            todaySalesTotal={todaySalesTotal}
            pendingCount={(pending as any[]).length}
          />

          <PendingLessons
            checkins={pending as any}
            instructors={instructorList}
            activities={activities}
            packageBalances={packageBalances}
            packageTypes={packageTypes as any}
            schoolSlug={(school as any)?.slug ?? runway.slug ?? ''}
            schoolName={runway.school_name ?? 'Pico Base'}
            hoursMap={hoursMap}
            t={t}
            lang={lang}
            weather={weather}
          />

          <ScheduledLessons
            todayLessons={todayLessons as any}
            tomorrowLessons={tomorrowLessons as any}
            activities={activities}
            instructors={instructorList}
            activePackages={(activePackages as any).filter((p: any) => p.status === 'active')}
            schoolName={runway.school_name ?? 'Pico Base'}
            studentsWithUpcoming={[...studentsWithUpcoming]}
            t={t}
            lang={lang}
          />

        </div>

        {/* ════════════════════════════════════════════════════════════
            COLUMN 2 (right, narrower) — context, not action: weather and
            today's KPIs are useful at a glance but nobody clicks anything
            here. Sized down to fit the narrower sidebar (see WeatherWidget's
            own compacted padding/gap — this is its only call site).
            The Reserva de Baixa Temporada card used to sit in this area
            too — moved to /owner/costs (next to the interactive Simulador
            de Cenários, same real numbers).
        ════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          <WeatherWidget weather={weather} spots={weatherSpots} />

          <SpotTodayStats
            today={today}
            monthComparison={monthComparison}
            occupancyPct={occupancyPct}
            studentsInWaterNow={studentsInWaterNow}
            todayLabel={t.today_label}
          />

          {/* Moved here from the left column — a red alert list that grows
              unboundedly (every missed lesson stacks) was the single
              biggest contributor to the left column running far past the
              right one, leaving that whitespace this rebalance is fixing.
              Right under "Hoje" so it stays the first thing seen after
              today's numbers, matching its urgency. */}
          <MissedLessons
            lessons={missedLessons as any}
            instructors={instructorList}
            schoolName={runway.school_name ?? 'Pico Base'}
            t={t}
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

        {/* Wrapped in the same white/border/radius/shadow card treatment
            every other block on this page already uses — this table used
            to sit bare on the page background, the one visibly inconsistent
            element here. */}
        <div style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}>
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
              ) : sessions.slice(0, 8).map((s, i) => {
                // Fallback to scheduled_lessons when checkins is null —
                // group-confirmed lessons (and any individual one confirmed
                // without going through the check-in kiosk) have no
                // checkin at all, so the name is otherwise unrecoverable
                // from this row (see confirm-lesson/route.ts).
                const studentName = (s.checkins as any)?.student_name ?? (s.scheduled_lessons as any)?.student_name ?? null
                return (
                <tr
                  key={s.id}
                  className="tbl-row"
                  style={{ borderBottom: i < Math.min(sessions.length, 8) - 1 ? '0.5px solid var(--border)' : 'none' }}
                >
                  <td style={{ padding: '20px 24px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                    {fmtDate(s.session_date)}
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                    {studentName ? (
                      <a
                        className="tbl-link"
                        href={`/owner/students/name/${encodeURIComponent(studentName)}`}
                      >
                        {studentName}
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
                        background: '#ECFEFF',
                        color: '#0E7490',
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
