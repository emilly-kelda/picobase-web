'use client'

import type { ReactNode } from 'react'

const baseStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  color: 'var(--slate)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
}

/** Shared <select> primitive — replaces the browser's native select chrome
 *  (wildly inconsistent across Chrome/Firefox/Safari, and never matches
 *  the design system) with a consistent rounded border, soft shadow, and
 *  a custom SVG chevron. appearance:none + right padding make room for
 *  that arrow. Used anywhere a form needs a dropdown (Agendar Aula,
 *  Editar aula, Agendar from Aguardando Vento, ...) instead of each
 *  caller re-implementing its own <select> styling. */
export default function Select({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...baseStyle,
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          paddingRight: '34px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? 'var(--powder)' : '#fff',
          color: disabled ? 'var(--mist)' : 'var(--slate)',
          boxShadow: '0 1px 2px rgba(13,15,20,0.04)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--slate)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,15,20,0.08)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--border-strong)'
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(13,15,20,0.04)'
        }}
      >
        {children}
      </select>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{
          position: 'absolute', top: '50%', right: '12px',
          transform: 'translateY(-50%)', pointerEvents: 'none',
          color: 'var(--mist)',
        }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
}
