'use client'

import { useState, useEffect, useRef } from 'react'
import { translateModalityName } from '@/lib/modality'
import ProgressionEditor from '@/components/ProgressionEditor'

type SportProgression = { level: string; skills: string[] }

/** Wraps ProgressionEditor with a per-sport tab switcher — a student with
 *  packages in more than one sport (most commonly Kitesurf + Surf) has
 *  genuinely separate level/skills per sport, so editing one must never
 *  touch the other's saved progression. Hidden entirely for the common
 *  single-sport case, where a bare editor is all there is to switch
 *  between. `key={activeSport}` on ProgressionEditor forces a full
 *  remount on tab change — that component seeds its level/skills state
 *  from props only once at mount, so swapping sports without remounting
 *  would leave the previous sport's values showing.
 *
 *  Deep-linkable from the package cards above: each links to
 *  #evolucao-{sport}, which this component picks up on mount and on
 *  hashchange to both select the right tab and scroll itself into view —
 *  a plain server-rendered <a>, no click handler needed on the card. */
export default function ProgressionTabs({
  studentId,
  studentName,
  sports,
  progressionBySport,
  fallbackLevel,
}: {
  studentId: string
  studentName: string
  /** Normalized (normalizeSportKey), deduped, at least one entry. */
  sports: string[]
  progressionBySport: Map<string, SportProgression>
  /** students.skill_level — seeds a sport that has no student_progression
   *  row yet (new student, or a sport never explicitly graded before). */
  fallbackLevel: string | null
}) {
  const [activeSport, setActiveSport] = useState(sports[0])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function syncFromHash() {
      const match = window.location.hash.match(/^#evolucao-(.+)$/)
      if (!match) return
      const target = match[1]
      if (sports.includes(target)) {
        setActiveSport(target)
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = progressionBySport.get(activeSport)

  return (
    <div ref={containerRef}>
      {sports.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${activeSport === sport ? 'var(--slate)' : 'var(--border)'}`,
                background: activeSport === sport ? 'var(--slate)' : '#fff',
                color: activeSport === sport ? '#fff' : 'var(--mist)',
                fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
              }}
            >
              {translateModalityName(sport, 'pt')}
            </button>
          ))}
        </div>
      )}
      <ProgressionEditor
        key={activeSport}
        studentId={studentId}
        studentName={studentName}
        currentLevel={current?.level ?? fallbackLevel ?? 'level_1_discovery'}
        currentSkills={current?.skills ?? []}
        sport={activeSport}
      />
    </div>
  )
}
