# Pico Base — Documentation

This folder documents the state of the `picobase-web` project as of **2026-07-22**.
It's generated from the actual git history and codebase, not from memory or
assumptions — see [CHANGELOG.md](./CHANGELOG.md) for the commit-by-commit source.

- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** — what this app is, the tech
  stack, how the codebase is organized, and the conventions every part of it
  follows (styling, data access, auth, i18n).
- **[CHANGELOG.md](./CHANGELOG.md)** — every feature and fix, in order, grouped
  by theme, from the first recorded commit through today.
- **[VERSIONING.md](./VERSIONING.md)** — how to mark a restorable checkpoint
  and roll back to one, using git tags (no custom backup system — git and
  Vercel already do this).

## Known gaps (worth knowing before you rely on something)

- **No live instructor portal.** `/instructor/{sessions,students,receipts}`
  are unbuilt placeholders and `/instructor` itself redirects to `/login`.
  Instructors don't have their own login today — the owner does check-ins
  and confirmations on their behalf from Base Camp. The one exception is
  `/instructor/[school]`, a new public (no-login) page that only shows the
  daily notice board.
- **`referrals` vs `partner_referrals`.** Partner commissions are computed
  and read from `referrals`. `partner_referrals` is an older table nothing
  in the app reads anymore — don't resurrect it without checking first.
- **`checkins.package_sale_id` and `sessions.package_sale_id` are always
  null in practice** — nothing writes them. Any code that needs "this
  package's session history" has to fall back to matching by student name
  and date range (see `getSessionHistoryForPackageSale` in
  `packageRepository.ts` for the pattern).
- **Supabase dashboard settings this repo can't apply itself**: the
  `https://picobase.com.br/**` redirect URL allowlist under Authentication →
  URL Configuration needs to be confirmed in the Supabase project — the code
  side (`redirectTo` on invite/reset emails) is done, but that dashboard
  setting is out-of-repo.
- **A pending reschedule request that fails package-capacity on approval
  stays pending forever** — there's no path for the student to withdraw
  their own request, and no automatic expiry. Staff has to notice and
  reject it manually, or get the student a new package first and re-approve.
- **The student self-service WhatsApp link is only sendable from Base
  Camp's "Aulas Agendadas" list** (`ScheduledLessons.tsx`'s WhatsApp
  picker). `/owner/sessions`' "Agendadas" tab uses a separate query
  (`getScheduledLessonsList`) that doesn't select `public_token` yet, so the
  option isn't available there.
- **Per-sport certificate hours (student detail page) inherit the existing
  group-lesson gap**: `groupSessionsBySport` sums `sessions.duration_min`
  from `getSessionsByStudent`, which is checkin-keyed — group-confirmed
  lessons have no `checkins` row (see `getCompletedHoursByStudent`'s own
  doc comment), so their minutes aren't attributed to anyone. A student
  whose hours came mostly from group lessons can under-count toward the
  1h/"Atestado de Horas" threshold.
