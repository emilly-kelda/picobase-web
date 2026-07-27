// Pure skill/level logic shared between the server (api/owner/progression's
// save-time auto-advance) and the client (ProgressionEditor's live preview
// as checkboxes are toggled). Lives outside studentRepository.ts on purpose:
// that module imports @/lib/supabase-server (next/headers), which cannot be
// pulled into a 'use client' component — this file has zero dependencies so
// both sides can share the exact same rule instead of drifting apart.

// wingfoil/windsurf/default follow the IKO-style "control fundamentals ->
// first ride -> autonomous riding" shape against ProgressionEditor.tsx's own
// SKILLS_BY_SPORT keys, since no equivalent governing body was given for
// those sports. kitesurf uses this school's own real grading criteria
// instead (see deriveKitesurfLevel below), which isn't a flat "every skill
// in this bucket" list — Level 3 has three alternate qualifying paths, not
// one all-of-four requirement.
export const LEVEL_ORDER = ['level_1_discovery', 'level_2_intermediate', 'level_3_independent'] as const

export const LEVEL_SKILLS: Record<string, Record<string, string[]>> = {
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

/** This school's real kitesurf grading criteria — an OR/AND decision tree,
 *  not "every skill in a bucket" like the other sports below. Evaluated
 *  top-down (Level 3's condition checked first) since its three qualifying
 *  paths overlap with Level 2's:
 *  - Level 3 (Independent): 'independent' alone, OR 'jumps' alone, OR
 *    'upwind' AND 'transitions' together.
 *  - Level 2 (Intermediate): 'water_start' alone, OR 'upwind' alone.
 *  - Level 1 (Discovery): none of the above yet. */
function deriveKitesurfLevel(skills: string[]): string {
  const has = (key: string) => skills.includes(key)
  if (has('independent') || has('jumps') || (has('upwind') && has('transitions'))) {
    return 'level_3_independent'
  }
  if (has('water_start') || has('upwind')) {
    return 'level_2_intermediate'
  }
  return 'level_1_discovery'
}

/** The 'default' bucket is different in kind from wingfoil/windsurf's:
 *  its skill keys (basics/intermediate/advanced/independent) are direct
 *  aliases of the level names themselves (ProgressionEditor.tsx's own
 *  ["Fundamentos", "Nível intermediário", "Técnicas avançadas",
 *  "Independente"] labels), not a sub-skill curriculum to complete
 *  before advancing OUT of the current level the way
 *  wingfoil/windsurf's buckets are. Routing this through the generic
 *  "does checking the current level's own required skill count as
 *  completing it -> advance one more" rule below caused a real bug:
 *  checking 'intermediate' while already AT level_2_intermediate
 *  satisfied level_2's own requirement and bumped straight to level_3,
 *  even though that skill only ever meant "this student is at Level 2",
 *  not "ready to leave Level 2". Direct mapping instead — same
 *  never-downgrade-a-manual-pick rule as deriveKitesurfLevel. */
function deriveDefaultLevel(level: string, skills: string[]): string {
  const has = (key: string) => skills.includes(key)
  let derived = 'level_1_discovery'
  if (has('intermediate')) derived = 'level_2_intermediate'
  if (has('advanced') || has('independent')) derived = 'level_3_independent'
  const currentIdx = LEVEL_ORDER.indexOf(level as typeof LEVEL_ORDER[number])
  const derivedIdx = LEVEL_ORDER.indexOf(derived as typeof LEVEL_ORDER[number])
  if (currentIdx === -1) return derived
  return derivedIdx > currentIdx ? derived : level
}

/** IKO/VDWS proficiency threshold — Level 2+ (covers both the new level_N
 *  keys and the legacy beginner/intermediate/advanced ones stored before
 *  the 20260809000003 data migration). Certification is skill-based per
 *  IKO's own standard, not time-based — a student who picks up the
 *  required skills quickly shouldn't be blocked by an hours count. Shared
 *  by CertificateSection.tsx, the certificate generation route, and every
 *  student-profile page's certificate-eligibility badge, so "proficient
 *  enough for a certificate" can't mean something different in one place
 *  than another. */
export function isProficientLevel(level: string | null | undefined): boolean {
  return level === 'level_2_intermediate' || level === 'level_3_independent'
    || level === 'intermediate' || level === 'advanced'
}

/** Given the level being saved and the full set of currently-checked skill
 *  keys, returns the level to actually persist. kitesurf derives the target
 *  level directly from skills (deriveKitesurfLevel) and only ever advances
 *  — never downgrades — relative to `level`, so a manually-picked higher
 *  level from an experienced walk-in is never silently reset back down by
 *  an incomplete skill set. wingfoil/windsurf keep the simpler "every skill
 *  required for `level` is checked -> advance one step" rule, since their
 *  buckets are genuine sub-skill curricula. Any other sport (no dedicated
 *  mapping) falls back to deriveDefaultLevel, not the advance-one-step
 *  rule — see that function's own comment for why those two don't mix. */
export function resolveLevelAfterSkillsUpdate(
  sport: string,
  level: string,
  skills: string[]
): string {
  if (sport === 'kitesurf') {
    const derived = deriveKitesurfLevel(skills)
    const currentIdx = LEVEL_ORDER.indexOf(level as typeof LEVEL_ORDER[number])
    const derivedIdx = LEVEL_ORDER.indexOf(derived as typeof LEVEL_ORDER[number])
    if (currentIdx === -1) return derived
    return derivedIdx > currentIdx ? derived : level
  }

  if (!LEVEL_SKILLS[sport]) {
    return deriveDefaultLevel(level, skills)
  }

  const required = LEVEL_SKILLS[sport][level]
  if (!required || required.length === 0) return level
  const complete = required.every(key => skills.includes(key))
  if (!complete) return level
  const idx = LEVEL_ORDER.indexOf(level as typeof LEVEL_ORDER[number])
  if (idx === -1 || idx === LEVEL_ORDER.length - 1) return level
  return LEVEL_ORDER[idx + 1]
}
