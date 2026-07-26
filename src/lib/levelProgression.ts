// Pure skill/level logic shared between the server (api/owner/progression's
// save-time auto-advance) and the client (ProgressionEditor's live preview
// as checkboxes are toggled). Lives outside studentRepository.ts on purpose:
// that module imports @/lib/supabase-server (next/headers), which cannot be
// pulled into a 'use client' component — this file has zero dependencies so
// both sides can share the exact same rule instead of drifting apart.

// IKO-aligned skill→level requirement map for the auto-advance rule below.
// kitesurf follows the IKO's published 3-stage curriculum (Discovery:
// wind/safety/kite control/body drag; Intermediate: water start; Independent:
// upwind riding, transitions, self-rescue, first jumps) exactly. wingfoil/
// windsurf/default mirror the same "control fundamentals -> first ride ->
// autonomous riding" shape against ProgressionEditor.tsx's own SKILLS_BY_SPORT
// keys, since no equivalent governing body was given for those sports.
export const LEVEL_ORDER = ['level_1_discovery', 'level_2_intermediate', 'level_3_independent'] as const

export const LEVEL_SKILLS: Record<string, Record<string, string[]>> = {
  kitesurf: {
    level_1_discovery:    ['kite_control', 'body_drag'],
    level_2_intermediate: ['water_start'],
    level_3_independent:  ['upwind', 'transitions', 'jumps', 'independent'],
  },
  wingfoil: {
    level_1_discovery:    ['wing_control', 'body_drag'],
    level_2_intermediate: ['water_start', 'foil_takeoff'],
    level_3_independent:  ['upwind', 'sustained_foil', 'tack_jibe'],
  },
  windsurf: {
    level_1_discovery:    ['rig_control', 'beach_start'],
    level_2_intermediate: ['upwind', 'tack'],
    level_3_independent:  ['jibe', 'planing'],
  },
  default: {
    level_1_discovery:    ['basics'],
    level_2_intermediate: ['intermediate'],
    level_3_independent:  ['advanced', 'independent'],
  },
}

/** Given the level being saved and the full set of currently-checked skill
 *  keys, returns the level to actually persist: the next level up if every
 *  skill required for `level` is already checked, otherwise `level`
 *  unchanged. No-op past the top of LEVEL_ORDER, and falls back to the
 *  'default' bucket for a sport with no dedicated mapping. Never downgrades
 *  — a manually-picked higher level is always left as-is, since the
 *  required-skills check for that level either passes (stays) or fails
 *  (also stays, just doesn't advance further). */
export function resolveLevelAfterSkillsUpdate(
  sport: string,
  level: string,
  skills: string[]
): string {
  const required = LEVEL_SKILLS[sport]?.[level] ?? LEVEL_SKILLS.default[level]
  if (!required || required.length === 0) return level
  const complete = required.every(key => skills.includes(key))
  if (!complete) return level
  const idx = LEVEL_ORDER.indexOf(level as typeof LEVEL_ORDER[number])
  if (idx === -1 || idx === LEVEL_ORDER.length - 1) return level
  return LEVEL_ORDER[idx + 1]
}
