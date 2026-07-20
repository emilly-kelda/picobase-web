'use client'

/** Same auto-submitting GET-form select PaymentsClient.tsx uses for its own
 *  period picker — a plain uncontrolled <select> that reloads the page with
 *  ?period=YYYY-MM on change. Needs its own 'use client' boundary since
 *  costs/page.tsx (the caller) is a server component and can't hold an
 *  onChange handler itself. */
export default function MonthPeriodSelect({
  period,
  monthOptions,
}: {
  period: string
  monthOptions: { value: string; label: string }[]
}) {
  return (
    <form method="GET">
      <select
        name="period"
        defaultValue={period}
        onChange={e => (e.target.closest('form') as HTMLFormElement)?.submit()}
        style={{
          padding: '8px 14px',
          border: '0.5px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px', color: 'var(--slate)',
          background: '#fff', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', outline: 'none',
        }}
      >
        {monthOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </form>
  )
}
