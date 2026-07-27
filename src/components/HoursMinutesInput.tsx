'use client'

/** Hours + minutes pair for a custom lesson duration, in place of a single
 *  raw "type the total in minutes" field — asking an operator to type 90
 *  for "1h30" or 195 for "3h15" is exactly the friction being fixed here.
 *  Always reports/accepts the total in minutes, since that's what every
 *  caller (scheduled_lessons.duration_min, sessions.duration_min) stores. */
export default function HoursMinutesInput({
  totalMinutes,
  onChange,
  maxHours = 8,
}: {
  totalMinutes: number
  onChange: (totalMinutes: number) => void
  maxHours?: number
}) {
  const hours = Math.floor(Math.max(0, totalMinutes) / 60)
  const minutes = Math.max(0, totalMinutes) % 60

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '0.5px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    fontSize: '15px', fontWeight: '600',
    color: 'var(--slate)', fontFamily: 'var(--font-sans)',
    outline: 'none', background: '#fff', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <select
        aria-label="Horas"
        value={hours}
        onChange={e => onChange(Number(e.target.value) * 60 + minutes)}
        style={selectStyle}
      >
        {Array.from({ length: maxHours + 1 }, (_, h) => (
          <option key={h} value={h}>{h}h</option>
        ))}
      </select>
      <select
        aria-label="Minutos"
        value={minutes}
        onChange={e => onChange(hours * 60 + Number(e.target.value))}
        style={selectStyle}
      >
        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
          <option key={m} value={m}>{m}min</option>
        ))}
      </select>
    </div>
  )
}
