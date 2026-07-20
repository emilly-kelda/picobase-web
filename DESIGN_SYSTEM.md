# Pico Base — Design System v1

Source: `picobase_design_system_dossie.md`. This file is the quick-reference
left behind after implementing it (Fases 0-5), so the next session doesn't
have to re-derive it from the diff.

## Tokens (`src/app/tokens.css`)

Registered via Tailwind v4's `@theme` directive (this project has no
`tailwind.config.ts` — v4 is CSS-first, `@theme` is what generates the
`bg-pb-*`/`text-pb-*`/`border-pb-*` utility classes).

| Token              | Hex       | Use                          |
|--------------------|-----------|-------------------------------|
| `pb-slate`         | `#1A1C22` | Nav, primary text (also the sidebar's active-row background) |
| `pb-storm`         | `#2B3340` | Sidebar background (dark theme) |
| `pb-glacial`       | `#00A896` | Primary action, links, active indicator |
| `pb-signal`        | `#E8471A` | Alert, error, urgent |
| `pb-powder`        | `#F0EEE9` | Page background, metric-card fill |
| `pb-white`         | `#FFFFFF` | Cards, inputs, surfaces |
| `pb-glacial-light` | `#E0F8F5` | Success background |
| `pb-glacial-dark`  | `#007868` | Success text |
| `pb-signal-light`  | `#FDF0EC` | Error background |
| `pb-mist`          | `#8A8C98` | Muted/secondary text |
| `pb-border`        | `#E4E2DB` | Borders |

**This is a separate namespace from the pre-existing `--slate`/`--storm`/
`--glacial`/`--signal`/... CSS variables in `globals.css`** (different hex
values — e.g. the old `--glacial` is `#1A6B7A`, not `#00A896`). The two
systems coexist deliberately: `pb-*` is live today only on the three screens
Fase 4 touched (Base Camp, Aulas Agendadas, Sala de Espera) plus the shared
`ui/` components; everything else in the app still renders with the older
tokens until a future pass extends `pb-*` there too. Don't assume `var(--glacial)`
and `pb-glacial` are interchangeable — they render different colors today.

`--signal` is used here as the danger color per the dossiê's explicit
instruction, even though `globals.css`'s own comment reserves the
pre-existing `--signal` for the logo only and designates `--error`
(`#C53030`) for functional danger states. This was a deliberate choice
(confirmed with the user), not an oversight.

## Components (`src/components/ui/`)

- **`Button.tsx`** — `variant`: `primary` / `secondary` / `tertiary` / `danger`.
  8px radius (`rounded-lg`) on all variants. Convention: at most one
  `primary` per card or list row; `danger` is reserved for genuine urgency
  (selling a package to a student with no credit, removing an instructor),
  not general destructive actions.
- **`Badge.tsx`** — `variant`: `success` / `danger` / `neutral`. Always a
  light-background + dark-text pair from the same color family, never plain
  text on a saturated fill. 6px radius, `3px 8px` padding, 11px text.

Both use Tailwind utility classes (`bg-pb-glacial text-pb-white...`) — this
is a deliberate exception to the rest of the app's inline-`style={{}}` +
`var(--x)` convention, confirmed with the user rather than assumed. New
screen-level code (Base Camp, ScheduledLessons.tsx, PendingLessons.tsx) was
NOT rewritten into Tailwind classes wholesale; it keeps its existing inline
styles and references the new tokens via `var(--color-pb-*)` (the raw CSS
custom properties Tailwind's `@theme` also emits), composing the `Button`/
`Badge` components where the dossiê asked for them by name.

Preview page (no Storybook in this project): **`/owner/dev-design-system`**
— behind the normal `/owner` auth guard, not linked from the sidebar. Safe
to delete once nothing references it as a live reference anymore.

## Known contrast gaps (Fase 5 check)

Computed against WCAG 2.1 contrast ratios (not visually confirmed — no
local dev server was run this session; verify on a real screen when
convenient):

- **`Badge neutral`** (`pb-mist` `#8A8C98` text on `pb-powder` `#F0EEE9`)
  ≈ **2.88:1** — fails AA for normal text (needs 4.5:1) and even large text
  (needs 3:1). This is the exact pair the dossiê specified; the low
  contrast comes from both colors being light-to-mid gray.
- **`Badge danger`** (`pb-signal` `#E8471A` text on `pb-signal-light`
  `#FDF0EC`) ≈ **3.52:1** — fails AA for normal text, passes for large
  text/UI graphics (3:1). The pre-existing app avoids this exact problem
  elsewhere by using a separate, darker `--signal-dark` (`#B83010`) for
  text on light backgrounds instead of the raw `--signal`; the dossiê's
  Badge spec calls for the raw `pb-signal` value specifically.
- **`Badge success`** (`pb-glacial-dark` on `pb-glacial-light`) ≈ **4.87:1**
  — passes AA.

Left as specified rather than silently adjusted, since the palette was a
deliberate "use these exact hex values" decision. If this needs to be AA
compliant, the fix is a darker text color for `neutral`/`danger` (e.g. a
`pb-signal-dark` alongside the existing `pb-glacial-dark`), not a different
background.

## What's still on the old tokens

Fase 0's green-hex sweep found 77 raw-hex/`bg-green-*` occurrences across 27
files outside the three screens this dossiê covers (reports, packages,
crew, checkin/booking/marketing pages, `InstructorPWA.tsx`, etc.) — full
list in commit `bb121d7`'s message. Not touched here; scope was Base Camp,
Aulas Agendadas, and Sala de Espera only.
