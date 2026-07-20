import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant = 'success' | 'danger' | 'neutral'
export type BadgeSize = 'sm' | 'md'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-pb-glacial-light text-pb-glacial-dark',
  danger:  'bg-pb-signal-light text-pb-signal',
  neutral: 'bg-pb-powder text-pb-mist',
}

// Exact values from the approved mockup (picobase_chameleon_button_
// dossie.md urgent visual-spec correction): Aguardando Vento badges
// ("Termo assinado", "Xh restantes", "Sem créditos") are 3px/8px padding
// at 11px; the Linha de agenda "Agendada" badge is 3px/10px at 12px.
const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-[3px] text-[11px]',
  md: 'px-2.5 py-[3px] text-xs',
}

type BadgeProps = {
  variant?: BadgeVariant
  size?: BadgeSize
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
  size = 'sm',
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      // rounded-[6px], not rounded-md — same globals.css/Tailwind
      // --radius-md collision as Button.tsx (see its comment); rounded-md
      // was silently rendering at globals.css's 8px instead of the
      // approved mockup's 6px.
      className={`inline-flex items-center rounded-[6px] font-medium whitespace-nowrap ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
