import { getSchoolContext } from '@/lib/auth/get-school-context'
import { createServiceClient } from '@/lib/supabase-server'
import {
  getStudentById,
  getSessionsByStudent,
  getLatestProgressionBySport,
} from '@/repositories/studentRepository'
import { resolveCertificateTemplate } from '@/repositories/certificateTemplateRepository'
import { isProficientLevel } from '@/lib/levelProgression'
import { groupSessionsBySport, normalizeSportKey, translateModalityName } from '@/lib/modality'
import { renderToBuffer } from '@react-pdf/renderer'
import { CertificatePDF } from '@/lib/certificate-pdf'
import React from 'react'

const MIN_MINUTES_FOR_HOURS_DOC = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string; sport: string }> }
) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response
  const { studentId, sport } = await params
  const { searchParams } = new URL(request.url)
  const docType: 'hours' | 'proficiency' = searchParams.get('type') === 'proficiency' ? 'proficiency' : 'hours'

  let student
  try {
    student = await getStudentById(school.ctx.schoolId, studentId)
  } catch {
    return jsonError('Aluno não encontrado', 404)
  }

  const sessions = await getSessionsByStudent(school.ctx.schoolId, student.name)
  const groups = groupSessionsBySport(sessions as any)
  const sportKey = normalizeSportKey(sport) ?? sport
  const group = groups.get(sportKey)

  if (!group) {
    return jsonError('Nenhuma aula concluída nessa modalidade', 404)
  }
  if (docType === 'hours' && group.minutes < MIN_MINUTES_FOR_HOURS_DOC) {
    return jsonError('Menos de 1h concluída nessa modalidade', 404)
  }

  let level: string | null = null
  if (docType === 'proficiency') {
    const progressionBySport = await getLatestProgressionBySport(school.ctx.schoolId, studentId)
    level = progressionBySport.get(sportKey)?.level ?? null
    if (!isProficientLevel(level)) {
      return jsonError('Nível de proficiência ainda não atingido nessa modalidade', 404)
    }
  }

  const supabase = createServiceClient()
  const [{ data: schoolRow }, { data: owner }, template] = await Promise.all([
    supabase.from('schools').select('name, logo_url').eq('id', school.ctx.schoolId).single(),
    supabase.from('users').select('name').eq('school_id', school.ctx.schoolId).eq('role', 'owner').limit(1).maybeSingle(),
    resolveCertificateTemplate(school.ctx.schoolId, sportKey),
  ])

  const data = {
    docType,
    studentName: student.name,
    activityName: translateModalityName(sportKey, 'pt'),
    level,
    hoursTotal: Math.round((group.minutes / 60) * 10) / 10,
    completedAt: group.lastDate,
    instructorName: group.lastInstructorName,
    schoolName: schoolRow?.name ?? 'Escola',
    ownerName: owner?.name ?? 'Diretor',
    certificateId: `PB-${studentId.slice(0, 8).toUpperCase()}-${sportKey.slice(0, 3).toUpperCase()}`,
    schoolLogoUrl: schoolRow?.logo_url ?? null,
    themeKey: template.theme_key,
    backgroundImageUrl: template.background_image_url,
    signatureType: template.signature_type,
    signatureData: template.signature_data,
    fontFamily: template.font_family,
  }

  const pdf = await renderToBuffer(React.createElement(CertificatePDF, data) as any)
  const filenameSuffix = docType === 'proficiency' ? 'certificado' : 'atestado'

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenameSuffix}_${student.name.replace(/\s+/g, '_')}_${sportKey}.pdf"`,
    },
  })
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
