import { getStudents, getStudentCount, getActivePackagesByStudent, getCheckinOnlyStudents } from '@/repositories/studentRepository'
import { getPortalLang } from '@/lib/language'
import { getT } from '@/lib/i18n'
import StudentsClient from './StudentsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const [students, total, packageMap, checkinOnly, lang] = await Promise.all([
    getStudents(SCHOOL_ID, search),
    getStudentCount(SCHOOL_ID),
    getActivePackagesByStudent(SCHOOL_ID),
    getCheckinOnlyStudents(SCHOOL_ID, search),
    getPortalLang(),
  ])
  const t = getT(lang)

  return (
    <StudentsClient
      students={students}
      total={total}
      packageMap={packageMap}
      checkinOnly={checkinOnly}
      search={search}
      t={t}
    />
  )
}
