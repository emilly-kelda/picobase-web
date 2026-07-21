import type { CSSProperties } from 'react'

// Sport/modality icons — static single-path SVGs in public/icons/sports/
// (school-provided assets, not hand-drawn like nav-icons.tsx/weather-icons.tsx).
// Rendered via a CSS mask instead of inlining the path data (some of these
// files are a few KB of coordinates) or a plain <img> (which would always
// render flat black — these need to inherit surrounding text color: the
// package chips use a different color per sport, the check-in buttons
// recolor on select). mask-image + backgroundColor: currentColor gets both
// a static-file win and correct per-context tinting from one source file.

const SPORT_ICON_FILES: Record<string, string> = {
  kitesurf: 'kitesurf',
  kitefoil: 'kitefoil',
  windsurf: 'windsurf',
  surf:     'surf',
  downwind: 'downwind',
  aluguel:  'aluguel',
}

/** Same prefix-match convention as lib/modality.ts's MODALITY_LABELS —
 *  normalize then startsWith, not substring ("Surf" is a substring of both
 *  "Kitesurf" and "Windsurf" but a prefix of neither). Returns null for
 *  anything without a provided icon (wingfoil, supervisão, or an
 *  unrecognized school-added category) so callers can fall back to
 *  whatever they showed before this existed. */
export function sportIconKey(name: string | null | undefined): string | null {
  if (!name) return null
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '')
  const key = Object.keys(SPORT_ICON_FILES).find(k => normalized.startsWith(k))
  return key ? SPORT_ICON_FILES[key] : null
}

export function SportIcon({
  name,
  size = 20,
  style,
}: {
  name: string | null | undefined
  size?: number
  style?: CSSProperties
}) {
  const key = sportIconKey(name)
  if (!key) return null
  const maskUrl = `url(/icons/sports/${key}.svg)`
  return (
    <span
      style={{
        display: 'inline-block', width: size, height: size, flexShrink: 0,
        backgroundColor: 'currentColor',
        WebkitMaskImage: maskUrl, maskImage: maskUrl,
        WebkitMaskSize: 'contain', maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center', maskPosition: 'center',
        ...style,
      }}
    />
  )
}
