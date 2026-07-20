'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LEVEL_LABELS, isLevel } from '@/lib/levels'
import LevelPicker from '@/components/LevelPicker'
import { whatsappDigitsWithCountryCode } from '@/lib/whatsapp'
import { Toast, useToast } from '@/components/Toast'
import ConfirmLessonModal from '@/components/ConfirmLessonModal'
import { translateModalityName } from '@/lib/modality'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import OverflowMenu from '@/components/ui/OverflowMenu'

type Lesson = {
  id: string
  student_name: string | null
  scheduled_at: string
  duration_min: number
  status: string
  notes: string | null
  level: string | null
  group_id: string | null
  student_whatsapp?: string | null
  activities: { id: string; name: string; default_price: number; default_duration_min: number } | null
  instructor: { id: string; name: string; whatsapp?: string | null } | null
}

type Activity = {
  id: string
  name: string
  default_price: number
  default_duration_min: number
}

type Instructor = {
  id: string
  name: string
  commission_pct: number | null
}

type PackageSale = {
  id: string
  student_name: string
  minutes_purchased: number
  minutes_used: number
  sold_at: string
  packages: { name: string } | null
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza',
  })
}

// Explicitly api.whatsapp.com/send (not the wa.me short-link this file used
// before) — the ask for this feature specifically. Same digits-with-
// country-code normalization as the rest of the app either way.
function buildApiWhatsAppUrl(phone: string | null | undefined, message: string): string {
  return `https://api.whatsapp.com/send?phone=${whatsappDigitsWithCountryCode(phone)}&text=${encodeURIComponent(message)}`
}

function studentConfirmationMessage(lesson: Lesson, dayLabel: string, schoolName: string): string {
  const activityName = lesson.activities?.name ?? 'sua aula'
  const instructorName = lesson.instructor?.name ?? 'nosso instrutor'
  return `Olá, ${lesson.student_name ?? ''}! Confirmando sua aula de ${activityName} com ${instructorName}, agendada para ${dayLabel} às ${fmtTime(lesson.scheduled_at)} na ${schoolName}. Até lá!`
}

function instructorConfirmationMessage(lesson: Lesson, dayLabel: string): string {
  const activityName = lesson.activities?.name ?? 'uma aula'
  return `Olá, ${lesson.instructor?.name ?? ''}! Você tem ${activityName} com ${lesson.student_name ?? 'o aluno'} agendada para ${dayLabel} às ${fmtTime(lesson.scheduled_at)}.`
}

/** Fortaleza-local date/time parts for pre-filling the edit form's <input type="date">
 *  and <input type="time"> fields. Plain .slice(0,10)/.slice(11,16) on the stored UTC
 *  string would show the raw UTC wall-clock instead — e.g. a 14:00 Fortaleza lesson
 *  (stored as 17:00 UTC) would show "17:00" in the edit modal. */
function toFortalezaParts(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

/** Package-balance badge for a scheduled-lesson row — exact (not
 *  substring) case-insensitive match against activePackages, since both
 *  sides here are already-complete names, not partial typed input (unlike
 *  the schedule modal's autocomplete matching further down this file,
 *  which does want substring matches while the owner is still typing).
 *
 *  Sums every unexhausted sale for this student instead of taking the
 *  first match — a student can hold several active packages at once
 *  (package_sales.student_id is rarely populated, so nothing merges them),
 *  and picking just one under-reported real balance by hundreds of minutes
 *  in production (see AUDITORIA_DASHBOARD.md item 4). */
function getPackageBadge(
  studentName: string | null,
  activePackages: PackageSale[],
  t: Record<string, string>
): { label: string; tone: 'ok' | 'warn' } | null {
  if (!studentName) return null
  const sales = activePackages.filter(p => p.student_name.toLowerCase() === studentName.toLowerCase())
  if (sales.length === 0) return { label: t.walk_in_lesson_badge, tone: 'warn' }
  const remaining = sales.reduce((sum, p) => sum + Math.max(0, p.minutes_purchased - p.minutes_used), 0)
  if (remaining <= 0) return { label: t.no_credits_badge, tone: 'warn' }
  const label = remaining === 60
    ? `${formatHours(remaining)} ${t.package_remaining_singular}`
    : `${formatHours(remaining)} ${t.package_remaining_badge}`
  return { label, tone: 'ok' }
}

// 'supervis' (not 'supervisao') deliberately — normalization below strips
// accented characters entirely rather than transliterating them ("ã" in
// "Supervisão" is dropped, not turned into "a"), so a key with an "a"
// where the accent was would never actually match. A shorter, accent-free
// prefix matches regardless of how the accent lands after stripping.
const SPORT_FILTERS = ['all', 'kitesurf', 'wingfoil', 'kitefoil', 'surf', 'windsurf', 'aluguel', 'supervis', 'downwind'] as const
type SportFilter = typeof SPORT_FILTERS[number]
const SPORT_FILTER_LABELS: Record<SportFilter, string> = {
  all: 'Todos', kitesurf: 'Kitesurf', wingfoil: 'Wingfoil',
  kitefoil: 'Kitefoil', surf: 'Surf', windsurf: 'Windsurf',
  aluguel: 'Aluguel', supervis: 'Supervisão', downwind: 'Downwind',
}

/** Matches this row's activity name against a modality filter. Strips
 *  spaces/punctuation and checks a prefix, not a plain substring — "Surf"
 *  and "Kitesurf"/"Windsurf" would otherwise cross-match (kitesurf
 *  contains the substring "surf"), since a prefix check doesn't have that
 *  problem (kitesurf/windsurf never start with "surf"). Tolerates suffixes
 *  like "Kitesurf - Avançado" since schools type activity names freely
 *  (no fixed catalog/enum backs this). Same matching applies to the
 *  operational categories (Aluguel/Supervisão/Downwind) — these still
 *  need a matching `activities` row to exist (created via /owner/
 *  activities) for the filter to actually show anything, same as every
 *  other filter here. */
function activityMatchesSport(activityName: string | null | undefined, sport: SportFilter): boolean {
  if (sport === 'all') return true
  const normalized = (activityName ?? '').toLowerCase().replace(/[^a-z]/g, '')
  return normalized.startsWith(sport)
}

/** package_sales has no FK to activities — match the package's free-text
 *  sport field against the activity catalog by name, same fuzzy approach
 *  already used elsewhere in this file for the free-typed student name path. */
function findActivityBySport(activities: Activity[], sport: string): Activity | undefined {
  const needle = sport.trim().toLowerCase()
  if (!needle || needle === '—') return undefined
  return activities.find(a => {
    const name = a.name.toLowerCase()
    return name.includes(needle) || needle.includes(name)
  })
}

// Matches the payment_method vocabulary used everywhere else in the app
// (PaymentsClient's PM_LABELS, /api/owner/payment-method-summary, reports) —
// using different values here would silently drop group-confirmed sessions
// out of those breakdowns.
const PAYMENT_METHODS = [
  { value: 'pix',       label: 'PIX'      },
  { value: 'dinheiro',  label: 'Dinheiro' },
  { value: 'cartao',    label: 'Cartão'   },
  { value: 'a_receber', label: 'A receber' },
]

const WEEKDAYS = [
  { key: 1, label: 'S' },
  { key: 2, label: 'T' },
  { key: 3, label: 'Q' },
  { key: 4, label: 'Q' },
  { key: 5, label: 'S' },
  { key: 6, label: 'S' },
  { key: 0, label: 'D' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  color: 'var(--slate)',
  background: '#fff',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--mist)',
  display: 'block',
  marginBottom: '6px',
}

function generateDates(
  startDate: string,
  time: string,
  count: number,
  mode: 'daily' | 'custom',
  weekdays: number[]
): string[] {
  const dates: string[] = []
  const current = new Date(`${startDate}T${time}:00`)

  if (mode === 'daily') {
    for (let i = 0; i < count; i++) {
      dates.push(current.toISOString())
      current.setDate(current.getDate() + 1)
    }
  } else {
    if (weekdays.length === 0) return []
    let attempts = 0
    while (dates.length < count && attempts < 365) {
      if (weekdays.includes(current.getDay())) {
        dates.push(current.toISOString())
      }
      current.setDate(current.getDate() + 1)
      attempts++
    }
  }

  return dates
}

export default function ScheduledLessons({
  todayLessons,
  tomorrowLessons,
  activities,
  instructors,
  activePackages = [],
  schoolName = 'Pico Base',
  payoutModel = 'percentage',
  fixedPayoutValue = null,
  t,
  lang = 'pt',
}: {
  todayLessons: Lesson[]
  tomorrowLessons: Lesson[]
  activities: Activity[]
  instructors: Instructor[]
  activePackages?: PackageSale[]
  schoolName?: string
  payoutModel?: string
  fixedPayoutValue?: number | null
  t: Record<string, string>
  lang?: 'en' | 'pt'
}) {
  const router = useRouter()
  const { toast, showToast }        = useToast()
  const [showModal, setShowModal]   = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [activeTab, setActiveTab]   = useState<'today' | 'tomorrow'>('today')
  const [activeSportFilter, setActiveSportFilter] = useState<SportFilter>('all')
  const [mode, setMode]             = useState<'single' | 'daily' | 'custom'>('single')
  const [weekdays, setWeekdays]     = useState<number[]>([1, 3, 5])
  // Individual vs. group scheduling — separate from `mode` above, which is
  // the recurrence pattern (single/daily/dias fixos) and only applies to
  // individual lessons. Groups are always a single occurrence.
  const [lessonMode, setLessonMode] = useState<'individual' | 'group'>('individual')
  const [groupStudents, setGroupStudents] = useState<string[]>(['', ''])
  const [editableDates, setEditableDates] = useState<{ date: string; time: string }[]>([])
  const [editingIndex, setEditingIndex]   = useState<number | null>(null)
  const [studentSuggestions, setStudentSuggestions] = useState<
    Array<{
      student_name: string
      package_sale_id: string | null
      package_name: string | null
      activity_name: string | null
      minutes_purchased: number
      minutes_used: number
      minutes_remaining: number
    }>
  >([])
  const [showSuggestions, setShowSuggestions]       = useState(false)
  const [selectedPackage, setSelectedPackage]        = useState<{
    package_sale_id: string
    package_name: string
    activity_name: string
    minutes_remaining: number
  } | null>(null)
  const [customDuration,   setCustomDuration]       = useState(false)
  const [customMinutes,    setCustomMinutes]         = useState(45)
  const [editLesson,       setEditLesson]            = useState<Lesson | null>(null)
  const [editForm,         setEditForm]              = useState({
    student_name: '', activity_id: '', instructor_id: '',
    date: '', time: '', duration_min: 60, notes: '', level: '' as string,
  })
  const [editExperimentalDisabled, setEditExperimentalDisabled] = useState(false)
  const [editCustomDuration, setEditCustomDuration] = useState(false)
  const [editCustomMinutes,  setEditCustomMinutes]  = useState(45)
  const [editSaving,         setEditSaving]         = useState(false)
  // save()/saveEdit() used to only check res.ok's truthiness on the last
  // response and otherwise close the modal unconditionally — a failed save
  // (e.g. the instructor/student clash or package-balance checks below)
  // silently looked like a success. These surface whatever error the API
  // actually returned.
  const [formError,     setFormError]     = useState<string | null>(null)
  const [editFormError, setEditFormError] = useState<string | null>(null)

  const [groupConfirmModal, setGroupConfirmModal] = useState<{
    groupId: string
    activityId: string | null
    durationMin: number
    lessons: Array<{
      id: string
      student_name: string
      instructor_id: string | null
      price: string
      payment_method: string | null
      currency: string
    }>
  } | null>(null)
  const [confirming,      setConfirming]      = useState(false)
  const [confirmProgress, setConfirmProgress] = useState<string | null>(null)
  const [confirmError,    setConfirmError]    = useState<string | null>(null)

  // Individual (non-group) lesson confirm — restored from git history
  // (deleted 2026-07-19 in 5c49dd6, alongside its own ConfirmLessonModal.tsx
  // component — that removal's premise, "check-in already confirms this",
  // didn't hold once a lesson has no checkin card left to confirm from).
  // The richer fields (currency/FX, per-hour pricing, session date, level
  // picker) live in ConfirmLessonModal.tsx itself, not here.
  const [confirmLessonModal, setConfirmLessonModal] = useState<Lesson | null>(null)

  const [form, setForm] = useState({
    student_name:    '',
    activity_id:     '',
    instructor_id:   '',
    date:            new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time:            '09:00',
    count:           1,
    duration_min:    60,
    notes:           '',
    level:           '' as string,
    package_sale_id: null as string | null,
  })
  const [experimentalDisabled, setExperimentalDisabled] = useState(false)

  useEffect(() => {
    fetch('/api/owner/students-with-packages')
      .then(r => r.json())
      .then(data => setStudentSuggestions(data.students ?? []))
      .catch(() => setStudentSuggestions([]))
  }, [])

  // Sync editable dates whenever scheduling params change
  useEffect(() => {
    if (mode === 'single') {
      setEditableDates([{ date: form.date, time: form.time }])
      return
    }
    const isos = generateDates(
      form.date, form.time, form.count,
      mode === 'daily' ? 'daily' : 'custom',
      weekdays
    )
    setEditableDates(isos.map(iso => ({
      date: iso.slice(0, 10),
      time: form.time,
    })))
  }, [form.date, form.time, form.count, mode, weekdays])

  // Default level for this (student, activity) — same trigger as the balance pill
  // (student name + activity known), debounced since it's a network lookup. Re-fires
  // whenever name or activity changes, but never fights a level the owner already
  // clicked for the *current* (name, activity) pair since this only re-runs on those
  // two inputs, not on form.level itself.
  useEffect(() => {
    if (form.student_name.trim().length <= 2 || !form.activity_id) return
    const handle = setTimeout(() => {
      fetch(`/api/owner/default-level?student_name=${encodeURIComponent(form.student_name)}&activity_id=${form.activity_id}`)
        .then(r => r.json())
        .then(data => {
          if (!data?.level) return
          setExperimentalDisabled(!!data.experimentalDisabled)
          setForm(f => ({ ...f, level: data.level }))
        })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(handle)
  }, [form.student_name, form.activity_id])

  // maxCount is bounded by the package the owner explicitly selected from the
  // dropdown (selectedPackage) — not a name-substring guess. Uncapped (99) until
  // a specific package_sale_id is picked.
  const maxCount = selectedPackage
    ? Math.floor(selectedPackage.minutes_remaining / (form.duration_min || 60))
    : 99

  const cannotSave = lessonMode === 'group'
    ? groupStudents.filter(s => s.trim()).length < 2
    : !form.student_name.trim()

  function onStudentChange(name: string) {
    // Manual typing supersedes any dropdown pick — the sticky package selection
    // only applies while the name matches what was explicitly clicked.
    setSelectedPackage(null)
    setForm(f => ({ ...f, student_name: name, package_sale_id: null }))
    // Prefer the oldest sale that still has balance (FIFO — the one that'll
    // actually get drawn down first) over whichever happens to come first
    // in activePackages' sold_at-desc order, which would otherwise suggest
    // the newest package even when an older one is the one really in use.
    const pkg = activePackages
      .filter(p => p.student_name.toLowerCase().includes(name.toLowerCase()) && name.length > 2)
      .filter(p => p.minutes_purchased - p.minutes_used > 0)
      .sort((a, b) => a.sold_at.localeCompare(b.sold_at))[0]
    if (pkg) {
      const activity = activities.find(a =>
        (pkg.packages as any)?.name?.toLowerCase().includes(a.name.split(' ')[0].toLowerCase())
      )
      const remaining = pkg.minutes_purchased - pkg.minutes_used
      const lessonMin = activity?.default_duration_min ?? 60
      const suggested = Math.floor(remaining / lessonMin)
      if (suggested > 0) {
        setForm(f => ({
          ...f,
          student_name: name,
          activity_id:  activity?.id ?? f.activity_id,
          count:        suggested,
        }))
      }
    }
  }

  function onSelectPackage(student: {
    student_name: string
    package_sale_id: string
    package_name: string
    activity_name: string
    minutes_remaining: number
  }) {
    const activity = findActivityBySport(activities, student.activity_name)
    setSelectedPackage({
      package_sale_id:   student.package_sale_id,
      package_name:      student.package_name,
      activity_name:     student.activity_name,
      minutes_remaining: student.minutes_remaining,
    })
    setForm(f => ({
      ...f,
      student_name:    student.student_name,
      package_sale_id: student.package_sale_id,
      activity_id:     activity?.id ?? f.activity_id,
    }))
    setShowSuggestions(false)
  }

  /** Suggestion-row click. Students with no package sale (walk-ins,
   *  booking-only contacts) have package_sale_id: null — nothing to
   *  select against, so this just fills the name and leaves the form's
   *  package_sale_id null, same as if the owner had typed the name
   *  manually with no matching package. Scheduling with no package_sale_id
   *  already works (api/owner/schedule POST defaults it to null). */
  function onSelectSuggestion(student: {
    student_name: string
    package_sale_id: string | null
    package_name: string | null
    activity_name: string | null
    minutes_remaining: number
  }) {
    if (!student.package_sale_id) {
      setSelectedPackage(null)
      setForm(f => ({ ...f, student_name: student.student_name, package_sale_id: null }))
      setShowSuggestions(false)
      return
    }
    onSelectPackage({
      student_name:      student.student_name,
      package_sale_id:   student.package_sale_id,
      package_name:      student.package_name ?? '—',
      activity_name:     student.activity_name ?? '—',
      minutes_remaining: student.minutes_remaining,
    })
  }

  function toggleWeekday(day: number) {
    setWeekdays(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day)
      if (prev.length >= form.count) return prev
      return [...prev, day]
    })
  }

  async function save() {
    setFormError(null)

    if (lessonMode === 'group') {
      const validStudents = groupStudents.map(s => s.trim()).filter(Boolean)
      if (validStudents.length < 2) return
      setSaving(true)

      const finalDuration = customDuration ? customMinutes : form.duration_min
      const scheduled_at  = `${form.date}T${form.time}:00-03:00`

      const res = await fetch('/api/owner/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode:         'group',
          students:     validStudents,
          activity_id:  form.activity_id || null,
          scheduled_at,
          duration_min: finalDuration,
          notes:        form.notes || null,
        }),
      })

      setSaving(false)
      if (res.ok) {
        setShowModal(false)
        resetForm()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error ?? 'Não foi possível agendar o grupo.')
      }
      return
    }

    if (!form.student_name.trim()) return
    setSaving(true)

    const finalDuration = customDuration ? customMinutes : form.duration_min
    const dates = editableDates.map(d => `${d.date}T${d.time}:00-03:00`)

    const results = await Promise.all(
      dates.map(scheduled_at =>
        fetch('/api/owner/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_name:    form.student_name,
            activity_id:     form.activity_id || null,
            instructor_id:   form.instructor_id || null,
            scheduled_at,
            duration_min:    finalDuration,
            notes:           form.notes || null,
            level:           form.level || null,
            package_sale_id: form.package_sale_id ?? null,
          }),
        })
      )
    )

    setSaving(false)
    const failedRes = results.find(r => !r.ok)
    if (!failedRes) {
      setShowModal(false)
      resetForm()
      router.refresh()
    } else {
      const data = await failedRes.json().catch(() => ({}))
      setFormError(data.error ?? 'Não foi possível agendar uma ou mais datas.')
    }
  }

  function resetForm() {
    setForm({
      student_name: '', activity_id: '', instructor_id: '',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time: '09:00', count: 1, duration_min: 60, notes: '', level: '',
      package_sale_id: null,
    })
    setSelectedPackage(null)
    setExperimentalDisabled(false)
    setMode('single')
    setWeekdays([1, 3, 5])
    setEditableDates([])
    setEditingIndex(null)
    setCustomDuration(false)
    setCustomMinutes(45)
    setLessonMode('individual')
    setGroupStudents(['', ''])
    setFormError(null)
  }

  // "+ Agendar Próxima" — retention nudge once a lesson is done (confirmed)
  // or its slot has passed: reopens the same scheduling modal used by the
  // header's "+ Agendar" button (real scheduled_lessons row, not
  // AddBookingModal's `bookings`/leads table — same reasoning as
  // ScheduleFromCheckinModal's own "why not AddBookingModal" note),
  // pre-filled with this student's name/activity/instructor so only date
  // and time are left for reception to fill in with the client.
  function openRebookModal(lesson: Lesson) {
    resetForm()
    setForm(f => ({
      ...f,
      student_name:  lesson.student_name ?? '',
      activity_id:   lesson.activities?.id ?? '',
      instructor_id: lesson.instructor?.id ?? '',
    }))
    setShowModal(true)
  }

  async function cancel(id: string) {
    setDeleting(id)
    // Was posting { id } in the DELETE body, but the route only ever reads
    // id from the query string (same contract MissedLessons.tsx and
    // RescheduleModal.tsx already use correctly against this same route) —
    // every cancel from here was silently 400-ing and never actually
    // cancelling anything.
    const res = await fetch(`/api/owner/schedule?id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setDeleting(null)
    if (data.penalized && data.message) {
      showToast('err', data.message)
    }
    router.refresh()
  }

  function openEditModal(lesson: Lesson) {
    setEditLesson(lesson)
    setEditFormError(null)
    const { date, time } = toFortalezaParts(lesson.scheduled_at)
    setEditForm({
      student_name:  lesson.student_name ?? '',
      activity_id:   lesson.activities?.id ?? '',
      instructor_id: lesson.instructor?.id ?? '',
      date,
      time,
      duration_min:  lesson.duration_min || 60,
      notes:         lesson.notes ?? '',
      level:         lesson.level ?? '',
    })
    setEditCustomDuration(false)
    setEditCustomMinutes(45)
    setEditExperimentalDisabled(false)
    if (lesson.student_name && lesson.activities?.id) {
      fetch(`/api/owner/default-level?student_name=${encodeURIComponent(lesson.student_name)}&activity_id=${lesson.activities.id}`)
        .then(r => r.json())
        .then(data => setEditExperimentalDisabled(!!data?.experimentalDisabled))
        .catch(() => {})
    }
  }

  async function saveEdit() {
    if (!editLesson) return
    setEditSaving(true)
    setEditFormError(null)
    const finalEditDuration = editCustomDuration ? editCustomMinutes : editForm.duration_min
    const res = await fetch('/api/owner/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:            editLesson.id,
        student_name:  editForm.student_name,
        activity_id:   editForm.activity_id || null,
        instructor_id: editForm.instructor_id || null,
        scheduled_at:  `${editForm.date}T${editForm.time}:00-03:00`,
        duration_min:  finalEditDuration,
        notes:         editForm.notes || null,
        level:         editForm.level || null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setEditSaving(false)
    if (!res.ok || data.error) {
      setEditFormError(data.error ?? 'Não foi possível salvar as alterações.')
      return
    }
    setEditLesson(null)
    router.refresh()
  }

  const displayLessons = (activeTab === 'today' ? todayLessons : tomorrowLessons)
    .filter(l => activityMatchesSport(l.activities?.name, activeSportFilter))
  const todayCount     = todayLessons.length
  const tomorrowCount  = tomorrowLessons.length

  // Group lessons collapse into one row (same activity/time/duration, N
  // students) — everything else renders as an individual row, unchanged.
  const individualLessons = displayLessons.filter(l => !l.group_id)
  const groupMap = new Map<string, Lesson[]>()
  for (const l of displayLessons.filter(l => l.group_id)) {
    const gid = l.group_id!
    if (!groupMap.has(gid)) groupMap.set(gid, [])
    groupMap.get(gid)!.push(l)
  }
  const groupLessons = Array.from(groupMap.values())
    .sort((a, b) => a[0].scheduled_at.localeCompare(b[0].scheduled_at))
  const totalRows = individualLessons.length + groupLessons.length

  // Used by WhatsAppActionButton's message templates below.
  const dayLabel = activeTab === 'today' ? 'hoje' : 'amanhã'

  function openGroupConfirmModal(group: Lesson[]) {
    const first = group[0]
    setGroupConfirmModal({
      groupId:     first.group_id!,
      activityId:  first.activities?.id ?? null,
      durationMin: first.duration_min,
      lessons: group.map(l => ({
        id:             l.id,
        student_name:   l.student_name ?? '—',
        instructor_id:  l.instructor?.id ?? null,
        price:          String(l.activities?.default_price ?? ''),
        payment_method: null,
        currency:       'BRL',
      })),
    })
    setConfirmError(null)
  }

  async function confirmGroup() {
    if (!groupConfirmModal) return
    setConfirming(true)
    setConfirmError(null)
    const failed: string[] = []

    for (let i = 0; i < groupConfirmModal.lessons.length; i++) {
      const lesson = groupConfirmModal.lessons[i]
      setConfirmProgress(`${i + 1} de ${groupConfirmModal.lessons.length}`)
      const res = await fetch('/api/owner/confirm-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id:           null,
          scheduled_lesson_id:  lesson.id,
          instructor_id:        lesson.instructor_id,
          activity_id:          groupConfirmModal.activityId,
          price:                Number(lesson.price),
          payment_method:       lesson.payment_method,
          currency:             lesson.currency,
          duration_min:         groupConfirmModal.durationMin,
        }),
      })
      if (!res.ok) failed.push(lesson.student_name)
    }

    setConfirming(false)
    setConfirmProgress(null)

    if (failed.length > 0) {
      setConfirmError(`Falha ao confirmar: ${failed.join(', ')}`)
      return
    }

    setGroupConfirmModal(null)
    router.refresh()
  }


  return (
    <>
      <div style={{ marginBottom: '28px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              fontSize: '11px', fontWeight: '500',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--mist)',
            }}>
              Aulas agendadas
            </div>

            <div style={{
              display: 'flex', gap: '2px',
              background: 'var(--powder)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
            }}>
              {([
                { key: 'today',    label: `${t.today_label} (${todayCount})`      },
                { key: 'tomorrow', label: `${t.tomorrow_label} (${tomorrowCount})` },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px', fontWeight: '500',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    background: activeTab === tab.key ? '#fff' : 'transparent',
                    color: activeTab === tab.key ? 'var(--slate)' : 'var(--mist)',
                    boxShadow: activeTab === tab.key
                      ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '7px 14px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '12px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            + Agendar
          </button>
        </div>

        {/* Sport filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {SPORT_FILTERS.map(sport => {
            const active = activeSportFilter === sport
            return (
              <button
                key={sport}
                onClick={() => setActiveSportFilter(sport)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px', fontWeight: '500',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  background: active ? 'var(--slate)' : 'var(--powder)',
                  color: active ? '#fff' : 'var(--mist)',
                }}
              >
                {sport === 'all' ? t.origin_all : translateModalityName(SPORT_FILTER_LABELS[sport], lang)}
              </button>
            )
          })}
        </div>

        {/* Lessons list */}
        {totalRows === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '40px 24px',
            textAlign: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ display: 'inline-block', color: 'var(--border-strong)', marginBottom: '10px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
              {activeSportFilter === 'all'
                ? (activeTab === 'today' ? t.no_scheduled_today : t.no_scheduled_tomorrow)
                : `${t.no_scheduled_sport} (${translateModalityName(SPORT_FILTER_LABELS[activeSportFilter], lang)}).`}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            // Past 8 rows this scrolls internally instead of the page
            // itself growing without bound — an unbounded list here was
            // the main driver of the left column running far past the
            // right one (the "rolagem infinita" complaint).
            ...(totalRows > 8
              ? { maxHeight: '640px', overflowY: 'auto' as const, overflowX: 'hidden' as const }
              : {}),
          }}>
            {individualLessons.map(lesson => (
              <div key={lesson.id} style={{
                background: '#fff',
                // #E4E2DB (pb-border) — exact hex from the approved
                // mockup, not --border (#E6E5E2, a subtly different gray).
                border: '0.5px solid var(--color-pb-border)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '12px 16px',
              }}>
                <div style={{
                  fontSize: '14px', fontWeight: '500',
                  // pb-slate (#1A1C22), not the older --slate (#0D0F14) —
                  // exact hex from the approved mockup.
                  color: 'var(--color-pb-slate)', fontVariantNumeric: 'tabular-nums',
                  minWidth: '52px', flexShrink: 0,
                }}>
                  {fmtTime(lesson.scheduled_at)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {lesson.student_name ? (
                      <Link
                        href={`/owner/students/name/${encodeURIComponent(lesson.student_name)}`}
                        style={{
                          fontSize: '14px', fontWeight: '500',
                          color: 'var(--color-pb-slate)', textDecoration: 'none',
                          borderBottom: '1px solid transparent',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderBottomColor = 'var(--color-pb-glacial)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent' }}
                      >
                        {lesson.student_name}
                      </Link>
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-pb-slate)' }}>—</span>
                    )}
                    {(() => {
                      // Only meaningful before confirmation — it's a heads-up
                      // for reception ("this one has no credit, charge it
                      // avulsa") ahead of the decision. A lesson that's
                      // already status: 'confirmed' has already been paid
                      // for one way or another (session row + payment_method
                      // exist by then), so re-showing "Sem créditos" on it
                      // reads as an open billing problem that isn't real.
                      if (lesson.status === 'confirmed') return null
                      const badge = getPackageBadge(lesson.student_name, activePackages, t)
                      if (!badge) return null
                      // Plain inline text per the approved mockup
                      // ("· 6h restantes"), not a pill. 'warn' keeps
                      // pb-signal (an approved token) rather than the old
                      // amber, which isn't in the 11-color palette — the
                      // mockup only shows the 'ok' case, this is the
                      // closest in-palette equivalent for the other one.
                      return (
                        <span style={{
                          fontSize: '12px', fontWeight: '400',
                          color: badge.tone === 'ok' ? 'var(--color-pb-mist)' : 'var(--signal)',
                          whiteSpace: 'nowrap',
                        }}>
                          · {badge.label}
                        </span>
                      )
                    })()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-pb-mist)' }}>
                    {lesson.activities?.name ?? 'Atividade não definida'}
                    {isLevel(lesson.level) && <> · {LEVEL_LABELS[lesson.level].pt}</>}
                    {lesson.instructor && (
                      <> · {(lesson.instructor as any).name}</>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* picobase_design_system_dossie.md Fase 4: status badge
                      via the shared Badge component. checked_in has no
                      dedicated variant in the 3-color Fase 2 palette — it's
                      not the fully-confirmed/paid state ("success"), so it
                      folds into neutral alongside "scheduled" rather than
                      overloading success with a different meaning. size="md"
                      per the approved mockup's "Agendada" spec (10px/12px,
                      distinct from Sala de Espera's 8px/11px default). */}
                  <Badge variant={lesson.status === 'confirmed' ? 'success' : 'neutral'} size="md">
                    {lesson.status === 'confirmed' ? t.status_confirmed
                      : lesson.status === 'checked_in' ? t.status_checked_in
                      : t.status_scheduled}
                  </Badge>
                  {/* Reagendar + Confirmar are both frequent actions — the
                      approved mockup requires neither to hide behind "⋮".
                      Same hide rule as before: only status 'confirmed'
                      (shown as the "Confirmada" badge instead) drops them. */}
                  {lesson.status !== 'confirmed' && (
                    <>
                      <Button variant="secondary" size="xs" onClick={() => openRebookModal(lesson)}>
                        Reagendar
                      </Button>
                      <Button variant="primary" size="xs" onClick={() => setConfirmLessonModal(lesson)}>
                        Confirmar
                      </Button>
                    </>
                  )}
                  {/* WhatsApp Aluno promoted to a visible glyph-only icon
                      per the mockup (18px, pb-mist, no background/border) —
                      WhatsApp Instrutor stays in the overflow alongside the
                      genuinely rare actions (Editar, Cancelar). */}
                  {lesson.student_whatsapp ? (
                    <a
                      href={buildApiWhatsAppUrl(lesson.student_whatsapp, studentConfirmationMessage(lesson, dayLabel, schoolName))}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`WhatsApp Aluno${lesson.student_name ? ` (${lesson.student_name})` : ''}`}
                      style={{ fontSize: '18px', color: 'var(--color-pb-mist)', lineHeight: 1 }}
                    >
                      💬
                    </a>
                  ) : (
                    <span style={{ fontSize: '18px', color: 'var(--color-pb-mist)', lineHeight: 1, opacity: 0.4 }}>
                      💬
                    </span>
                  )}
                  <OverflowMenu items={[
                    {
                      label: `WhatsApp Instrutor${lesson.instructor?.name ? ` (${lesson.instructor.name})` : ''}`,
                      href: lesson.instructor?.whatsapp ? buildApiWhatsAppUrl(lesson.instructor.whatsapp, instructorConfirmationMessage(lesson, dayLabel)) : '#',
                      disabled: !lesson.instructor?.whatsapp,
                    },
                    { label: 'Editar', onClick: () => openEditModal(lesson) },
                    ...(lesson.status === 'scheduled'
                      ? [{ label: 'Cancelar', onClick: () => cancel(lesson.id), danger: true, disabled: deleting === lesson.id }]
                      : []),
                  ]} />
                </div>
              </div>
            ))}

            {groupLessons.map(group => {
              const first = group[0]
              return (
                <div key={first.group_id} style={{
                  background: '#fff',
                  border: '0.5px solid var(--color-pb-border)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 20px',
                }}>
                  <div style={{
                    fontSize: '15px', fontWeight: '600',
                    color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                    width: '44px', flexShrink: 0, paddingTop: '2px',
                  }}>
                    {fmtTime(first.scheduled_at)}
                  </div>
                  <div style={{
                    width: '2px', height: '32px',
                    background: '#5B21B6',
                    borderRadius: '1px', flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px',
                    }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '99px',
                        background: '#EDE9FE', color: '#5B21B6',
                        fontSize: '10px', fontWeight: '600',
                      }}>
                        👥 Grupo · {group.length} alunos
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
                        {first.activities?.name ?? 'Atividade não definida'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--slate)', fontWeight: '500' }}>
                      {group.map((l, gi) => (
                        <span key={l.id}>
                          {gi > 0 && ' · '}
                          {l.student_name ? (
                            <Link
                              href={`/owner/students/name/${encodeURIComponent(l.student_name)}`}
                              style={{
                                color: 'var(--slate)', textDecoration: 'none',
                                borderBottom: '1px solid transparent',
                                transition: 'border-color 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderBottomColor = 'var(--glacial)' }}
                              onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent' }}
                            >
                              {l.student_name}
                            </Link>
                          ) : '—'}
                        </span>
                      ))}
                    </div>
                  </div>
                  {group.every(l => l.status === 'confirmed') ? (
                    <Badge variant="success" className="flex-shrink-0">
                      {t.status_confirmed}
                    </Badge>
                  ) : (
                    <Button variant="primary" onClick={() => openGroupConfirmModal(group)} className="px-3 py-1.5 text-xs flex-shrink-0">
                      Confirmar grupo →
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editLesson && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200, padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setEditLesson(null) }}
        >
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '480px',
            padding: '28px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              fontSize: '18px', fontWeight: '500',
              color: 'var(--slate)', marginBottom: '20px',
            }}>
              Editar aula
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={labelStyle}>Aluno</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={editForm.student_name}
                  onChange={e => setEditForm(f => ({ ...f, student_name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Atividade</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={editForm.activity_id}
                    onChange={e => setEditForm(f => ({ ...f, activity_id: e.target.value }))}
                  >
                    <option value="">Selecionar</option>
                    {activities.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Instrutor</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={editForm.instructor_id}
                    onChange={e => setEditForm(f => ({ ...f, instructor_id: e.target.value }))}
                  >
                    <option value="">Selecionar</option>
                    {instructors.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editForm.activity_id && (
                <LevelPicker
                  value={editForm.level}
                  experimentalDisabled={editExperimentalDisabled}
                  onChange={level => setEditForm(f => ({ ...f, level }))}
                />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Data</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Horário</label>
                  <input
                    style={inputStyle}
                    type="time"
                    value={editForm.time}
                    onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Duração</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: '1h',   value: 60  },
                    { label: '1h30', value: 90  },
                    { label: '2h',   value: 120 },
                    { label: '3h',   value: 180 },
                  ].map(d => (
                    <button
                      key={d.value}
                      onClick={() => {
                        setEditCustomDuration(false)
                        setEditForm(f => ({ ...f, duration_min: d.value }))
                      }}
                      style={{
                        flex: 1, padding: '9px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${!editCustomDuration && editForm.duration_min === d.value
                          ? 'var(--glacial)' : 'var(--border)'}`,
                        background: !editCustomDuration && editForm.duration_min === d.value
                          ? 'var(--glacial-light)' : '#fff',
                        color: !editCustomDuration && editForm.duration_min === d.value
                          ? 'var(--glacial-dark)' : 'var(--slate)',
                        fontSize: '13px', fontWeight: '500',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setEditCustomDuration(true)}
                    style={{
                      flex: 1, padding: '9px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${editCustomDuration ? 'var(--glacial)' : 'var(--border)'}`,
                      background: editCustomDuration ? 'var(--glacial-light)' : '#fff',
                      color: editCustomDuration ? 'var(--glacial-dark)' : 'var(--mist)',
                      fontSize: '13px', fontWeight: '500',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Outro
                  </button>
                </div>
                {editCustomDuration && (
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '8px', marginTop: '10px',
                  }}>
                    <input
                      type="number"
                      min={15} max={480} step={5}
                      value={editCustomMinutes}
                      onChange={e => setEditCustomMinutes(Number(e.target.value))}
                      style={{
                        width: '80px', padding: '8px 12px',
                        border: '0.5px solid var(--border-strong)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '15px', fontWeight: '600',
                        color: 'var(--slate)', fontFamily: 'var(--font-sans)',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--mist)' }}>minutos</span>
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Observações</label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Opcional..."
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

            </div>

            {editFormError && (
              <div style={{
                marginTop: '16px', padding: '10px 14px',
                background: 'var(--signal-light)', color: 'var(--signal-dark)',
                borderRadius: 'var(--radius-md)', fontSize: '13px',
              }}>
                {editFormError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setEditLesson(null)}
                style={{
                  flex: 1, padding: '11px',
                  background: '#fff', color: 'var(--mist)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                style={{
                  flex: 2, padding: '11px',
                  background: editSaving ? 'var(--border)' : 'var(--slate)',
                  color: editSaving ? 'var(--mist)' : '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: '500',
                  cursor: editSaving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {editSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200, padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); resetForm() } }}
        >
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '480px',
            padding: '28px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              fontSize: '18px', fontWeight: '500',
              color: 'var(--slate)', marginBottom: '20px',
            }}>
              Agendar aula
            </div>

            {/* Individual / Group toggle */}
            <div style={{
              display: 'flex', background: 'var(--powder)',
              borderRadius: '12px', padding: '4px', marginBottom: '20px', gap: '4px',
            }}>
              {([
                { value: 'individual', label: '👤 Individual' },
                { value: 'group',      label: '👥 Grupo'      },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLessonMode(opt.value)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: lessonMode === opt.value ? '#fff' : 'transparent',
                    color: lessonMode === opt.value ? 'var(--slate)' : 'var(--mist)',
                    fontSize: '13px', fontWeight: lessonMode === opt.value ? '600' : '400',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    boxShadow: lessonMode === opt.value ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Student — individual mode only */}
              {lessonMode === 'individual' && (
              <div>
                <label style={labelStyle}>Aluno *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="Nome do aluno"
                    value={form.student_name}
                    onChange={e => onStudentChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoFocus
                  />
                  {showSuggestions && studentSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: '#fff', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-md)', zIndex: 50,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      maxHeight: '200px', overflowY: 'auto',
                    }}>
                      {studentSuggestions
                        .filter(s => !form.student_name ||
                          s.student_name.toLowerCase().includes(form.student_name.toLowerCase()))
                        .map(s => (
                          <button
                            key={s.package_sale_id ?? `no-package-${s.student_name}`}
                            type="button"
                            onMouseDown={() => onSelectSuggestion(s)}
                            style={{
                              width: '100%',
                              padding: '10px 14px', cursor: 'pointer',
                              border: 'none', background: 'transparent',
                              borderBottom: '0.5px solid var(--border)',
                              display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', gap: '12px',
                              textAlign: 'left', fontFamily: 'var(--font-sans)',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', marginBottom: '2px' }}>
                                {s.student_name}
                              </div>
                              {s.package_sale_id && (
                                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                                  {s.activity_name} — {s.package_name}
                                </div>
                              )}
                            </div>
                            {s.package_sale_id ? (
                              <div style={{
                                flexShrink: 0,
                                fontSize: '11px', fontWeight: '600',
                                color: s.minutes_remaining <= 0 ? '#DC2626' : s.minutes_remaining < 60 ? '#92400E' : 'var(--glacial-dark)',
                                background: s.minutes_remaining <= 0 ? '#FEE2E2' : s.minutes_remaining < 60 ? '#FEF3C7' : 'var(--glacial-light)',
                                padding: '2px 8px', borderRadius: '99px',
                              }}>
                                {s.minutes_remaining <= 0 ? 'Esgotado' : `${formatHours(s.minutes_remaining)} restantes`}
                              </div>
                            ) : (
                              <div style={{
                                flexShrink: 0,
                                fontSize: '11px', fontWeight: '500',
                                color: 'var(--mist)', background: 'var(--powder)',
                                padding: '2px 8px', borderRadius: '99px',
                              }}>
                                Sem pacote
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {selectedPackage && selectedPackage.minutes_remaining <= 0 && (
                  <div style={{
                    marginTop: '6px', padding: '8px 12px',
                    background: '#FEE2E2', borderRadius: 'var(--radius-md)',
                    fontSize: '12px', color: '#DC2626',
                  }}>
                    ⚠ {selectedPackage.package_name} esgotado — aluno não possui créditos suficientes.
                    Considere cobrar uma aula avulsa ou renovar o plano.
                  </div>
                )}
                {selectedPackage && selectedPackage.minutes_remaining > 0 && (
                  <div style={{
                    marginTop: '6px', padding: '8px 12px',
                    background: selectedPackage.minutes_remaining < 60 ? '#FEF3C7' : 'var(--glacial-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px', color: selectedPackage.minutes_remaining < 60 ? '#92400E' : 'var(--glacial-dark)',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>📦 {selectedPackage.activity_name} — {selectedPackage.package_name}</span>
                    <span>
                      {formatHours(selectedPackage.minutes_remaining)} restantes
                      {mode !== 'single' && ` → ${form.count} aulas sugeridas`}
                    </span>
                  </div>
                )}
              </div>
              )}

              {/* Group students — group mode only */}
              {lessonMode === 'group' && (
                <div>
                  <div style={{
                    fontSize: '10px', fontWeight: '600',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--mist)', marginBottom: '10px',
                  }}>
                    Alunos do grupo
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {groupStudents.map((name, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: 'var(--glacial-light)', color: 'var(--glacial-dark)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700', flexShrink: 0,
                        }}>
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={e => {
                            const updated = [...groupStudents]
                            updated[idx] = e.target.value
                            setGroupStudents(updated)
                          }}
                          placeholder={`Aluno ${idx + 1}`}
                          style={{ ...inputStyle, padding: '10px 14px', fontSize: '14px', borderRadius: '10px' }}
                        />
                        {groupStudents.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setGroupStudents(groupStudents.filter((_, i) => i !== idx))}
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: 'var(--signal-light)', color: 'var(--signal-dark)',
                              border: 'none', cursor: 'pointer',
                              fontSize: '14px', fontFamily: 'var(--font-sans)', flexShrink: 0,
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {groupStudents.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setGroupStudents([...groupStudents, ''])}
                      style={{
                        marginTop: '8px', padding: '8px 16px',
                        border: '1.5px dashed var(--border)', borderRadius: '10px',
                        background: 'transparent', color: 'var(--mist)',
                        fontSize: '13px', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)', width: '100%',
                      }}
                    >
                      + Adicionar aluno
                    </button>
                  )}

                  <div style={{
                    marginTop: '12px', padding: '10px 14px',
                    background: 'var(--glacial-light)', borderRadius: '8px',
                    fontSize: '12px', color: 'var(--glacial-dark)', fontWeight: '500',
                  }}>
                    👥 {groupStudents.filter(s => s.trim()).length} alunos
                    {' · '}{activities.find(a => a.id === form.activity_id)?.name ?? 'atividade selecionada'}
                    {' · '}{form.time || '--:--'}
                  </div>
                </div>
              )}

              {/* Activity + Instructor */}
              <div style={{ display: 'grid', gridTemplateColumns: lessonMode === 'group' ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Atividade</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={form.activity_id}
                    onChange={e => setForm(f => ({ ...f, activity_id: e.target.value }))}
                  >
                    <option value="">Selecionar</option>
                    {activities.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                {lessonMode === 'individual' && (
                <div>
                  <label style={labelStyle}>Instrutor</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={form.instructor_id}
                    onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))}
                  >
                    <option value="">Selecionar</option>
                    {instructors.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                )}
              </div>

              {/* Level — pre-filled from progression once aluno + atividade are known — individual only */}
              {lessonMode === 'individual' && form.activity_id && (
                <LevelPicker
                  value={form.level}
                  experimentalDisabled={experimentalDisabled}
                  onChange={level => setForm(f => ({ ...f, level }))}
                />
              )}

              {/* Start date + time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Data de início</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Horário</label>
                  <input
                    style={inputStyle}
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label style={labelStyle}>Duração</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: '1h',   value: 60  },
                    { label: '1h30', value: 90  },
                    { label: '2h',   value: 120 },
                    { label: '3h',   value: 180 },
                  ].map(d => (
                    <button
                      key={d.value}
                      onClick={() => {
                        setCustomDuration(false)
                        const newMax = selectedPackage
                          ? Math.floor(selectedPackage.minutes_remaining / d.value)
                          : 99
                        setForm(f => ({
                          ...f,
                          duration_min: d.value,
                          count: Math.min(f.count, newMax),
                        }))
                      }}
                      style={{
                        flex: 1, padding: '9px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${!customDuration && form.duration_min === d.value
                          ? 'var(--glacial)' : 'var(--border)'}`,
                        background: !customDuration && form.duration_min === d.value
                          ? 'var(--glacial-light)' : '#fff',
                        color: !customDuration && form.duration_min === d.value
                          ? 'var(--glacial-dark)' : 'var(--slate)',
                        fontSize: '13px', fontWeight: '500',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setCustomDuration(true)}
                    style={{
                      flex: 1, padding: '9px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${customDuration ? 'var(--glacial)' : 'var(--border)'}`,
                      background: customDuration ? 'var(--glacial-light)' : '#fff',
                      color: customDuration ? 'var(--glacial-dark)' : 'var(--mist)',
                      fontSize: '13px', fontWeight: '500',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Outro
                  </button>
                </div>
                {customDuration && (
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '8px', marginTop: '10px',
                  }}>
                    <input
                      type="number"
                      min={15} max={480} step={5}
                      value={customMinutes}
                      onChange={e => setCustomMinutes(Number(e.target.value))}
                      style={{
                        width: '80px', padding: '8px 12px',
                        border: '0.5px solid var(--border-strong)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '15px', fontWeight: '600',
                        color: 'var(--slate)', fontFamily: 'var(--font-sans)',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--mist)' }}>minutos</span>
                  </div>
                )}
              </div>

              {/* Recurrence, weekday picker, count stepper, preview — individual only.
                  Groups are always a single occurrence. */}
              {lessonMode === 'individual' && (
              <>
              {/* Recurrence mode */}
              <div>
                <label style={labelStyle}>Repetição</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {([
                    { key: 'single', label: 'Uma vez'    },
                    { key: 'daily',  label: 'Diário'     },
                    { key: 'custom', label: 'Dias fixos' },
                  ] as const).map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setMode(opt.key)}
                      style={{
                        flex: 1, padding: '9px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${mode === opt.key ? 'var(--glacial)' : 'var(--border)'}`,
                        background: mode === opt.key ? 'var(--glacial-light)' : '#fff',
                        color: mode === opt.key ? 'var(--glacial-dark)' : 'var(--slate)',
                        fontSize: '13px', fontWeight: '500',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekday picker — custom mode only */}
              {mode === 'custom' && (
                <div>
                  <label style={labelStyle}>Dias da semana</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {WEEKDAYS.map(day => (
                      <button
                        key={day.key}
                        onClick={() => toggleWeekday(day.key)}
                        style={{
                          width: '36px', height: '36px',
                          borderRadius: '50%',
                          border: `1.5px solid ${weekdays.includes(day.key) ? 'var(--glacial)' : 'var(--border)'}`,
                          background: weekdays.includes(day.key) ? 'var(--glacial-light)' : '#fff',
                          color: weekdays.includes(day.key) ? 'var(--glacial-dark)' : 'var(--slate)',
                          fontSize: '12px', fontWeight: '600',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '6px' }}>
                    Selecione até {form.count} dia{form.count !== 1 ? 's' : ''} da semana
                  </div>
                </div>
              )}

              {/* Lesson count stepper — recurring modes only */}
              {mode !== 'single' && (
                <div>
                  <label style={labelStyle}>
                    Número de aulas
                    {selectedPackage && (
                      <span style={{
                        fontSize: '12px', color: 'var(--mist)',
                        marginLeft: '8px', fontWeight: '400',
                        textTransform: 'none', letterSpacing: 0,
                      }}>
                        máx. {maxCount} aulas do pacote
                      </span>
                    )}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => {
                        const newCount = Math.max(1, form.count - 1)
                        setForm(f => ({ ...f, count: newCount }))
                        setWeekdays(prev => prev.slice(0, newCount))
                      }}
                      style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: '0.5px solid var(--border)',
                        background: '#fff', fontSize: '18px',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--slate)',
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      fontSize: '24px', fontWeight: '600',
                      color: 'var(--slate)', minWidth: '32px', textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {form.count}
                    </span>
                    <button
                      onClick={() => setForm(f => ({ ...f, count: Math.min(maxCount, f.count + 1) }))}
                      style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: '0.5px solid var(--border)',
                        background: '#fff', fontSize: '18px',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--slate)',
                      }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--mist)' }}>aulas</span>
                  </div>
                  {selectedPackage && form.count > maxCount && (
                    <div style={{
                      marginTop: '6px', fontSize: '12px',
                      color: 'var(--signal-dark)',
                      background: 'var(--signal-light)',
                      padding: '6px 10px', borderRadius: 'var(--radius-md)',
                    }}>
                      ⚠ Excede os minutos do pacote
                    </div>
                  )}
                </div>
              )}

              {/* Preview pills — editable */}
              {mode !== 'single' && editableDates.length > 0 && (
                <div style={{
                  background: 'var(--powder)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}>
                  <div style={{
                    fontSize: '11px', fontWeight: '500',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--mist)', marginBottom: '8px',
                  }}>
                    Preview — {editableDates.length} aulas · clique para editar horário
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {editableDates.map((d, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        {editingIndex === i ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: '#fff',
                            border: '1.5px solid var(--glacial)',
                            borderRadius: 'var(--radius-full)',
                            padding: '2px 8px',
                          }}>
                            <span style={{ fontSize: '11px', color: 'var(--slate)' }}>
                              {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit', month: 'short',
                              })}
                            </span>
                            <input
                              type="time"
                              value={d.time}
                              autoFocus
                              onChange={e => {
                                const updated = [...editableDates]
                                updated[i] = { ...updated[i], time: e.target.value }
                                setEditableDates(updated)
                              }}
                              onBlur={() => setEditingIndex(null)}
                              style={{
                                border: 'none', outline: 'none',
                                fontSize: '11px', color: 'var(--glacial-dark)',
                                fontFamily: 'var(--font-sans)',
                                background: 'transparent', width: '60px',
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingIndex(i)}
                            style={{
                              fontSize: '11px', padding: '3px 10px',
                              background: '#fff',
                              border: '0.5px solid var(--border)',
                              borderRadius: 'var(--radius-full)',
                              color: 'var(--slate)',
                              cursor: 'pointer', fontFamily: 'var(--font-sans)',
                              fontVariantNumeric: 'tabular-nums',
                              display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit', month: 'short',
                            })}
                            <span style={{ color: 'var(--glacial)', fontWeight: '500' }}>
                              {d.time}
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
              )}

              {/* Notes */}
              <div>
                <label style={labelStyle}>Observações</label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Opcional..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

            </div>

            {formError && (
              <div style={{
                marginTop: '16px', padding: '10px 14px',
                background: 'var(--signal-light)', color: 'var(--signal-dark)',
                borderRadius: 'var(--radius-md)', fontSize: '13px',
              }}>
                {formError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                style={{
                  flex: 1, padding: '11px',
                  background: '#fff', color: 'var(--mist)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || cannotSave}
                style={{
                  flex: 2, padding: '11px',
                  background: saving || cannotSave
                    ? 'var(--border)' : 'var(--slate)',
                  color: saving || cannotSave
                    ? 'var(--mist)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: '500',
                  cursor: saving || cannotSave
                    ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {saving
                  ? 'Agendando...'
                  : lessonMode === 'group'
                    ? `Agendar grupo de ${groupStudents.filter(s => s.trim()).length} alunos`
                    : mode === 'single'
                      ? 'Agendar aula'
                      : `Agendar ${editableDates.length || form.count} aulas`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group confirm modal */}
      {groupConfirmModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200, padding: '24px',
          }}
          onClick={e => {
            if (e.target === e.currentTarget && !confirming) setGroupConfirmModal(null)
          }}
        >
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '560px',
            padding: '28px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              fontSize: '18px', fontWeight: '500',
              color: 'var(--slate)', marginBottom: '20px',
            }}>
              Confirmar grupo · {groupConfirmModal.lessons.length} alunos
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {groupConfirmModal.lessons.map((lesson, idx) => (
                <div key={lesson.id} style={{
                  padding: '14px', background: 'var(--powder)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)' }}>
                    {lesson.student_name}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '10px' }}>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer', background: '#fff' }}
                      value={lesson.instructor_id ?? ''}
                      onChange={e => {
                        const updated = [...groupConfirmModal.lessons]
                        updated[idx] = { ...updated[idx], instructor_id: e.target.value || null }
                        setGroupConfirmModal({ ...groupConfirmModal, lessons: updated })
                      }}
                    >
                      <option value="">Instrutor...</option>
                      {instructors.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0} step={5}
                      placeholder="Preço"
                      style={{ ...inputStyle, background: '#fff' }}
                      value={lesson.price}
                      onChange={e => {
                        const updated = [...groupConfirmModal.lessons]
                        updated[idx] = { ...updated[idx], price: e.target.value }
                        setGroupConfirmModal({ ...groupConfirmModal, lessons: updated })
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {PAYMENT_METHODS.map(pm => (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => {
                          const updated = [...groupConfirmModal.lessons]
                          updated[idx] = { ...updated[idx], payment_method: pm.value }
                          setGroupConfirmModal({ ...groupConfirmModal, lessons: updated })
                        }}
                        style={{
                          flex: 1, padding: '6px 4px',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${lesson.payment_method === pm.value ? 'var(--glacial)' : 'var(--border)'}`,
                          background: lesson.payment_method === pm.value ? 'var(--glacial-light)' : '#fff',
                          color: lesson.payment_method === pm.value ? 'var(--glacial-dark)' : 'var(--mist)',
                          fontSize: '11px', fontWeight: '500',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {confirmError && (
              <div style={{
                marginTop: '16px', padding: '10px 14px',
                background: 'var(--signal-light)', color: 'var(--signal-dark)',
                borderRadius: 'var(--radius-md)', fontSize: '13px',
              }}>
                {confirmError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setGroupConfirmModal(null)}
                disabled={confirming}
                style={{
                  flex: 1, padding: '11px',
                  background: '#fff', color: 'var(--mist)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', cursor: confirming ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmGroup}
                disabled={confirming || groupConfirmModal.lessons.some(l => !l.instructor_id || !(Number(l.price) > 0))}
                style={{
                  flex: 2, padding: '11px',
                  background: confirming ? 'var(--border)' : 'var(--slate)',
                  color: confirming ? 'var(--mist)' : '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: '500',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {confirming ? `Confirmando ${confirmProgress}...` : 'Confirmar todos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLessonModal && (
        <ConfirmLessonModal
          lesson={confirmLessonModal}
          activities={activities}
          instructors={instructors}
          payoutModel={payoutModel}
          fixedPayoutValue={fixedPayoutValue}
          t={t}
          onClose={() => setConfirmLessonModal(null)}
          onConfirmed={() => { setConfirmLessonModal(null); router.refresh() }}
        />
      )}

      <Toast toast={toast} />
    </>
  )
}
