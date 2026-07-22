import { translateModalityName } from '@/lib/modality'

type SportGroup = { minutes: number; lastInstructorName: string | null; lastDate: string }
type Progression = { level: string; updatedAt: string }

const pillBase = {
  display: 'inline-flex' as const, alignItems: 'center' as const, gap: '6px',
  padding: '6px 14px', borderRadius: '99px',
  fontSize: '12px', fontWeight: '500' as const, textDecoration: 'none' as const,
  whiteSpace: 'nowrap' as const,
}
const pillEnabled = { ...pillBase, background: 'var(--slate)', color: '#fff', cursor: 'pointer' }
const pillDisabled = { ...pillBase, background: 'var(--border)', color: 'var(--mist)', cursor: 'not-allowed' }

/** "Certificados" section on the student detail page(s) — one row per
 *  modality the student has completed sessions in, each with two documents
 *  (hours logbook, proficiency certificate) gated independently. Shared
 *  between /owner/students/[id] and /owner/students/name/[encodedName]
 *  since both need the exact same per-sport breakdown. */
export default function CertificateSection({
  studentId,
  sportGroups,
  progressionBySport,
}: {
  /** null when this "student" has no real students row (check-in-only) —
   *  the certificate API is keyed by a real student id, so nothing here
   *  can be generated until the student has a proper record. */
  studentId: string | null
  sportGroups: Map<string, SportGroup>
  progressionBySport: Map<string, Progression>
}) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px', marginBottom: '24px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: '500',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--mist)',
      }}>
        Certificados
      </div>

      {!studentId ? (
        <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Disponível assim que o cadastro do aluno estiver completo.
        </div>
      ) : sportGroups.size === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Nenhuma aula concluída ainda
        </div>
      ) : (
        [...sportGroups.entries()].map(([sportKey, group]) => {
          const hoursOk = group.minutes >= 60
          const level = progressionBySport.get(sportKey)?.level ?? null
          const proficiencyOk = level === 'intermediate' || level === 'advanced'
          const proficiencyTitle = proficiencyOk
            ? undefined
            : level === 'beginner'
              ? 'Disponível a partir do Nível 2'
              : 'Aguardando avaliação do instrutor'

          return (
            <div key={sportKey} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: '10px', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--slate)' }}>
                {translateModalityName(sportKey, 'pt')}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {hoursOk ? (
                  <a
                    href={`/api/owner/certificate/${studentId}/${sportKey}?type=hours`}
                    target="_blank" rel="noopener noreferrer"
                    style={pillEnabled}
                  >
                    📄 Atestado de Horas
                  </a>
                ) : (
                  <span title="Disponível a partir de 1h concluída" style={pillDisabled}>
                    📄 Atestado de Horas
                  </span>
                )}
                {proficiencyOk ? (
                  <a
                    href={`/api/owner/certificate/${studentId}/${sportKey}?type=proficiency`}
                    target="_blank" rel="noopener noreferrer"
                    style={pillEnabled}
                  >
                    🏆 Certificado de Proficiência
                  </a>
                ) : (
                  <span title={proficiencyTitle} style={pillDisabled}>
                    🏆 Certificado de Proficiência
                  </span>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
