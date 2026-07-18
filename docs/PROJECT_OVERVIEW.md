# Project Overview

## What this is

Pico Base is a management SaaS for kite/wind sports schools (kitesurf,
windsurf, wingfoil), built around a single reference school in Fortaleza,
Ceará. It covers: student check-in, lesson scheduling and confirmation,
instructor commissions and payouts, package/credit sales, partner referral
tracking, cost/runway forecasting, and a master (Pico Base staff) admin
portal for managing multiple school tenants.

The app is **single-school in practice today** — `SCHOOL_ID =
'00000000-0000-0000-0000-000000000001'` is hardcoded across most `/owner`
API routes and pages. The `schools` table and `/master` portal exist to
support multiple tenants, but nothing currently lets an owner-side page pick
a different school; that hardcoded ID is the only one that's ever queried
from the owner side.

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Supabase**: Postgres (all app data), Auth (owner/master login only —
  instructors and partners have no Supabase Auth accounts), Storage (partner
  logos — the only Storage usage in the app)
- **Tailwind v4** is installed but barely used — the actual styling
  convention everywhere is **inline `style={{}}` objects referencing CSS
  custom properties** (`var(--slate)`, `var(--radius-md)`, etc., defined in
  `src/app/globals.css`)
- **`@react-pdf/renderer`** for PDF generation (instructor receipts,
  completion certificates) — always server-side via `renderToBuffer` in a
  route handler, never client-side
- **`qrcode`** for partner referral QR codes
- **`next-pwa`** — the owner portal is installable as a PWA
- No icon library anywhere — icons are either emoji or hand-drawn inline SVG
  (24x24 viewBox, `stroke="currentColor"`, no fill — see
  `src/components/nav-icons.tsx`)
- No UI component library (no shadcn/Radix/MUI) — every modal, dropdown, and
  form control is hand-built from scratch, following the same visual
  language (rounded-corner cards, pill buttons, the same handful of
  border/shadow tokens)

## Route map

| Area | Path | Notes |
|---|---|---|
| Owner portal | `/owner/*` | The main app. Requires a Supabase session with `role = 'owner'`. |
| Master admin | `/master/*` | Pico Base staff only (`role = 'master'`). Manages school tenants, billing, cross-school costs. |
| Public booking | `/book/[school]` | No login. Customer-facing intake form, supports `?ref=` partner attribution. |
| Public check-in | `/checkin/[school]` | No login. Waiver + check-in flow tourists/students fill out on arrival. |
| Partner portal | `/partner/[id]` | No login (ID in URL is the access control). Partner's own referral/commission view. |
| Instructor notice | `/instructor/[school]` | No login. **Not** a real instructor portal — just today's notice board (see gaps in README). |
| Marketing | `/(marketing)/*` | Public landing pages, pricing, a standalone runway calculator. |
| Auth | `/login`, `/auth/callback`, `/owner/setup` | Password login + the invite/recovery flow (code exchange → set password). |

## Data access conventions

- **Repository pattern**: every table is read/written through a function in
  `src/repositories/*.ts` (e.g. `packageRepository.ts`, `crewRepository.ts`).
  API routes call repositories; they essentially never touch Supabase
  directly except for one-off queries that don't yet warrant their own
  repository function.
- **Service role everywhere**: `createServiceClient()` (service-role key,
  bypasses RLS) is used in nearly every API route, scoped manually by
  `school_id`/`SCHOOL_ID` in the query itself. RLS policies exist as a
  defense-in-depth layer, not the primary authorization mechanism for
  owner-side routes.
- **Auth boundary**: `middleware.ts` (edge, checks session existence) +
  `getAuthContext()` (server component layer, checks `role`) are the two
  real gates. See `src/app/owner/layout.tsx` and `src/middleware.ts`.
- **No student/checkin/package_sale foreign keys** — students are tracked by
  free-typed `student_name` string almost everywhere (checkins, sessions,
  package_sales), matched via `normalizeStudentName()` (`src/lib/text.ts`) —
  accent/case/whitespace-insensitive substring/equality matching, not a real
  join. A `students` table with a real `id` does exist and is used where
  possible, but package_sales/sessions predate it and were never migrated.

## Localization

- Most of the app is **hardcoded Portuguese** — this is the default and
  correct state for nearly every page.
- A **separate, complete, opt-in bilingual system** exists for exactly 5
  surfaces (Base Camp, Sessions, Students, Student detail, Settings): a
  `portal_lang` cookie + `src/lib/i18n.ts`'s `getT()` dictionary (149
  parallel `en`/`pt` keys), toggled from Settings → "Idioma do portal". This
  is deliberate, not a bug — don't hardcode-Portuguese your way through
  those 5 files without checking whether they use `getT()` first.
- Everywhere else, if you see English, it's very likely a bug (an
  unfinished translation), not a feature — the PT-BR standardization pass
  (see CHANGELOG) fixed the ones found so far, but new code should always
  default to Portuguese unless it's one of the 5 `getT()` pages.

## Money, currency, dates

- `sessions.price` (and everywhere else money is stored) is always the
  **BRL-equivalent** — even when a session was actually charged in
  EUR/USD, `price` is the converted BRL figure and `price_original` +
  `currency` hold what was actually charged. Commission math always runs on
  the BRL figure.
- All currency display should use `Intl.NumberFormat('pt-BR', { style:
  'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits:
  2 })` — standardized to always show cents (previously inconsistent across
  Base Camp/Payments, some screens rounded to whole reais).
- Dates/times assume `America/Fortaleza` (`-03:00`, no DST) — hardcoded in
  several places rather than derived from a school timezone setting, since
  there's only one school today.
