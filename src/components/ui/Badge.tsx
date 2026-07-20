import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant = 'success' | 'danger' | 'neutral'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-pb-glacial-light text-pb-glacial-dark',
  danger:  'bg-pb-signal-light text-pb-signal',
  neutral: 'bg-pb-powder text-pb-mist',
}

type BadgeProps = {
  variant?: BadgeVariant
  children: ReactNode
} & HTMLAttributes<HTMLSpanElement>

/** Shared status-badge primitive (picobase_design_system_dossie.md,
 *  Fase 2) — always a light-background + dark-text pair from the same
 *  color family, never plain text on a saturated fill.
 *  - success: "Termo assinado", "Confirmada"
 *  - danger:  "Sem créditos", "Overdue"
 *  - neutral: "Agendada", "Pending" */
export default function Badge({
  variant = 'neutral',
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
