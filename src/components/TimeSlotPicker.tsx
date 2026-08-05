'use client'

import { useEffect, useState } from 'react'

export type TimeSlot = {
  time: string
  instructor_id: string
  instructor_name: string
  studentConflict: boolean
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
}

/** Time-first, instructor-second picker for one already-chosen date — a
 *  clean grid of pure hours (08:00, 09:00...) instead of one pill per
 *  (time, instructor) combination, which stopped scaling once a school had
 *  more than a couple of instructors (e.g. 08:00 with 5 different
 *  instructors used to render as 5 separate pills). Picking a time reveals
 *  an instructor dropdown scoped to just that time — same decoupled
 *  date/time-then-instructor shape as RescheduleModal.tsx, but still backed
 *  by real per-slot availability from /api/owner/available-slots
 *  (getAvailableSlotsForDate already excludes any instructor who's busy at
 *  a given hour, so every name offered in the dropdown is genuinely free —
 *  this never re-introduces the old guess-and-check-against-conflict-errors
 *  problem TimeSlotPicker originally replaced).
 *
 *  studentConflict is a date-wide flag, not a per-slot one (see
 *  getAvailableSlotsForDate's own comment — every slot for the requested
 *  date carries the same value), so it's read once off the first slot and
 *  disables the whole picker for this date instead of being re-checked per
 *  time/instructor. */
export default function TimeSlotPicker({
  slots,
  loading,
  selected,
  onSelect,
  emptyMessage = 'Nenhum horário livre encontrado nesta data — tente outra data.',
}: {
  slots: TimeSlot[]
  loading: boolean
  selected: { time: string; instructor_id: string } | null
  onSelect: (slot: TimeSlot) => void
  emptyMessage?: string
}) {
  const [pickedTime, setPickedTime] = useState<string | null>(selected?.time ?? null)

  // Stays in sync with an externally-reset/-restored selection — e.g. a
  // date change clears `selected` upstream (UnifiedSaleBookingModal), or an
  // edit flow pre-fills it.
  useEffect(() => {
    setPickedTime(selected?.time ?? null)
  }, [selected?.time])

  if (loading) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--mist)', padding: '8px 0' }}>
        Buscando horários livres...
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div style={{
        fontSize: '12px', color: 'var(--mist)',
        background: 'var(--powder)', borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
      }}>
        {emptyMessage}
      </div>
    )
  }

  const studentConflict = slots[0]?.studentConflict ?? false

  const times: string[] = []
  for (const slot of slots) {
    if (!times.includes(slot.time)) times.push(slot.time)
  }

  const instructorsForPickedTime = pickedTime ? slots.filter(s => s.time === pickedTime) : []

  function pickTime(time: string) {
    setPickedTime(time)
    const candidates = slots.filter(s => s.time === time)
    // Only one instructor free at this hour — nothing left to choose, so
    // select it immediately instead of making the owner confirm a dropdown
    // with a single option.
    if (candidates.length === 1) onSelect(candidates[0])
  }

  return (
    <div>
      {studentConflict && (
        <div style={{
          fontSize: '11px', color: 'var(--signal-dark)',
          background: 'var(--signal-light)', borderRadius: 'var(--radius-md)',
          padding: '8px 10px', marginBottom: '8px',
        }}>
          Aluno já tem uma aula marcada neste dia — escolha outra data.
        </div>
      )}

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px',
        maxHeight: '140px', overflowY: 'auto', padding: '2px',
      }}>
        {times.map(time => {
          const active = pickedTime === time
          return (
            <button
              key={time}
              type="button"
              disabled={studentConflict}
              onClick={() => pickTime(time)}
              style={{
                minWidth: '60px', padding: '7px 10px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${
                  studentConflict ? 'var(--border)' : active ? 'var(--glacial)' : 'var(--border-strong)'
                }`,
                background: studentConflict ? 'var(--powder)' : active ? 'var(--glacial-light)' : '#fff',
                color: studentConflict ? 'var(--mist)' : active ? 'var(--glacial-dark)' : 'var(--slate)',
                fontSize: '13px', fontWeight: active ? '600' : '500',
                cursor: studentConflict ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {time}
            </button>
          )
        })}
      </div>

      {pickedTime && !studentConflict && (
        <div style={{ marginTop: '10px' }}>
          <label style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--mist)', display: 'block', marginBottom: '6px',
          }}>
            Instrutor
          </label>
          <select
            style={selectStyle}
            value={selected?.time === pickedTime ? selected.instructor_id : ''}
            onChange={e => {
              const slot = instructorsForPickedTime.find(s => s.instructor_id === e.target.value)
              if (slot) onSelect(slot)
            }}
          >
            <option value="">Selecionar...</option>
            {instructorsForPickedTime.map(s => (
              <option key={s.instructor_id} value={s.instructor_id}>{s.instructor_name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
