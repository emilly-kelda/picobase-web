import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'dark'
export type ButtonSize = 'md' | 'sm' | 'xs'

// font-medium only on the solid-fill variants — the approved mockup
// (picobase_chameleon_button_dossie.md urgent visual-spec correction)
// explicitly calls out secondary ("Reagendar") as "SEM font-weight extra
// (400/normal)", distinct from primary/danger's 500.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-pb-glacial text-pb-white border border-transparent font-medium hover:opacity-90',
  // border-[0.5px], not the default 1px `border` — matches the hairline
  // border every card container in the app already uses (inline
  // `0.5px solid var(--border)`).
  secondary: 'bg-transparent text-pb-slate border-[0.5px] border-pb-storm font-normal hover:bg-pb-storm/5',
  tertiary:  'bg-transparent text-pb-mist border border-transparent font-normal hover:text-pb-slate',
  danger:    'bg-pb-signal text-pb-white border border-transparent font-medium hover:opacity-90',
  // Not in the original Fase 1 spec — added for
  // picobase_chameleon_button_dossie.md's "na_agua" ChameleonButton state,
  // which explicitly asks for a color distinct from all 4 above ("pra não
  // confundir com 'ainda não iniciou'").
  dark:      'bg-pb-storm text-pb-white border border-transparent font-medium hover:opacity-90',
}

// md is the pre-existing app-wide default (untouched by the mockup, used
// anywhere this spec doesn't reach). sm/xs are exact pixel values from the
// approved mockup: Aguardando Vento row buttons are 8px/12px padding at
// 13px; Linha de agenda row buttons are 6px/12px padding at the same 13px.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-2 text-[13px]',
  xs: 'px-3 py-1.5 text-[13px]',
}

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

/** Shared button primitive (picobase_design_system_dossie.md, Fase 1).
 *
 *  Rule of use: at most one `primary` per card/list row — if a primary
 *  already exists there, other actions on that row should be `secondary`
 *  or `tertiary`. `danger` is reserved for genuine urgency (e.g. "Vender
 *  pacote" for a student with no credit, "Remover instrutor"), not general
 *  destructive styling. */
export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg whitespace-nowrap transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
