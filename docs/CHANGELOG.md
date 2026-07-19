# Changelog

Full project history, oldest to newest, grouped by theme. Source of truth is
`git log` — every entry below corresponds to a real commit (hash in
parens). Where a change was made in this session, the description reflects
first-hand implementation detail; earlier entries are a faithful gloss of
their commit message and diff.

## Foundations — commissions, currency, security (2026-06-18 → 2026-06-20)

- `9a70d6f` **fix**: package selection sticky to `package_sale_id`, not a
  name-substring guess (Option B) — scheduling a lesson against a specific
  package now stays pinned to that exact sale.
- `b69162f` **fix**: instructor hourly-rate commission saving and
  calculation.
- `f0f1154` **feat**: commission change history on the Crew page.
- `c7710b9` **feat**: burn rate calculator helper in Settings.
- `ff9764e` **feat**: variable package costs (e.g. boat/fuel) factored into
  the confirm modal and commission calculation.
- `bea009b` **fix**: commission save errors now surface instead of always
  showing "Salvo" regardless of outcome.
- `cd53c69` **feat**: Receivables ("A Receber") view in Pagamentos.

## Instructor pay, advances, reports (2026-07-16)

- `79c7066` **feat**: instructor advance/deduction tracking.
- `e5242dd` **feat**: the owner can be assigned as an instructor on
  sessions (with a "Dono" badge, and zero commission since they don't pay
  themselves).
- `4f01669` **feat**: month-over-month comparison on Base Camp (the
  revenue/lesson delta badges).
- `8847bd5` **fix**: commission PATCH was silently no-oping due to an RLS
  policy gap on `users`.
- `6bfcfde` **feat**: finance reports page — revenue, instructors,
  partners, payments.
- `68277b1` **feat**: check-in page redesign, 4-step wizard with the Pico
  Base logo.
- `f1c042c` **fix**: scheduling timezone — use a fixed `-03:00` offset for
  Fortaleza instead of drifting with server time.
- `e9a8b6a` **feat**: public booking intake form (`/book/[school]`).

## Scheduling, bookings, dashboard shell (2026-07-17, part 1)

- `d9d21da` **feat**: group lesson scheduling and confirmation (multiple
  students, one shared time/activity, individual sessions on confirm).
- `0c568f9` **feat**: 2-dot brand favicon and animated full-screen page
  loader.
- `6131a99` **feat**: booking modal on the owner dashboard, reusing the
  public form's logic.
- `bf1ff64` **feat**: replaced the horizontal owner nav with a collapsible
  vertical sidebar.
- `20b6f4e` **feat**: hourly time-slot generation (07:00–17:00) in
  AddBookingModal.
- `8ce75d3` **feat**: Base Camp alerts became a sliding drawer instead of a
  fixed block (`AlertsDrawer.tsx`).
- `1fecb2b` **feat**: packages table replaced with a card grid grouped by
  sport.
- `7fd5ac4` **fix**: activated the auth middleware and wired the
  client-side session guard — this is the point auth actually started being
  enforced.
- `38b4017` **feat**: encrypted sensitive fields at rest (health
  conditions, PIX keys), drafted the LGPD privacy policy.
- `770ed16` **fix**: convert USD/EUR lesson prices to BRL *before*
  computing commission (previously commission math ran on the raw foreign
  figure).

## Master admin portal (2026-07-17, part 2)

- `96b1e20` **feat**: `auth_is_master()` RLS helper, re-asserted master
  policies.
- `d2d7023` **refactor**: isolated school creation under a dedicated
  `/master` scope.
- `a17f525` **feat**: master dashboard with school contract management.
- `1d58575` **feat**: master dashboard metrics + owner column.
- `a0127b0` **feat**: master client monitoring, notices/billing docs, Pico
  Base's own internal cost tracking.
- `0cde6f8` **fix**: "Aprovar Todos" was silently not approving payments,
  which broke the downstream BTG/Wise CSV export (it 404'd with "no
  approved payments").
- `92a46b9` **feat**: operational costs module (`/owner/costs`) feeding
  runway and burn-rate calculations.
- `932ca86` **refactor**: split `/owner/settings` into a card grid + one
  modal per section (General/Financial/Waiver/Seasons), instead of one long
  form.
- `6858fa2` **feat**: partner referral system — trackable links, QR codes,
  auto-discount, auto-commission. (This is also where a long-standing bug
  was fixed: partner commissions were being written to `partner_referrals`,
  a table nothing reads; the real, read table is `referrals`.)
- `c06c1b1` **refactor**: cleaned up Base Camp — removed the interactive
  scenario simulators, moved the sliders to `/owner/costs`.
- `d7b3ee1` **fix**: replaced the unstylable native `<datalist>` with a
  custom dropdown (`SearchableSelect.tsx`) on the partner "Tipo" field —
  `<datalist>`'s popup is rendered by the OS shell and can't be styled via
  CSS.
- `e1fb705` **style**: polished the master dashboard schools table
  (rounded-xl + shadow, consistent 24px/16px padding rhythm, row hover,
  name hierarchy, soft pill badges for payment method/terms).

## Sessions, reports, localization (2026-07-17 → 2026-07-18)

- `42f91d3` **feat**: "Agendadas" tab on `/owner/sessions` for upcoming
  scheduled lessons (previously that page only showed completed sessions).
- `5130ed0` **feat**: rebuilt `/owner/reports` into a full analytics
  dashboard — grouping by Mês/Instrutor/Modalidade, Ticket Médio (BRL/EUR),
  Taxa de Ocupação (backed by a new `users.weekly_capacity_hours` field,
  editable in Crew), Taxa de Renovação (derived from package completion →
  repurchase patterns).
- `d34e824` **fix**: strict PT-BR standardization pass across `/owner` UI,
  alerts, and API error strings. Collapsed ~10 components' ad-hoc
  `lang === 'pt' ? X : Y` ternaries to Portuguese-only, fully translated
  `CrewClient.tsx` (was 100% hardcoded English), fixed a mistranslation and
  a typo in the `i18n.ts` dictionary. Deliberately left the formal
  Settings → "Idioma do portal" toggle system untouched — that's a
  separate, complete, opt-in feature, not the bug being fixed.

## This session's later work (2026-07-18)

- `2cdbcd0` **fix**: owner invite/password-reset emails now land on a
  working page. Root cause was bigger than a missing `redirectTo` — there
  was no `/auth/callback` route to exchange the Supabase code for a
  session, and no `/owner/setup` page to actually set a password. Added
  both; wired `redirectTo` on `inviteUserByEmail`/`resetPasswordForEmail` to
  `NEXT_PUBLIC_BASE_URL`.
- `f951024` **feat**: PDF completion certificates for finished packages,
  generated server-side (`renderToBuffer`, same pattern as the existing
  instructor receipt) — no client-side PDF generation needed. Also
  translated `owner/students/[id]/page.tsx`, found to be 100% hardcoded
  English while adding the certificate button there.
- `82b0e48` **feat**: partner logo upload — new `partners.logo_url` column,
  first-ever Supabase Storage usage in this app (`partner-logos` bucket),
  uploaded through a service-role API route rather than direct
  client-to-storage.
- `9468296` **feat**: WhatsApp reminder + check-in quick-action icons on
  Base Camp's Aulas Agendadas list, muted until hover, disabled when phone
  number or school slug is missing.
- `1cf554c` **feat**: student package history modal — click a balance badge
  in Pending Lessons to see that package's session history (date, activity,
  instructor, duration).
- `e0f5fdf` **refactor**: payments page rebuilt — 4 consolidated KPI cards
  (was 8 fragmented mini-cards), 2 tabs (Comissões da Equipe / Comissões de
  Parceiros — reconciled from two contradictory specs, one of which wanted
  extra tabs for features — "Estrutura de Comissão", "Compliance" — that
  don't exist anywhere in the data model), real `<table>` rows replacing
  stacked cards.
- `e56fb8e` **fix**: data hardening — Base Camp's revenue/lesson comparison
  badges no longer show a false "-100%" drop when the current month simply
  hasn't started generating revenue yet; standardized currency formatting
  (cents, always) across Base Camp and Payments; season save now rejects
  overlapping date ranges.
- `1b2d699` **feat**: weather/wind widget on Base Camp — temperature, wind
  speed (knots) and direction from Open-Meteo, hardcoded to Fortaleza's
  coordinates.
- `c62f48b` **feat**: "Mural de Avisos" — owner-editable daily notice board
  (`schools.daily_notice`), read at the new public `/instructor/[school]`
  page (deliberately separate from the unbuilt `/instructor/*` placeholder
  pages — there's no live instructor login to hook a notice display into
  yet).
- `4ad5450` **feat**: confirmed lessons now auto-debit the student's
  package balance (`confirm-lesson` never touched `minutes_used` before —
  it only ever changed if the owner adjusted it manually). Scheduling also
  now surfaces an explicit insufficient-balance warning when picking a
  student whose package is exhausted, instead of silently hiding them from
  the suggestion list.
- `0e9f5cb` **docs**: added this `docs/` folder.
- `0d4d554` **feat**: waiver can now be an uploaded PDF/Word document
  instead of typed text — global or per-language (`waiver_type`,
  `waiver_file_global_url`, `waiver_files_by_lang`), uploaded to a new
  `school-waivers` Storage bucket (same service-role upload-route pattern
  as `partner-logos`). At check-in, file mode replaces the typed-text block
  with a view-only "Visualizar Termo de Responsabilidade (PDF)" link —
  the student still checks the existing agree/GDPR boxes and signs the
  existing canvas; only the waiver text display itself changes.
- `4702cfc` **feat**: `/master/status` infra panel — DB size, Storage
  bucket usage, active/max Postgres connections, and API health/latency,
  backed by a new `get_infra_status()` SECURITY DEFINER RPC over
  `pg_catalog`/`storage.objects` (no Supabase Management API token exists
  in this project, so pg_catalog metadata is the only real source).
  Centro de Custos: category is now a fixed select (Infraestrutura/
  Software, Marketing, Contador/Legal, Desenvolvimento, Outro) instead of
  freeform text, plus a break-even banner ("X escolas ativas para cobrir
  R$ Y de custo") from total costs ÷ average revenue per active school.
- `838f736` **feat**: "Notificações Automáticas e Gatilhos" card in
  `/owner/settings` — three toggles (`notify_student_before_class`,
  `notify_payment_and_waiver`, `notify_instructor_on_checkin`), all
  default `false`. No dispatch service (Z-API, Evolution API, etc.) is
  wired up yet — TODO comments mark the real future trigger points in
  `api/checkin`, `api/owner/bookings` PATCH, and `api/owner/schedule`
  (the last needs a time-based cron/queue job, not an inline check, since
  scheduling happens well before the 2h-before-class window).
