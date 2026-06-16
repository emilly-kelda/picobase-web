'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Lesson = {
  id: string
  student_name: string | null
  scheduled_at: string
  duration_min: number
  status: string
  notes: string | null
  activities: { id: string; name: string; default_price: number; default_duration_min: number } | null
  instructor: { id: string; name: string } | null
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
  packages: { name: string } | null
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza',
  })
}

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
}: {
  todayLessons: Lesson[]
  tomorrowLessons: Lesson[]
  activities: Activity[]
  instructors: Instructor[]
  activePackages?: PackageSale[]
}) {
  const router = useRouter()
  const [showModal, setShowModal]   = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [activeTab, setActiveTab]   = useState<'today' | 'tomorrow'>('today')
  const [mode, setMode]             = useState<'single' | 'daily' | 'custom'>('single')
  const [weekdays, setWeekdays]     = useState<number[]>([1, 3, 5])
  const [editableDates, setEditableDates] = useState<{ date: string; time: string }[]>([])
  const [editingIndex, setEditingIndex]   = useState<number | null>(null)
  const [studentSuggestions, setStudentSuggestions] = useState<
    Array<{ name: string; packageName: string; minutesRemaining: number }>
  >([])
  const [showSuggestions, setShowSuggestions]       = useState(false)
  const [customDuration,   setCustomDuration]       = useState(false)
  const [customMinutes,    setCustomMinutes]         = useState(45)
  const [editLesson,       setEditLesson]            = useState<Lesson | null>(null)
  const [editForm,         setEditForm]              = useState({
    student_name: '', activity_id: '', instructor_id: '',
    date: '', time: '', duration_min: 60, notes: '',
  })
  const [editCustomDuration, setEditCustomDuration] = useState(false)
  const [editCustomMinutes,  setEditCustomMinutes]  = useState(45)
  const [editSaving,         setEditSaving]         = useState(false)

  const [form, setForm] = useState({
    student_name:  '',
    activity_id:   '',
    instructor_id: '',
    date:          new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time:          '09:00',
    count:         1,
    duration_min:  60,
    notes:         '',
  })

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

  const matchedPackage = form.student_name.length > 2
    ? activePackages.find(p =>
        p.student_name.toLowerCase().includes(form.student_name.toLowerCase())
      )
    : undefined

  const maxCount = matchedPackage
    ? Math.floor(
        (matchedPackage.minutes_purchased - matchedPackage.minutes_used) / (form.duration_min || 60)
      )
    : 99

  function onStudentChange(name: string) {
    setForm(f => ({ ...f, student_name: name }))
    const pkg = activePackages.find(p =>
      p.student_name.toLowerCase().includes(name.toLowerCase()) && name.length > 2
    )
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

  function toggleWeekday(day: number) {
    setWeekdays(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day)
      if (prev.length >= form.count) return prev
      return [...prev, day]
    })
  }

  async function save() {
    if (!form.student_name.trim()) return
    setSaving(true)

    const finalDuration = customDuration ? customMinutes : form.duration_min
    const dates = editableDates.map(d => `${d.date}T${d.time}:00`)

    const results = await Promise.all(
      dates.map(scheduled_at =>
        fetch('/api/owner/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_name:  form.student_name,
            activity_id:   form.activity_id || null,
            instructor_id: form.instructor_id || null,
            scheduled_at,
            duration_min:  finalDuration,
            notes:         form.notes || null,
          }),
        })
      )
    )

    setSaving(false)
    if (results.every(r => r.ok)) {
      setShowModal(false)
      resetForm()
      router.refresh()
    }
  }

  function resetForm() {
    setForm({
      student_name: '', activity_id: '', instructor_id: '',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time: '09:00', count: 1, duration_min: 60, notes: '',
    })
    setMode('single')
    setWeekdays([1, 3, 5])
    setEditableDates([])
    setEditingIndex(null)
    setCustomDuration(false)
    setCustomMinutes(45)
  }

  async function cancel(id: string) {
    setDeleting(id)
    await fetch('/api/owner/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    router.refresh()
  }

  function openEditModal(lesson: Lesson) {
    setEditLesson(lesson)
    setEditForm({
      student_name:  lesson.student_name ?? '',
      activity_id:   lesson.activities?.id ?? '',
      instructor_id: lesson.instructor?.id ?? '',
      date:          lesson.scheduled_at.slice(0, 10),
      time:          lesson.scheduled_at.slice(11, 16),
      duration_min:  lesson.duration_min || 60,
      notes:         lesson.notes ?? '',
    })
    setEditCustomDuration(false)
    setEditCustomMinutes(45)
  }

  async function saveEdit() {
    if (!editLesson) return
    setEditSaving(true)
    const finalEditDuration = editCustomDuration ? editCustomMinutes : editForm.duration_min
    await fetch('/api/owner/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:            editLesson.id,
        student_name:  editForm.student_name,
        activity_id:   editForm.activity_id || null,
        instructor_id: editForm.instructor_id || null,
        scheduled_at:  `${editForm.date}T${editForm.time}:00`,
        duration_min:  finalEditDuration,
        notes:         editForm.notes || null,
      }),
    })
    setEditSaving(false)
    setEditLesson(null)
    router.refresh()
  }

  const displayLessons = activeTab === 'today' ? todayLessons : tomorrowLessons
  const todayCount     = todayLessons.length
  const tomorrowCount  = tomorrowLessons.length

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
                { key: 'today',    label: `Hoje (${todayCount})`      },
                { key: 'tomorrow', label: `Amanhã (${tomorrowCount})` },
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

        {/* Lessons list */}
        {displayLessons.length === 0 ? (
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
              Nenhuma aula agendada para {activeTab === 'today' ? 'hoje' : 'amanhã'}.
            </div>
          </div>
        ) : (
          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            {displayLessons.map((lesson, i) => (
              <div key={lesson.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '14px 20px',
                borderBottom: i < displayLessons.length - 1
                  ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{
                  fontSize: '15px', fontWeight: '600',
                  color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                  width: '44px', flexShrink: 0,
                }}>
                  {fmtTime(lesson.scheduled_at)}
                </div>
                <div style={{
                  width: '2px', height: '32px',
                  background: 'var(--glacial)',
                  borderRadius: '1px', flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px', fontWeight: '500',
                    color: 'var(--slate)', marginBottom: '2px',
                  }}>
                    {lesson.student_name ?? '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    {lesson.activities?.name ?? 'Atividade não definida'}
                    {lesson.instructor && (
                      <> · {(lesson.instructor as any).name}</>
                    )}
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px', fontWeight: '500',
                  background: lesson.status === 'confirmed'
                    ? 'var(--glacial-light)'
                    : lesson.status === 'checked_in'
                      ? 'var(--amber-light)'
                      : 'var(--powder)',
                  color: lesson.status === 'confirmed'
                    ? 'var(--glacial-dark)'
                    : lesson.status === 'checked_in'
                      ? 'var(--amber)'
                      : 'var(--mist)',
                  flexShrink: 0,
                }}>
                  {lesson.status === 'confirmed' ? 'Confirmada'
                    : lesson.status === 'checked_in' ? 'Check-in'
                    : 'Agendada'}
                </span>
                <button
                  onClick={() => openEditModal(lesson)}
                  style={{
                    background: 'transparent', border: 'none',
                    fontSize: '12px', color: 'var(--mist)',
                    cursor: 'pointer', padding: '4px 8px',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Editar
                </button>
                {lesson.status === 'scheduled' && (
                  <button
                    onClick={() => cancel(lesson.id)}
                    disabled={deleting === lesson.id}
                    style={{
                      background: 'transparent', border: 'none',
                      fontSize: '18px', color: 'var(--border-strong)',
                      cursor: 'pointer', flexShrink: 0, padding: '0 4px',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Student */}
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
                          s.name.toLowerCase().includes(form.student_name.toLowerCase()))
                        .map((s, i) => (
                          <div
                            key={i}
                            onMouseDown={() => {
                              onStudentChange(s.name)
                              setShowSuggestions(false)
                            }}
                            style={{
                              padding: '10px 14px', cursor: 'pointer',
                              borderBottom: '0.5px solid var(--border)',
                              display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                                {s.name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                                {s.packageName}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '11px', fontWeight: '500',
                              color: 'var(--glacial-dark)',
                              background: 'var(--glacial-light)',
                              padding: '2px 8px', borderRadius: '99px',
                            }}>
                              {Math.floor(s.minutesRemaining / 60)}h restantes
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {matchedPackage && (
                  <div style={{
                    marginTop: '6px', padding: '8px 12px',
                    background: 'var(--glacial-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px', color: 'var(--glacial-dark)',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>📦 {(matchedPackage.packages as any)?.name}</span>
                    <span>
                      {matchedPackage.minutes_purchased - matchedPackage.minutes_used}min restantes
                      {' → '}{form.count} aulas sugeridas
                    </span>
                  </div>
                )}
              </div>

              {/* Activity + Instructor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              </div>

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
                        const newMax = matchedPackage
                          ? Math.floor(
                              (matchedPackage.minutes_purchased - matchedPackage.minutes_used) / d.value
                            )
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
                    {matchedPackage && (
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
                  {matchedPackage && form.count > maxCount && (
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
                disabled={saving || !form.student_name.trim()}
                style={{
                  flex: 2, padding: '11px',
                  background: saving || !form.student_name.trim()
                    ? 'var(--border)' : 'var(--slate)',
                  color: saving || !form.student_name.trim()
                    ? 'var(--mist)' : '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: '500',
                  cursor: saving || !form.student_name.trim()
                    ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {saving
                  ? 'Agendando...'
                  : mode === 'single'
                    ? 'Agendar aula'
                    : `Agendar ${editableDates.length || form.count} aulas`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
