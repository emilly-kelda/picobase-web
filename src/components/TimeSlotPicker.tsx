'use client'

export type TimeSlot = {
  time: string
  instructor_id: string
  instructor_name: string
  studentConflict: boolean
}

/** Compact pill grid for picking a (time, instructor) slot on one already-
 *  chosen date — one click sets both instead of two separate fields. Backed
 *  by /api/owner/available-slots (getAvailableSlotsForDate), which already
 *  marks studentConflict per slot (day-wide, not just an overlapping time —
 *  a second lesson anywhere on a day the student already has one gets
 *  rejected on submit regardless of the hour, see checkSameDayLesson in
 *  scheduledLessonRepository.ts). Originally UnifiedSaleBookingModal's Step
 *  3 only; factored out so ScheduledLessons.tsx's own "Agendar aula" modal
 *  (single/individual mode) can use the same design instead of a bare
 *  date+time input pair plus a separate instructor dropdown. */
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

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '8px',
      maxHeight: '220px', overflowY: 'auto', padding: '2px',
    }}>
      {slots.map(slot => {
        const active = selected?.time === slot.time && selected?.instructor_id === slot.instructor_id
        return (
          <button
            key={`${slot.time}-${slot.instructor_id}`}
            type="button"
            disabled={slot.studentConflict}
            onClick={() => onSelect(slot)}
            title={slot.studentConflict ? 'Aluno já tem uma aula marcada neste dia' : undefined}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${
                slot.studentConflict ? 'var(--border)' : active ? 'var(--glacial)' : 'var(--border-strong)'
              }`,
              background: slot.studentConflict ? 'var(--powder)' : active ? 'var(--glacial-light)' : '#fff',
              color: slot.studentConflict ? 'var(--mist)' : active ? 'var(--glacial-dark)' : 'var(--slate)',
              fontSize: '12px', fontWeight: active ? '600' : '500',
              cursor: slot.studentConflict ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              textDecoration: slot.studentConflict ? 'line-through' : 'none',
              opacity: slot.studentConflict ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {slot.time} · {slot.instructor_name}
            {slot.studentConflict && ' (aluno ocupado)'}
          </button>
        )
      })}
    </div>
  )
}
