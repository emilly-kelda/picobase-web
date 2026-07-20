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
- `3430e7f` **feat**: Aulas Agendadas' per-lesson action button is now
  dynamic — "Iniciar Aula" while a today's lesson is still pending,
  flips to green "+ Agendar Próxima" once it's confirmed or its slot
  has already passed. Clicking it reopens this same file's existing
  "+ Agendar" scheduling modal (real `scheduled_lessons` row via
  `api/owner/schedule`), pre-filled with the student's name/activity/
  instructor — only date/time left for reception to set. Deviated from
  the literal spec (asked for `AddBookingModal`) for the same reason
  noted twice already this pass: that modal writes to `bookings`
  (pre-arrival leads), which never surfaces back in Aulas Agendadas.
  Group rows unchanged, keep their own "Confirmar grupo →" flow.
- `1438163` **fix**: reported as "the confirm button was accidentally
  removed" from Aulas Agendadas — it wasn't, it had been deliberately
  relabeled "Iniciar Aula" and restricted to the "Hoje" tab across the
  previous two passes, context this report didn't have. Relabeled back
  to "Confirmar Aula" and removed the Hoje-only restriction (shows on
  Amanhã too — the confirm modal's session-date field is already
  editable, so pre-confirming a lesson booked for tomorrow works fine).
  Kept the green "+ Agendar Próxima" swap for already-confirmed/past-due
  lessons instead of reverting to no button at all: the report's actual
  concern — no double-click double-confirming the same lesson (would
  double the session/package debit) — is exactly what that swap already
  prevents, without leaving the row with no action. Removing it outright
  would have undone an explicit request approved one pass earlier in
  this same session.
- `0c9301f` **feat**: real per-school location, replacing the curated-
  spots-only workaround from two passes ago. New `GET /api/owner/geocode`
  proxies Nominatim/OpenStreetMap server-side (their usage policy wants
  a descriptive User-Agent a browser fetch can't set reliably); a
  debounced search field in Settings → Geral (`GeneralSettingsModal.tsx`,
  same debounce/dropdown pattern as `AddBookingModal.tsx`) lets the
  owner search by spot/beach name and saves `spot_name`/`latitude`/
  `longitude` on `schools` (migration `20260803000000`, all nullable).
  `weather.ts`'s `buildWeatherSpots()` now puts the school's own saved
  location first in the list `WeatherWidget` reads from, ahead of the
  existing curated Ceará presets (which stay available as quick-swap
  options, not replaced). `getWeather()` now takes an already-resolved
  spot object instead of resolving by id internally, since resolution
  needs the school row the caller already has.
- `5c49dd6` **feat**: Aulas Agendadas settled on pure retention — check-in
  already happens in Sala de Espera, so this list doesn't need its own
  confirm action anymore. Removed the status-dependent "Confirmar Aula"/
  "+ Agendar Próxima" swap in favor of a single, unconditional "+
  Agendar Próxima Aula" button, opening the existing scheduling modal
  pre-filled with the student/activity/instructor. `ConfirmLessonModal.tsx`
  deleted (no longer used anywhere — group rows keep their own separate
  "Confirmar grupo →" flow, since there's no checkin-based equivalent
  for a group). The "Lembrete" link (always to the student) became a
  WhatsApp icon button with a popover offering "Enviar para o Aluno" or
  "Enviar para o Instrutor" — real `api.whatsapp.com/send?phone=...&text=...`
  links (not `window.open`, so cmd/middle-click and popup blockers both
  behave normally), student message mentions the instructor, instructor
  message mentions the student, both include name + time.
  `getScheduledLessons()` now selects `users.whatsapp` in the instructor
  join (previously only `id, name`). "Editar" and cancel stayed exactly
  where they were.
- `e8526e0` **refactor**: `/owner/costs` puts the Reserva de Baixa
  Temporada card and the Simulador de Cenários side by side (1:2 grid,
  collapses to one column under 1024px) instead of two stacked
  full-width rows. `RunwayCalculator.tsx`'s internal layout went from a
  side-by-side sliders/result split to stacked vertical, since that
  split only made sense at full page width — in the new narrower 2/3
  column it left empty space on both sides. Deviated from the literal
  spec (asked for Tailwind `grid grid-cols-1 lg:grid-cols-3`): Tailwind
  is installed and does work in this project, but nothing else in the
  codebase uses it — every page is inline `style={{}}` against the CSS
  custom properties in `globals.css`. Implemented the same responsive
  1:2/1-column result with a plain `<style>` + media query instead,
  matching the `.dash-grid-2col` pattern Base Camp already uses, rather
  than introducing a second styling paradigm in one file.
- `56976c2` **fix**: `WeatherWidget`'s spot picker (📍 icon + popover)
  now only shows for a school that hasn't configured its own location
  yet. `buildWeatherSpots()` used to prepend the school's saved spot
  ahead of the curated Ceará presets (`[school, ...curated]`) so both
  stayed reachable; now a configured school gets a single-item list
  (`[school]` only) and the curated list is a pure fallback for a new
  school with nothing set in Settings → Geral. `WeatherWidget` hides
  the picker whenever `spots.length <= 1` — nothing to switch to. A
  stale `weather_spot` cookie from before the school configured its
  location self-corrects for free: it won't match the new single-item
  list, so `resolveWeatherSpot()` falls back to the school's own spot
  without needing the cookie cleared.
- `37ba018` **refactor**: "Participação na Receita" (per-instructor
  revenue bars) and "Resumo do Mês" (revenue/commissions/margin/paid/
  pending) moved from `/owner/payments` to `/owner/costs`. Both only
  ever lived in `PaymentsClient.tsx` (`payments/page.tsx` is a pure
  data-fetching passthrough) — extracted into a new hookless shared
  component, `PaymentsSummaryCards.tsx`, since everything they render
  derives from `payments`/`summary` alone, with no dependency on the
  Payments page's own tab/payment-method/pagination state. `getPayments`
  is calendar-month-scoped, with no season-range concept — kept its own
  independent month picker (new `MonthPeriodSelect.tsx`, same
  auto-submit `<select>` pattern) on Custos rather than forcing it onto
  the season cookie the rest of that page already uses for Reserva/
  Simulador. Inserted right after the costs list, before the Reserva +
  Simulador grid.
- `cc631f0` **feat**: Aulas (`/owner/sessions`) gained a "Duração Média"
  card and a distribution panel below the totals bar. Verified first
  that Ticket Médio + the Todos/Direto/Parceiros quick filters were
  already fully built (`getSessionTotals().avgTicket`, `originHref`) —
  no changes needed there. `getSessionTotals()` now also returns
  `avgDuration`; new panel (Realizadas tab only) shows Mix de Origem
  (two-color bar, Parceiro vs. everything else, same binary the quick
  filters use) and Faturamento por Esporte (modality detected from the
  activity name via the same prefix-match convention as
  `scheduledLessonRepository.ts`). Both derived from the same already-
  filtered `sessions` array the table uses — no new queries, reacts to
  month/instructor/origin automatically.
- `6eff5da` **fix**: root-caused the Aulas-vs-Pagamentos revenue
  divergence — it wasn't a currency/Taxa Fixa exclusion bug in
  `close_month()` (both were already summed correctly; verified live
  that all 28 sessions had `confirmed_at` set). The real cause: `payments`
  is a snapshot only refreshed on a manual "Recalcular período" click, so
  it silently drifts from `sessions` whenever a lesson is
  confirmed/edited/removed afterward (confirmed against live June/April
  2026 data). `payments/page.tsx` now calls the idempotent `close_month`
  RPC (new `closeMonth()` in `crewRepository.ts`) before every read,
  swallowing errors so a transient RPC failure can't crash the page —
  the manual button stays as a fallback. Also added: an instructor filter
  on Pagamentos identical to the one on Aulas (`getPayments()` gained an
  optional `instructorId` filter, isolating that row and updating the
  KPI cards — "Faturamento líquido" skips netting out partner commissions
  while filtered, since partners aren't scoped to one instructor and
  mixing the two produced a misleading negative number); and a click
  handler on the red "− adiant." total opening a read-only history modal
  (date/value/motivo) sourced from `instructor_advances` data
  `getPayments()` already loaded — no new query needed.
- `be348a9` **feat**: Pagamentos' "Sessões" count is now clickable,
  reusing the existing `fetchBreakdown`/"Recibo" popover instead of
  building a second one. Base Camp's "HOJE" card gained a floating green
  "🌊 N na água agora" badge — counts today's `scheduled_lessons` rows
  whose `[scheduled_at, scheduled_at + duration_min)` window contains the
  current instant (each row is one student, including group lessons,
  matching `ScheduledLessons.tsx`'s own grouping convention); refreshes
  for free via the page's existing 30s `AutoRefresh`, no new client
  polling. Registering an instructor advance now also inserts a matching
  `operational_costs` row ("Adiantamento - [Nome]") — `recurrence: 'unico'`
  rather than `'mensal'` on purpose, since `getMonthlyCostTotal()` only
  excludes `'unico'` from the recurring burn-rate sum and tagging it
  `'mensal'` would make a single advance permanently inflate every future
  month's burn calculation instead of counting once, in the month it was
  actually given; best-effort insert, doesn't fail the advance itself if
  it errors. Corrected an instruction premise mismatch along the way:
  Base Camp's real dashboard is `src/app/owner/page.tsx`, there's no
  `/owner/dashboard/page.tsx` in this codebase.
- `359bbbe` **fix**: selling a package to a "Sem Créditos" student now
  reactivates them in Sala de Espera instead of leaving them stuck.
  Credit balance already updated live on its own (`packageBalances` is
  derived from `package_sales`) and both `SellPackageFlowModal` call
  sites already `router.refresh()` with `PendingLessons` already syncing
  `initialCheckins` into local state — the real gap was that
  `getPendingLessons()` only lists students with a `checkins` row for
  today (`status='checked_in'`, `deferred_to_schedule=false`), and Base
  Camp's "Venda Rápida" can sell to any registered student regardless of
  whether they have one. `sell-package/route.ts` now reactivates today's
  row if one exists but got filtered out, or creates one by copying
  identity/consent fields from the student's most recent already-
  consented prior checkin. Verified live via a throwaway insert that
  `checkins` has a DB check constraint (`lgpd_required`) rejecting any
  row with `lgpd_consent != true` — so a blind create-if-missing would
  either hard-fail or require fabricating consent that was never given;
  copying from a real prior waiver was the only compliant option. If a
  student has no prior checkin at all, the sale still succeeds but they
  aren't auto-checked-in — no consented record exists to copy from.
- `f32167d` **feat**: instructor-clash and student-double-booking
  validation when scheduling or editing lessons. Two separate instructions
  asked for what's structurally the same check (interval overlap against
  active `scheduled_lessons`), so both landed as one shared helper,
  `checkSchedulingConflicts()`, reusing the same overlap math
  `getRescheduleSuggestion()` already had. Both instructions named
  `AddBookingModal` as the target — that component is actually "Nova
  reserva", which writes to a separate `bookings`/leads table and has no
  instructor field at all; the real scheduling form is
  `ScheduledLessons.tsx`'s "+ Agendar" (`/api/owner/schedule` POST/PATCH,
  plus `/api/owner/schedule-from-checkin` for Sala de Espera's "Agendar
  Aula"). One instruction also named `sessions` as the table to check —
  `sessions` are already-realized lessons, not the future calendar;
  `scheduled_lessons` is the actual source of avoidable conflicts.
  Group lessons (`group_id`) are the one real "multiple students on
  purpose" mechanism this codebase has: an instructor clash is skipped
  only against another row in the *same* group, not group-vs-group or
  group-vs-individual. Student clashes have no such exception. Also fixed
  a real gap this depended on: `ScheduledLessons.tsx`'s `save()`/
  `saveEdit()` never checked the API response for errors — `saveEdit()`
  even closed the modal and refreshed unconditionally — so a blocked save
  would have silently looked like it worked.
- `01696b6` **feat**: blocks scheduling/editing a lesson tied to a package
  (`package_sale_id`) once already-pending lessons on that same package
  plus this one's own duration would exceed its remaining balance.
  `checkPackageCapacity()` in `scheduledLessonRepository.ts`, wired into
  `/api/owner/schedule` POST/PATCH and `/api/owner/schedule-from-checkin`.
  Two deviations, both required for correctness: (1) the instruction said
  to key off `student_id`, but `scheduled_lessons.student_id` is almost
  never populated (same known gap as `getScheduledLessons`) — the real
  link to a package is `package_sale_id`, which both routes already write
  whenever a package is selected/linked; (2) the instruction said to
  compare a lesson *count* against the credit balance, but packages here
  are sold and drawn down in minutes, not session count — comparing
  counts would let two 3h lessons through where a 3h + a 1h wouldn't,
  same total minutes either way. The "already committed" query excludes
  `status='confirmed'` as well as `'cancelled'`, since a confirmed
  lesson's minutes are already folded into `minutes_used` by
  confirm-lesson's own deduction — counting it again here would
  double-charge the same minutes. No `package_sale_id` (pay-per-lesson or
  group booking, neither tracks a package) skips the check entirely,
  same as before. Known limitation: the recurring/"dias fixos" scheduling
  mode fires its N requests in parallel, so concurrent requests could in
  theory each read the same pre-commit balance — the existing client-side
  `maxCount` cap already keeps this unreachable in normal use; a full fix
  would mean serializing those requests, trading a rare race for slower
  UX in the common case.
- `a9a3a5f` **feat**: minimum-window cancellation penalty. Cancelling a
  scheduled lesson inside the school's configured window (new
  `schools.cancellation_window_hours`, default 24, exposed as a numeric
  field next to Notificações' existing "Cancelamento Tardio" toggle)
  still frees the instructor's slot, but if the lesson was tied to a
  package the credit is forfeited (`minutes_used += duration_min`,
  annotated in `notes` as a no-show) instead of returned; the API
  response carries `penalized`/`message`, shown to the owner via a toast.
  Discovered and fixed a real pre-existing bug this depended on:
  `ScheduledLessons.tsx`'s `cancel()` sent `id` in the DELETE body, but
  the route only ever reads it from `?id=` — the pattern
  `MissedLessons.tsx`/`RescheduleModal.tsx` already used correctly
  against the same endpoint — so the "Cancelar" button on Aulas Agendadas
  has never actually cancelled anything; every call 400'd silently and
  the client just refreshed regardless. Also had to fix a side effect of
  the penalty itself: `RescheduleModal` creates the replacement lesson
  *before* deleting the missed original, and a missed lesson's
  `scheduled_at` is always in the past by definition, so the penalty
  would have fired on every reschedule even though the student keeps the
  lesson. Fixed by carrying `package_sale_id` forward onto the
  replacement (previously dropped — rescheduling silently stopped
  drawing on the student's package at all) and adding a `skip_penalty`
  flag to the delete call; also had to add `reschedule_from_id` to the
  POST so the not-yet-deleted original doesn't get double-counted
  against its own replacement by the Rule 3 capacity check.
- `bae565b` **feat**: replaced Sala de Espera's one global "Exibir QR Code
  de Check-in" button with a per-student one on each checkin card (a
  compact 📱 icon next to "Ver Ficha"), opening a QR unique to that
  student. `CheckinQRButton.tsx` gained optional `studentName`/
  `activityName`/`compact` props rather than becoming a new component —
  the modal and `/api/owner/qr` endpoint were already exactly what the
  per-student version needed, just missing a way to parameterize the
  target URL. Deviation from the instruction's literal URL format
  (`?id=[student_id]&name=&sport=`): used `?student=&activity=` instead,
  since `checkin/[school]/page.tsx` already reads exactly those two
  params (`prefillStudentName`/`prefillActivityName`, passed into
  `CheckinForm`) to pre-fill the public form — reusing that existing
  mechanism instead of inventing a second one with different names.
  `id=student_id` also wasn't reliable to begin with: `checkins` has no
  FK to `students` (the same name-as-key limitation documented elsewhere
  in this codebase), so there's no guaranteed `student_id` to put there.
- `312ad82` **fix**: explicit product decision, reverting part of
  `359bbbe` above — a Venda Rápida sale to a student with zero prior
  checkins no longer skips creating today's check-in. It's now created
  with `lgpd_consent`/`gdpr_consent` forced `true` and `waiver_signed_at`
  set to now, since the sale and registration happen in person at the
  counter. (`termo_responsabilidade`, named in the instruction, doesn't
  exist as a column — `waiver_signed_at` is the real field that records
  waiver acceptance.)
- `fc45651` **fix**: restored the primary green "Confirmar Aula" button on
  individual (non-group) rows in Aulas Agendadas' Hoje/Amanhã lists — a
  prior change had removed it in favor of "+ Agendar Próxima Aula" on the
  premise that check-in already covers confirmation from Sala de Espera,
  but that leaves no path at all to confirm a lesson once its checkin is
  `deferred_to_schedule` (or it was scheduled with no checkin to begin
  with) — only group lessons still had a working "Confirmar" action.
  Reuses the existing group-confirm modal/flow for a single lesson
  (`openGroupConfirmModal([lesson])`, a "group of one") instead of
  building a second confirm UI — `groupConfirmModal.groupId` is now
  `string | null` to represent that case, with the modal's title/button
  text adapting ("Confirmar aula"/"Confirmar" vs. "Confirmar grupo · N
  alunos"/"Confirmar todos"). "Confirmar Aula" is now the primary solid
  button; "+ Agendar Próxima Aula" (retention nudge) moved to a secondary
  outline style on the same row, since it only makes sense once the
  current lesson is actually confirmed.
- `61880a3` **feat**: every row in `/owner/students` (registered and
  "só via check-in" alike) gained "[ Agendar ]" and "[ Cobrar/Vender ]"
  quick actions, reusing `ScheduleFromCheckinModal`/`SellPackageFlowModal`
  rather than new UI — `ScheduleFromCheckinModal` gained an optional
  `checkinId`, posting straight to `/api/owner/schedule` with
  `student_name` when absent (the Students-page case) instead of going
  through `/api/owner/schedule-from-checkin`'s checkin-linking step. The
  "auto check-in on package sale" half of this request needed no new
  code: "[ Cobrar/Vender ]" hits the same `/api/owner/sell-package` that
  already auto-checks-in as of `312ad82` above, so selling from a
  student's row already gets it for free. Deliberately did *not* wire
  auto-check-in into plain "add a new student" (`AddStudentModal`, no
  package involved) — registering someone's profile from the desk
  shouldn't make them appear in today's Sala de Espera when they're not
  actually there. Also added `'aluguel'`, `'supervis'`, `'downwind'` to
  Aulas Agendadas' `SPORT_FILTERS` (the filter bar already maps that
  array dynamically, so this was the whole change) — `'supervis'` rather
  than `'supervisao'`, since the existing normalization strips accented
  characters outright instead of transliterating them ("ã" in
  "Supervisão" disappears rather than becoming "a"), so a shorter,
  accent-free prefix is the only way that's guaranteed to match. Same as
  the other 5 filters, these only show lessons once a matching
  `activities` row exists (via `/owner/activities`) — none created here,
  that's the owner's catalog to manage.
- `540ed1c` **fix**: repositioned "Confirmar Aula" to sit immediately
  before the WhatsApp button, per a follow-up report. Verified line by
  line that the button restored in `fc45651` is still present and
  correctly conditioned (hidden only when `status === 'confirmed'`) —
  `ScheduledLessons.tsx` is the only component in the codebase that
  renders an "Aulas Agendadas" list, so there's no second, unpatched copy
  hiding elsewhere. If it's still not visible after this deploys, that
  points to browser cache or a Vercel deployment lag, not a remaining
  code gap.
- `7b468b1` **feat**: same-day bookings and lessons now enter Sala de
  Espera automatically, not just Venda Rápida sales. Extracted
  `ensureActiveCheckinForToday()` out of `sell-package/route.ts` into
  `scheduledLessonRepository.ts` (now takes `schoolId` as a parameter
  instead of a closed-over constant) so it's one shared implementation
  instead of three near-copies. Wired into `POST /api/owner/bookings`
  (Reservas — only when `preferred_date` is today; future/undated
  bookings are left alone) and `POST /api/owner/schedule` (any same-day
  individual lesson, covering both the explicitly-named "aula
  experimental, sem pacote" case and same-day bookings generally, since
  the logic doesn't actually depend on package status). Deliberately
  fires on booking *creation*, not confirmation — the instruction said
  "no momento em que for registrado", and gating on manual confirmation
  would add a step it didn't ask for. Also fixed a real
  `router.refresh()` gap found while checking this: `BookingsClient.tsx`'s
  confirm/decline action updated its own local list but never revalidated
  server data, leaving the pending-bookings sidebar badge
  (`getPendingBookingsCount`) stale until an unrelated navigation.
- `66bd220` **fix**: "Confirmar Aula" was reusing the group-confirm modal
  (just instructor/price/payment) instead of a proper single-lesson
  flow — replaced with a dedicated modal matching what Sala de Espera's
  confirm form (`PendingLessons.tsx`) already has: editable duration
  (preset + custom, same pattern as the "+ Agendar" form and
  `ScheduleFromCheckinModal.tsx`), price, payment method, notes, and a
  read-only variable-cost preview (`/api/owner/package-variable-cost`,
  only shown when the student's package actually has one configured —
  it's computed and deducted server-side, not an operator-entered field).
  Skipped FX/multi-currency and level/progression tracking on purpose —
  those serve Sala de Espera's walk-in-tourist case, not an
  already-scheduled lesson with a known student. `/api/owner/confirm-lesson`
  now runs `checkSchedulingConflicts`/`checkPackageCapacity` before
  creating the session (using the lesson's original `scheduled_at`,
  looked up via `scheduled_lesson_id`, now resolved whenever that link
  exists rather than only when there's no checkin) — instructor and
  duration can be edited at confirm time, so a swap could introduce a
  conflict never checked at scheduling time. This also protects Sala de
  Espera's own confirm flow for free, same route. Found and fixed a
  related gap: `PendingLessons.tsx` never checked `confirm-lesson`'s
  response for `ok`, so a rejected confirm (now possible) showed no
  error at all.
- `f89ed18` **feat**: IKO/VDWS 10h autonomy-certificate eligibility
  tracking. `getCompletedHoursByStudent()` in `studentRepository.ts` sums
  `duration_min` across `sessions` (already-concluded lessons by
  construction — there's no separate status column, a lesson only
  becomes a `sessions` row once actually confirmed), grouped by student
  via `checkins.session_id`, same join `getSessionsByStudent`/
  `getSessionsByStudentName` already use for a student's own history.
  Known, pre-existing gap carried over rather than introduced:
  group-confirmed lessons have no checkin at all
  (`confirm-lesson/route.ts`: "Group-confirmed lessons have no
  checkin"), so their minutes aren't attributed to anyone here either —
  same limitation those two functions already had. Surfaced in three
  places: a new "Horas de Velejo" column on the Students list (both
  registered and check-in-only sections) with a green "[ 📜 Elegível
  para Certificado ]" badge at 10h+; the same card + badge on both
  student detail pages, computed directly from the `sessions` array
  those pages already fetch (no new query there); and a 🏅 icon next to
  the name on Sala de Espera's checkin cards once a student crosses the
  threshold, flagging a lesson that might be their final evaluation.
- `e1a78cb` **fix**: production outage — `getCompletedHoursByStudent()`
  (above) assumed `checkins.session_id` existed; it doesn't, the real
  link is `sessions.checkin_id → checkins.id`. Confirmed live via
  `Error 42703: column checkins.session_id does not exist`, which was
  crashing every render of `/owner`. The wrong assumption came from
  `getSessionsByStudent`/`getSessionsByStudentName` (pre-existing code)
  referencing the same nonexistent column — those never crashed only
  because they read `.data` without ever checking `.error`, so they
  silently returned empty session histories instead of throwing. Fixed
  all three functions to use the correct join; verified against
  production data before pushing.
- `4365840` **fix**: restored the actual original `ConfirmLessonModal.tsx`
  (568 lines, recovered via `git show` from the commit that deleted it
  two days prior) in place of the simplified single-lesson confirm form
  built in `66bd220` — that rebuild was a smaller reconstruction, not a
  restoration, missing: activity selection, the level/progression picker,
  an editable session date, BRL/EUR/USD currency with live FX conversion
  (`/api/fx`, with a stale-cache/fallback path), total-vs-per-hour
  pricing, and a live instructor-commission preview accounting for both
  variable cost and currency conversion. `ScheduledLessons.tsx` now
  renders this restored component instead of its own inline modal;
  `payoutModel`/`fixedPayoutValue` came back as props (removed in the
  same deletion commit) threaded from `owner/page.tsx`'s already-fetched
  `school` row. `/api/owner/confirm-lesson` needed no changes — the
  restored modal's request body matches what the route already expects,
  and the clash/capacity validation added earlier this session still
  runs for it.
- `7d99e9f` **refactor**: rebalanced Base Camp's two-column layout. The
  left column (1.6fr) stacked Venda Rápida, Sala de Espera, Aulas Não
  Realizadas, and Aulas Agendadas, all unbounded height, while the right
  (1fr) only had Weather + "Hoje" — leaving heavy right-column whitespace
  and long left-column scrolling. Moved `MissedLessons` to the right
  column, right under "Hoje" (styled to match that card visually) and
  recompacted its rows for the narrower width (stacked name/time then
  truncated meta, smaller side-by-side action buttons instead of one
  wide row). Recompacted Sala de Espera's cards (36px→28px avatar,
  tighter padding, 3 content lines down to 2, action column collapsed
  into one horizontal row) — dropped the "📅 Agendado" tag and
  nationality badge from the compact view (still in "Ver Ficha"/avatar
  tooltip), since neither was on the instruction's explicit
  keep-visible list (Nome, Termo, Créditos, Ações). Gave Aulas Agendadas'
  lesson list internal scroll (`max-height: 640px`) past 8 rows instead
  of letting the page grow unbounded — the actual source of the
  "infinite scroll" complaint (the footer's "Aulas recentes" table was
  already capped at 8). Verified with a clean production build before
  committing, given the recent outage.
- `c8a6cd1` **feat**: end-to-end i18n for `ScheduledLessons.tsx`,
  `PendingLessons.tsx`, and `ConfirmLessonModal.tsx` — the root cause of
  the reported "mixed language" bug: all three had always rendered
  hardcoded PT-BR regardless of the Settings language toggle, because
  `lang`/`t` were simply never threaded down into them from
  `owner/page.tsx` (which already called `getT(lang)` for its own
  strings). Added ~50 new `en`/`pt` keys to `src/lib/i18n.ts` covering
  Aulas Agendadas (tabs, sport filters, status/empty-state text),
  Sala de Espera (Termo Assinado, Sem Créditos, package badges, action
  buttons), and the entire Confirmar Aula modal (activity/instructor/
  duration pickers, currency and FX conversion, variable cost,
  commission preview, PIX/Dinheiro/Cartão/A receber payment methods) —
  reusing pre-existing keys (`duration_label`, `today_label`,
  `status_scheduled`, `health_label`) instead of duplicating. New
  `src/lib/modality.ts` translates free-text activity names from the
  DB (Kitesurf, Aluguel, Supervisão, Downwind, …) via the same
  prefix-match convention already duplicated across the codebase
  (`detectModality`, `activityMatchesSport`) — most modality names are
  loanwords identical in both languages, only Aluguel/Supervisão
  actually differ. Deliberately left untouched: `MissedLessons.tsx`,
  the student "Ficha" detail modal, and `ScheduledLessons.tsx`'s
  create/edit-lesson modals — none were named in the request and each
  is a large enough surface to warrant its own pass. Verified with
  `tsc --noEmit` and a clean production build before committing.
