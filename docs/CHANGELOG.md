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
- `046cde8` **fix**: WhatsApp reminder links on Aulas Agendadas now backfill
  Brazil's country code (55) when a student's saved number is just
  DDD+phone (10-11 digits) — the check-in form's WhatsApp field has no
  format hint, so numbers without a country code were opening `wa.me` to
  an invalid or wrong contact (the icons themselves were already
  correctly wired, verified end-to-end — no dead click, no z-index/
  pointer-events issue).
- `6f6db51` **fix**: Modo Recepção toggle was right-aligned in the Base
  Camp title row, landing inside AlertsDrawer's fixed bell trigger's
  44x44px hit zone (top:20px/right:24px, independent of page layout)
  whenever there was at least one active alert. Moved inline next to the
  "Base Camp" text itself, clear of that corner.
- `0247b74` **feat**: "Ocupação da Equipe" metric in Base Camp's Hoje
  card (hours scheduled today ÷ instructor capacity, group lessons
  deduped by `group_id` so they don't triple-count) plus quick sport-
  filter badges (Todos/Kitesurf/Wingfoil/Kitefoil/Surf/Windsurf) above
  Aulas Agendadas, matched by a prefix check (not substring) so
  "Surf" doesn't false-match "Kitesurf"/"Windsurf".
- `d80786c` **feat**: "Reagendar" button in Aulas Não Realizadas (next to
  the existing "Descartar", kept) opens a modal with a system-suggested
  slot — modality detected from the activity name, an instructor who
  teaches it (`users.sports`) and has no conflicting lesson in the next
  7 days' 8-17 hourly window, falling back to any active instructor or
  to fully manual selection when nothing qualifies. Confirming creates
  the new lesson and cancels the old one via the existing schedule
  routes, then opens a pre-filled `wa.me` tab with the reschedule
  message (skipped with an inline note if the student has no WhatsApp
  on file). Extracted the Brazil country-code backfill into
  `src/lib/whatsapp.ts`, now shared with Aulas Agendadas.
- `a9177c3` **feat**: Aulas Agendadas' WhatsApp/check-in icons are now
  labeled pills ("Confirmar Aula" / "Check-in") instead of bare 32x32
  icon squares — the links themselves were already correct (verified
  again), they were just easy to miss as icon-only decoration.
- `9290455` **fix**: check-in link on Aulas Agendadas was permanently
  disabled — `schoolSlug` was read from `runway.slug`, but the backing
  `get_runway_by_season` RPC has no slug column at all (confirmed by
  querying it directly). Switched to `school?.slug`, from the
  already-fetched `getSchool()` call (same source `QRCodeDisplay` uses).
- `286a021` **feat**: student profile edit mode — confirmed (again)
  there's no intermediate preview drawer anywhere in the app before
  building anything. Added an "Editar ficha" toggle to
  `/owner/students/[id]` for name/email/whatsapp/nationality/health
  status, via a new PATCH `/api/owner/students` route. Scoped to
  columns that actually exist on `students` — no languages/sports
  fields, since those are instructor-only (`users.sports/languages`).
- `5ce9b11` **feat**: school-wide "Taxa fixa por aula" payout option
  (Settings > Geral), overriding every instructor's individual
  commission_pct/fixed_per_hour with one flat BRL value per lesson.
  Wired into `api/owner/confirm-lesson`, the single authoritative
  commission calc shared by both individual and group confirms, and
  into the confirm-modal's live preview. The dashboard's Comissões sum
  needed no change — it already sums `sessions.commission_amount`,
  computed once at confirm time and stored, so it reflects whichever
  model was active per lesson automatically.
- `b401b93` **feat**: AwesomeAPI FX integration already existed
  end-to-end (`src/lib/fx.ts`, `api/fx`, `confirm-lesson`'s
  `convertToBRL`) — checked before touching anything. Two real gaps
  closed: the client preview's rate was fetched once on mount instead
  of per modal-open (could go stale on a long-open tab; the actual
  server-side conversion on confirm was never affected), and there was
  no "Convertido: R$ X (Cotação: ...)" line for the raw total price.
  Kept the "Taxa de câmbio indisponível" message (a real conditional
  error, not a static one) but gave it a "Tentar novamente" action.
- Declined a request to remove the "Financeiro" settings card: its
  `burn_rate` field is the fallback the Off-Season Runway calculation
  and the onboarding checklist still depend on when a school has no
  itemized Costs entries — removing it would have quietly broken both
  for any school without itemized costs. Flagged this before touching
  anything; no change made.
- `9f44e69` **feat**: three more notification flags —
  `notify_package_low`, `notify_late_cancellation`,
  `notify_post_class_feedback` — with the modal now grouping all six
  toggles into labeled subcategories (Financeiro / Operacionais /
  Pós-Aula) and a success toast on save (new shared `Toast`/`useToast`,
  extracted from CrewClient's inline pattern). TODO comments mark the
  real trigger points in `api/owner/confirm-lesson` (package balance
  update, session insert) and `api/owner/schedule`'s DELETE handler.
- `ca3816d` **fix**: `+Agendar`'s student autocomplete
  (`api/owner/students-with-packages`) only ever queried `package_sales`,
  so any student with no package — a booking-only contact, a partner
  agency — never appeared in the suggestion dropdown, even though
  scheduling with no `package_sale_id` already worked fine underneath.
  Now merges in every student with no matching sale, shown with a
  neutral "Sem pacote" badge instead of the minutes-remaining pill.
- `c0fe547` **feat**: shared `formatCurrency` (`src/lib/currency.ts`),
  migrated into Base Camp/Pagamentos/Custos in place of their own
  duplicated `Intl.NumberFormat` calls — kept each page's existing
  decimal precision rather than forcing 2-decimal everywhere (0-decimal
  is the dominant convention across ~27 other files in the app, so
  unifying to 2-decimal would have been an unrequested visual change).
  Added the missing front-end half of the season date-overlap check
  (API already validated it) to `SeasonsModal.tsx`, and gave the Aulas
  KPI the same "Início do período" empty-state text the Receita KPI
  next to it already had.
- `a91a371` **feat**: package-balance badge on each Aulas Agendadas row
  — "Xh restante(s)" (blue) with a positive balance, "Sem créditos"
  (amber) when exhausted, "Aula Avulsa" (amber) with no active package
  at all. Reused `activePackages`, already fetched and passed into
  `ScheduledLessons` for the `+Agendar` modal's autocomplete — no new
  query needed, just surfaced on the list rows too.
- `09f929b` **feat**: Payments tabs renamed to Instrutores/Parceiros
  (kept the count suffix); added a derived "Atrasado" badge (period
  fully past, still not paid — not a stored column, an honest
  computed state) and two closing KPI cards below the Instrutores
  table (Participação na Receita bars, Resumo do Mês). Declined again
  to add "Estrutura de Comissão"/"Compliance" tabs — re-confirmed zero
  matches for either concept anywhere in the app, same conclusion as
  the earlier payments redesign this session.
- `230a2bd` **feat**: Ticket Médio card (filtered revenue ÷ filtered
  session count) and Todos/Direto/Parceiros origin quick filters on
  `/owner/sessions` — plain GET links, consistent with this page's
  existing server-rendered filtering. This is one of the five
  bilingual-portal pages (confirmed via `season_commissions`), so the
  new labels went into both `i18n.ts` blocks rather than hardcoded
  Portuguese.
- `1d156f8` **fix**: found the real cause of "Tentar novamente" looking
  broken — `api/fx/route.ts` had no dynamic function calls, so Next.js
  could cache its response (including a cached failure) and keep
  serving it regardless of client retries. Fixed with
  `dynamic = 'force-dynamic'` + `Cache-Control: no-store`. Also added a
  hardcoded last-resort fallback rate (`src/lib/fx.ts`, degrades live ->
  stale cache -> fallback) for when AwesomeAPI is down with no cache
  yet, surfaced honestly in the confirm modal ("taxa padrão da escola")
  rather than presented as live — one change, shared by both the
  preview and the actual persisted commission.
- `89777f7` **feat**: the dashboard's check-in link already sent
  `?student=`, but the public form never read any query params at all
  (confirmed via grep — a real, complete gap). Now also sends
  `?instructor=&activity=` (names); `CheckinForm.tsx` resolves them to
  `activity_id`/`instructor_id` in its initial state, so whichever step
  the student reaches already shows that option selected. No `?level=`
  — the check-in form has no skill-level field anywhere to bind it to.
- `7cc54ed` **feat**: "Exportar PDF" and "Enviar WhatsApp" buttons in the
  Payments Recibo bottom sheet, plus an Adiantamentos deduction line and
  a bold "Total a receber" (net of advances) in its footer. Found the
  existing `api/receipt/[instructorId]` route recomputes commission
  from raw price × pct — ignoring fixed_per_hour, variable costs, the
  fixed payout model, bonus, and advances — so a PDF from it couldn't
  be trusted to match the real payout. Built
  `api/owner/receipt/[paymentId]` instead, sourced directly from the
  same closed `payments` row the table renders from, so the on-screen
  total, the PDF, and the WhatsApp message can never disagree. Old
  route left untouched (still used by `close-month/page.tsx`).
- `479a01d` **feat**: 30s background auto-refresh on Base Camp,
  `/owner/sessions`, and Payments via a new shared `AutoRefresh`
  component (`router.refresh()` inside a `startTransition`, one
  instance per page). Found a real gap while implementing it: this app
  has no SWR/React Query, and `PendingLessons`/`PaymentsClient` copy
  their data prop into local `useState` once at mount with no sync
  effect — without fixing that, the timer would've refetched
  server-side but the screen would never visibly update. Added the
  missing sync effects to both; confirmed `ScheduledLessons`,
  `MissedLessons`, and `RunwaySummary` already read their props
  directly and needed no change. Open modals in both fixed components
  hold their own state, never derived from the refreshed list, so a
  background sync can't close them or reset in-progress fields.
- `301ee20` **fix**: `api/checkin/route.ts` wrote `lgpd_consent`/
  `gdpr_consent` as hardcoded `true` on every row regardless of the
  actual checkbox state (the client never even sent those fields) —
  the audit trail claimed full consent independent of reality. Client
  now sends the real states; server validates both are true (rejects
  otherwise) and persists what was actually submitted. Confirmed
  `ip_address`/`user_agent`/`waiver_signed_at` were already captured
  server-side — no change needed there. Grew the existing scrolling
  waiver box (120px -> 192px), added a "follow school safety rules"
  line and formalized checkbox wording across all 4 languages this
  form supports, and added an optional scroll-to-bottom gate. Did not
  add a link to a fabricated privacy policy document — added an
  optional `privacy_policy_url` column instead (Settings > Geral), the
  checkin form only shows the link when the owner has actually set one.
- `7b3d99f` **fix**: the public check-in form fetched and displayed the
  *entire day's* scheduled roster (names, activities, instructors) as a
  browsable dropdown under the name field — focusing the field with
  nothing typed showed everyone scheduled that day, no authentication,
  a real LGPD data-minimization violation. Not literally the `students`
  table as the reporting task assumed (it was `scheduled_lessons`
  scoped to today), but the exposure was real. Removed the dropdown,
  the client-side list fetch, and deleted the backend route entirely
  (an unauthenticated endpoint reachable by URL, so leaving it in place
  would've kept the leak alive even with the frontend not calling it).
  Replaced with `api/checkin/today-match`, a single-match lookup
  (mirrors `api/checkin/package-balance`) that silently pre-fills
  activity/instructor for the exact name already typed — never returns
  a list.
- `2af8712` **feat**: `AddBookingModal.tsx` now leads with a debounced
  search against registered students (new `student_id` FK on
  `bookings`) instead of retyping name/WhatsApp — reflects that the
  QR-code check-in form already collects that info and find-or-creates
  a `students` row. New `POST /api/owner/bookings` (separate from the
  public, unauthenticated `/api/book`) re-derives name/whatsapp from
  the real student row server-side when `student_id` is sent, never
  trusting the client. "Cadastrar novo cliente manualmente" stays as
  the fallback. Search is name-only — this app doesn't collect CPF
  anywhere yet, so a CPF search field would have nothing to query.
- `0025f2e` **feat**: renamed the pending-checkins widget to "Sala de
  Espera" and added nationality/"Termo Assinado" badges, relative
  arrival time (exact time on hover), and a "Ver Ficha" detail modal
  (nationality, birthdate, email, WhatsApp, emergency contact, health
  conditions, guardian, source). Confirmed this data already maps to
  the existing `checkins.status = 'checked_in'` list before building
  anything separate — kept its existing "Confirmar" action (creates a
  real session now) rather than routing through `AddBookingModal`
  (needless pending-request step for someone already at the counter),
  and skipped a hard 30-minute filter since hiding older checkins
  could hide someone genuinely still waiting.
- `64dbff2` **feat**: CPF (Brazilian nationals) or Passport (everyone
  else) capture on the real waiver form, `checkin/[school]/
  CheckinForm.tsx` — branches on the nationality already selected
  there, live-masked CPF with real check-digit validation, required to
  advance. New `document_number`/`document_type` columns on both
  `checkins` and `students` (migration `20260731000000`), plaintext
  (not encrypted like `health_conditions`/`pix_key` — this field's
  purpose is to be searchable, which an encrypted column can't
  support). `api/checkin/route.ts` backfills it onto an existing
  student row if they checked in before without one. `getStudents()`
  now matches name OR document_number; `AddBookingModal` shows it in
  results and the selected-customer summary.
- `b1f9b71` **feat**: restructured Base Camp's top-right region for
  counter operations. Added a compact QR-code button to the "Sala de
  Espera" header (reuses `api/owner/qr`) — kept outside the
  `checkins.length === 0` guard, since that's exactly when reception
  needs to hand a new arrival the code. Replaced "Mural de Avisos"
  with a "Venda Rápida" card and gave each Sala de Espera card with no
  active package credits a "Vender Pacote" button — both open a new
  unified `SellPackageFlowModal` (name search or avulsa entry +
  package picker) posting to the existing `api/owner/sell-package`.
  "Mural de Avisos" (`DailyNoticeEditor`) moved to Settings rather
  than being deleted, since `/instructor/[school]` still reads
  `school.daily_notice`. `RunwaySummary` ("Reserva de Baixa
  Temporada") moved to `/owner/costs` next to the Simulador de
  Cenários (same real numbers) — Base Camp's column 2 is now just Sala
  de Espera + Aulas Perdidas, both with the full column height.
- `994ef70`…`a3ee61b` **fix**: dashboard bug-fix pass, root-caused
  against production data first (`AUDITORIA_DASHBOARD.md`) — two of
  the four reported bugs turned out to need a different fix than
  originally assumed. "Confirmada" + "Sem créditos" showing together
  (Sofia Andersson) wasn't a missing balance check — both lessons were
  legitimately charged avulsa (`sessions.price` > 0, `payment_method`
  set); the real bug was `ScheduledLessons.tsx`'s credit badge not
  checking `lesson.status`, so an already-paid lesson kept showing a
  stale warning. Blocking confirmation without an active package (the
  original ask) would've broken the normal pay-per-lesson flow, so
  that wasn't implemented. "Lucro líquido" showing R$ 0,00 instead of
  negative: the `Math.max(0, …)` clamp needed for `runwayMonths` was
  also clamping the displayed net-profit figure — split into
  `rawNetProfit` (shown, can go negative, red when it does) vs.
  `adjustedNetProfit` (floored, only feeds runway math). Season-scope
  mismatch: `getRunwayProjection` always read the most-recent season by
  `start_date` for partner commissions regardless of the
  `active_season_id` cookie `getRunwayData` uses, so switching seasons
  changed half the card's numbers and not the other half — now takes
  the same `seasonId`. "Duplicação do Jack Ryan" wasn't a duplicate
  `students` row (there's only one) — it was three `package_sales`
  with `student_id` null, and both balance readers
  (`getPackageBalancesForCheckins`, `ScheduledLessons`'
  `getPackageBadge`) picked just one instead of summing, under-quoting
  his real balance by ~660 minutes. Both now sum unexhausted sales
  (FIFO-pinned to the oldest for "Ver histórico"/auto-debit order);
  migration `20260801000000` backfills `package_sales.student_id`
  where exactly one matching `students` row exists (additive only, no
  merge). Also: `AutoRefresh` truncation fix, reworded the ambiguous
  "Última aula · 1h" badge, and "Ocupação da Equipe" switched from an
  hours/weekly-capacity ratio to % of instructors with a lesson
  scheduled today.
- `4ab3e26` **feat**: split Sala de Espera's "Confirmar" into two
  separate actions across the two widgets. A walk-in with nothing
  pre-arranged now gets "Agendar Aula" — a new lightweight modal
  (`ScheduleFromCheckinModal.tsx`, no price/payment fields) that writes
  a real `scheduled_lessons` row via new `api/owner/schedule-from-checkin`
  and links it back onto the checkin. The actual pricing/payment
  decision moved to a new "✓ Confirmar / Iniciar Aula" button on
  individual Aulas Agendadas rows (`ConfirmLessonModal.tsx`, ported from
  Sala de Espera's modal, confirms via `scheduled_lesson_id` instead of
  `checkin_id`). A checkin that arrives already matched to a
  pre-existing booking keeps the one-step "Confirmar →" in Sala de
  Espera unchanged — new migration `20260802000000` adds
  `checkins.deferred_to_schedule` specifically to tell these two cases
  apart (both end up with `scheduled_lesson_id` set). Deviated from the
  literal spec, which asked to wire "Agendar Aula" to `AddBookingModal`
  — that writes to the unrelated `bookings` (leads) table, not
  `scheduled_lessons`, so it would never have shown up in Aulas
  Agendadas at all. Also fixed a real pre-existing bug this surfaced:
  `confirm-lesson`'s package auto-debit and variable-cost lookup only
  ran when a `checkin_id` was present, so the already-existing group-
  confirm flow (which always confirms via `scheduled_lesson_id` alone)
  was silently never debiting any package.
- `c27f99e` **feat**: public check-in form (`checkin/[school]/
  CheckinForm.tsx`) now filters the instructor list by the selected
  activity's modality, instead of always showing every active
  instructor. The instructor↔modality link already existed
  (`users.sports`, set by the owner in Equipe/`CrewClient.tsx`, already
  used by `scheduledLessonRepository.ts`'s reschedule suggester) — just
  wasn't selected or applied here. `getInstructorsForCheckin` now
  selects `sports`; the form detects modality from the activity name
  (same prefix-match convention as `detectModality`/
  `activityMatchesSport` elsewhere) and filters, falling back to the
  full list when nobody matches — same fallback the reschedule
  suggester already uses, so a school that hasn't tagged any instructor
  yet doesn't lose instructor selection entirely. "Sem preferência"
  stays outside the filter, always visible. Switching to a modality the
  currently-picked instructor doesn't teach resets the selection back
  to "Sem preferência".
- `5155b5d` **polish**: `PendingLessons.tsx`'s "Sem pacote" badge (gray,
  neutral) became "⚠ Sem Créditos" (red, same weight as the existing
  "Pacote esgotado" badge) — now that Sala de Espera's primary action
  is "Agendar Aula" instead of an immediate charge, a student with zero
  credit is easier to schedule and forget about, so the badge needed to
  read as an alert, not just info. `ScheduledLessons.tsx`: removed the
  "Check-in" link (opened the public waiver form), which duplicated the
  "Confirmar/Iniciar Aula" button added last pass — both were really
  just two ways to say "start this lesson". Renamed to "✓ Iniciar Aula
  / Check-in", now only shown on the "Hoje" tab (starting tomorrow's
  lesson today doesn't make sense). The public form is still reachable
  via Sala de Espera's QR button.
- `436b853` **refactor**: swapped Base Camp's two columns. Left (now
  wider — grid `1.6fr 1fr` instead of `1fr 1fr`) holds the operational
  stack reception actually works from: Venda Rápida, Sala de Espera,
  Aulas Perdidas, Aulas Agendadas, in that order. Right (narrower) holds
  weather and the "HOJE" KPI card — glanceable context, nothing to
  click. `WeatherWidget.tsx` (single call site) had its padding/gap/font
  sizes tightened to fit the narrower sidebar it now lives in instead of
  the old full-width top row. The existing `max-width: 900px` collapse
  to one column stacks the two column `<div>`s in DOM order for free —
  operational column fully first, weather/KPIs last — so no extra
  responsive logic was needed for that ordering.
- `5d332a2` **feat**: `WeatherWidget.tsx` became interactive — a 📍
  icon in its header opens a popover to switch which spot's forecast
  is shown, and wind direction is now a 16-point compass with full
  Portuguese names ("Leste-Sudeste") instead of the old 8-point
  abbreviations. Deviated from the literal spec, which asked for "a
  list of the school's registered locations" — no multi-location/
  "sedes" concept exists anywhere in the schema (single hardcoded
  `SCHOOL_ID` throughout), so that's a curated, hardcoded list of real
  Ceará coastal wind/kite spots (Fortaleza, Cumbuco, Taíba, Icaraí de
  Amontada, Jericoacoara) instead of something read from a database
  table. Selection persists via a `weather_spot` cookie, same direct
  `document.cookie` + `router.refresh()` pattern `OwnerNav.tsx` already
  uses for the season switcher. `getWeather()` now takes a spot id.
  Tide data (also asked for, hedged "se possível") was researched and
  skipped: no free, keyless tide API covers Brazil (NOAA is US-only;
  WorldTides/Stormglass/TidesAtlas all require a paid signup) — didn't
  fabricate a fake reading rather than leave it for later.
