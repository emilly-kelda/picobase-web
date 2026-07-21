// Monochrome stroke icons replacing the emoji weather glyphs (lib/weather.ts
// used to return '☀️'/'🌧️'/etc. directly) — same inline-SVG convention as
// nav-icons.tsx: 24x24 viewBox, stroke="currentColor", strokeWidth 1.5, no
// fill, so this reads as one icon family with the sidebar.

import type { WeatherIconKind } from '@/lib/weather'

const base = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function WeatherIcon({ kind, size = 24 }: { kind: WeatherIconKind; size?: number }) {
  const props = { width: size, height: size, ...base }

  switch (kind) {
    case 'sun':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8" />
        </svg>
      )
    case 'partly-cloudy':
      return (
        <svg {...props}>
          <path d="M9 8.5a4 4 0 0 1 7.9-1" />
          <path d="M6.5 20A4.5 4.5 0 0 1 5.8 11a5 5 0 0 1 9.7.6" />
          <path d="M17 13.5a3.5 3.5 0 0 1 0 7H7.5" />
        </svg>
      )
    case 'cloudy':
      return (
        <svg {...props}>
          <path d="M6.5 19.5A4.5 4.5 0 0 1 5.8 10.6a5.5 5.5 0 0 1 10.7 1" />
          <path d="M16.5 20a3.5 3.5 0 0 0 0-7 4.5 4.5 0 0 0-1 .1" />
        </svg>
      )
    case 'fog':
      return (
        <svg {...props}>
          <path d="M6.5 15A4.5 4.5 0 0 1 5.8 6.6a5.5 5.5 0 0 1 10.7 1" />
          <path d="M4 18.5h16M4 21.5h16M6 8.5" />
        </svg>
      )
    case 'rain':
      return (
        <svg {...props}>
          <path d="M6.5 15A4.5 4.5 0 0 1 5.8 6.6a5.5 5.5 0 0 1 10.7 1A4 4 0 0 1 17 15.5" />
          <path d="M8.5 18v3M12.5 18v3M16.5 18v3" />
        </svg>
      )
    case 'snow':
      return (
        <svg {...props}>
          <path d="M6.5 14A4.5 4.5 0 0 1 5.8 5.6a5.5 5.5 0 0 1 10.7 1A4 4 0 0 1 17 14.5" />
          <path d="M8.5 17.5v4M6.5 19.5h4M12.5 17.5v4M10.5 19.5h4M16.5 17.5v4M14.5 19.5h4" />
        </svg>
      )
    case 'storm':
      return (
        <svg {...props}>
          <path d="M6.5 13.5A4.5 4.5 0 0 1 5.8 5.1a5.5 5.5 0 0 1 10.7 1A4 4 0 0 1 17 14" />
          <path d="M13 14.5 10 19h3l-1.5 4" />
        </svg>
      )
  }
}
