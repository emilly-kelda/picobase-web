'use client'

import { useReceptionMode } from './ReceptionModeContext'

/** Wraps a single already-formatted value (currency, count, whatever) and
 *  blurs it while Modo Recepção is on — layout stays identical (no "***"
 *  width jump), the number just isn't legible at a glance from across a
 *  desk. */
export default function MaskableValue({ children }: { children: React.ReactNode }) {
  const { isReceptionMode } = useReceptionMode()
  if (!isReceptionMode) return <>{children}</>
  return (
    <span style={{ filter: 'blur(6px)', userSelect: 'none', display: 'inline-block' }} aria-hidden="true">
      {children}
    </span>
  )
}
