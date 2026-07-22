'use client'

import { useState } from 'react'
import { translateModalityName } from '@/lib/modality'
import CertificatePreviewModal from '@/components/CertificatePreviewModal'

type SportGroup = { minutes: number; lastInstructorName: string | null; lastDate: string }
type Progression = { level: string; updatedAt: string }

const pillBase = {
  display: 'inline-flex' as const, alignItems: 'center' as const, gap: '6px',
  padding: '6px 14px', borderRadius: '99px',
  fontSize: '12px', fontWeight: '500' as const,
  whiteSpace: 'nowrap' as const, fontFamily: 'var(--font-sans)', border: 'none',
}
const pillEnabled = { ...pillBase, background: 'var(--slate)', color: '#fff', cursor: 'pointer' }
const pillDisabled = { ...pillBase, background: 'var(--border)', color: 'var(--mist)', cursor: 'not-allowed' }

/** "Certificados" section on the student detail page(s) — one row per
 *  modality the student has completed sessions in, each with two documents
 *  (hours logbook, proficiency certificate) gated independently. Shared
 *  between /owner/students/[id] and /owner/students/name/[encodedName]
 *  since both need the exact same per-sport breakdown. Enabled pills open
 *  CertificatePreviewModal (preview + download + WhatsApp) instead of
 *  linking straight to the PDF. */
export default function CertificateSection({
  studentId,
  studentName,
  whatsapp,
  siteOrigin,
  sportGroups,
  progressionBySport,
}: {
  /** null when this "student" has no real students row (check-in-only) —
   *  the certificate API is keyed by a real student id, so nothing here
   *  can be generated until the student has a proper record. */
  studentId: string | null
  studentName: string
  whatsapp: string | null
  siteOrigin: string
  sportGroups: Map<string, SportGroup>
  progressionBySport: Map<string, Progression>
}) {
  const [preview, setPreview] = useState<{ sportKey: string; docType: 'hours' | 'proficiency' } | null>(null)

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
          // Checks both the new IKO-style keys and the old
          // beginner/intermediate/advanced ones — a brief window can exist
          // between this code deploying and the 20260809000003 data
          // migration actually running against production.
          const proficiencyOk = level === 'level_2_intermediate' || level === 'level_3_independent'
            || level === 'intermediate' || level === 'advanced'
          const isBeginnerLevel = level === 'level_1_discovery' || level === 'beginner'
          const proficiencyTitle = proficiencyOk
            ? undefined
            : isBeginnerLevel
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
                  <button onClick={() => setPreview({ sportKey, docType: 'hours' })} style={pillEnabled}>
                    📄 Atestado de Horas
                  </button>
                ) : (
                  <span title="Disponível a partir de 1h concluída" style={pillDisabled}>
                    📄 Atestado de Horas
                  </span>
                )}
                {proficiencyOk ? (
                  <button onClick={() => setPreview({ sportKey, docType: 'proficiency' })} style={pillEnabled}>
                    🏆 Certificado de Proficiência
                  </button>
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

      {preview && studentId && (
        <CertificatePreviewModal
          key={`${preview.sportKey}-${preview.docType}`}
          studentId={studentId}
          studentName={studentName}
          whatsapp={whatsapp}
          sportKey={preview.sportKey}
          sportLabel={translateModalityName(preview.sportKey, 'pt')}
          docType={preview.docType}
          siteOrigin={siteOrigin}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
