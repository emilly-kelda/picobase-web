import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-pb-glacial text-pb-white border border-transparent hover:opacity-90',
  secondary: 'bg-transparent text-pb-slate border border-pb-storm hover:bg-pb-storm/5',
  tertiary:  'bg-transparent text-pb-mist border border-transparent hover:text-pb-slate',
  danger:    'bg-pb-signal text-pb-white border border-transparent hover:opacity-90',
}

type ButtonProps = {
  variant?: ButtonVariant
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
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
