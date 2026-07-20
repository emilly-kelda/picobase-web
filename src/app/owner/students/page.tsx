import { getStudents, getStudentCount, getActivePackagesByStudent, getCheckinOnlyStudents, getInstructors } from '@/repositories/studentRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getPackages } from '@/repositories/packageRepository'
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
  const [students, total, packageMap, checkinOnly, lang, activities, instructors, packageTypes] = await Promise.all([
    getStudents(SCHOOL_ID, search),
    getStudentCount(SCHOOL_ID),
    getActivePackagesByStudent(SCHOOL_ID),
    getCheckinOnlyStudents(SCHOOL_ID, search),
    getPortalLang(),
    // For the per-row "[ Agendar ]" / "[ Cobrar/Vender ]" quick actions —
    // same option lists ScheduledLessons.tsx/QuickSaleCard already use for
    // the same two modals, reused here rather than duplicated.
    getActivitiesForCheckin(SCHOOL_ID),
    getInstructors(SCHOOL_ID),
    getPackages(SCHOOL_ID),
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
      activities={activities}
      instructors={instructors}
      packageTypes={packageTypes as any}
    />
  )
}
