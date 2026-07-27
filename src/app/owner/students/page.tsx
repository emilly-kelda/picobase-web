import { getStudents, getStudentCount, getActivePackageListByStudent, getCheckinOnlyStudents, getInstructors, getCompletedHoursByStudent } from '@/repositories/studentRepository'
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
  const [students, total, activePackagesList, checkinOnly, lang, activities, instructors, packageTypes, hoursMap] = await Promise.all([
    getStudents(SCHOOL_ID, search),
    getStudentCount(SCHOOL_ID),
    getActivePackageListByStudent(SCHOOL_ID),
    getCheckinOnlyStudents(SCHOOL_ID, search),
    getPortalLang(),
    // For the per-row "[ Agendar ]" / "[ Cobrar/Vender ]" quick actions —
    // same option lists ScheduledLessons.tsx/QuickSaleCard already use for
    // the same two modals, reused here rather than duplicated.
    getActivitiesForCheckin(SCHOOL_ID),
    getInstructors(SCHOOL_ID),
    getPackages(SCHOOL_ID),
    // IKO/VDWS 10h autonomy-certificate eligibility badge.
    getCompletedHoursByStudent(SCHOOL_ID),
  ])
  const t = getT(lang)

  // The roster table's per-row balance is one compact progress bar (not
  // room for a full per-sport breakdown like the profile page now has),
  // so this combines a student's active packages into a single summary —
  // package_name lists every distinct name when there's more than one,
  // rather than silently picking just one and hiding the rest.
  const packageMap = new Map<string, { package_name: string; minutes_purchased: number; minutes_used: number }>()
  for (const [name, packages] of activePackagesList) {
    packageMap.set(name, {
      package_name: [...new Set(packages.map(p => p.package_name))].join(' + '),
      minutes_purchased: packages.reduce((s, p) => s + p.minutes_purchased, 0),
      minutes_used: packages.reduce((s, p) => s + p.minutes_used, 0),
    })
  }

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
      hoursMap={hoursMap}
    />
  )
}
