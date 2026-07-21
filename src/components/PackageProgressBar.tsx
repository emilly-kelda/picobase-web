/** Thin horizontal progress bar showing package hours consumed vs. total —
 *  a graphical complement to the existing "Xh restantes" text, not a
 *  replacement (the text stays; this just adds an at-a-glance visual). */
export default function PackageProgressBar({
  pctUsed,
  width = '100%',
}: {
  pctUsed: number
  width?: string | number
}) {
  const clamped = Math.min(100, Math.max(0, pctUsed))
  return (
    <div style={{ width, height: '4px', background: '#F4F4F5', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ width: `${clamped}%`, height: '100%', background: '#10B981', borderRadius: '2px' }} />
    </div>
  )
}
