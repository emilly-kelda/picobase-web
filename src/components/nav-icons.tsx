// Minimalist stroke icons for the owner sidebar. No icon library is
// installed in this project (checked package.json) — these follow the same
// hand-drawn inline-SVG convention already used elsewhere (e.g. the empty
// state in ScheduledLessons.tsx: 24x24 viewBox, stroke="currentColor",
// strokeWidth 1.5, no fill), so the sidebar doesn't introduce a new pattern.

type IconProps = { size?: number }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function HomeIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function CalendarIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
    </svg>
  )
}

export function UserIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
    </svg>
  )
}

export function InboxIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M3.5 12h4.5l1.5 3h5l1.5-3h4.5" />
      <path d="M5 5.5h14l2 6.5v7a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19v-7l2-6.5Z" />
    </svg>
  )
}

export function UsersIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c1-3.3 3.3-5 6.5-5s5.5 1.7 6.5 5" />
      <path d="M15.5 6a3 3 0 0 1 0 5.8" />
      <path d="M17.5 15.3c2.3.5 3.7 1.9 4.5 4.7" />
    </svg>
  )
}

export function PackageIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M3.5 7.5 12 3l8.5 4.5V16L12 20.5 3.5 16Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v8.5" />
    </svg>
  )
}

export function WalletIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M15.5 14h2.5" />
    </svg>
  )
}

export function ChartIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M4 20V10M11 20V4M18 20v-6" />
      <path d="M3 20.5h18" />
    </svg>
  )
}

export function GearIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7 6.3 6.3" />
    </svg>
  )
}

export function PlusCircleIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

export function TagIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M11.5 3.5h6A2 2 0 0 1 19.5 5.5v6a2 2 0 0 1-.6 1.4l-8 8a2 2 0 0 1-2.8 0l-5.5-5.5a2 2 0 0 1 0-2.8l8-8a2 2 0 0 1 1.4-.6Z" />
      <circle cx="15" cy="8" r="1.5" />
    </svg>
  )
}

export function LinkIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 13.2 4.3a3.5 3.5 0 1 1 5 5L16 11.5" />
      <path d="M13 17.5 10.8 19.7a3.5 3.5 0 1 1-5-5L8 12.5" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

export function SunIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8" />
    </svg>
  )
}

export function MoonIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  )
}

export function PencilIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M15.5 4.5 19.5 8.5 8 20H4v-4Z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  )
}

export function LightbulbIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M9 18.5h6M9.5 21.5h5" />
      <path d="M12 2.5a6.5 6.5 0 0 0-3.5 12c.6.4 1 1.1 1 1.8v.7h5v-.7c0-.7.4-1.4 1-1.8a6.5 6.5 0 0 0-3.5-12Z" />
    </svg>
  )
}
