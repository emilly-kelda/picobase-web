'use client'

import { useEffect, useRef, useState, Children, isValidElement } from 'react'
import type { ReactNode, ReactElement } from 'react'

const triggerStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
}

type OptionEl = ReactElement<{ value: string; children?: ReactNode; disabled?: boolean }>

/** Shared dropdown primitive — a fully custom popup, NOT a styled native
 *  <select>. A native select's closed control can be restyled with CSS,
 *  but its OPEN option list is rendered by the OS/browser itself (a
 *  native listbox) and can never be restyled — Chrome always shows its
 *  own plain, system-font popup there no matter how the trigger looks.
 *  This renders its own absolutely-positioned option list instead,
 *  matching the same visual language as the app's other custom
 *  dropdowns (e.g. the Aluno autocomplete suggestions in
 *  ScheduledLessons.tsx's Agendar Aula modal).
 *
 *  Same <option value=...>Label</option> children API as a native
 *  select, so every existing call site keeps working unchanged — options
 *  are read out of `children` via Children.toArray instead of being
 *  passed as a separate prop. onChange receives a plain
 *  { target: { value } } object, not a real DOM event, but every call
 *  site only ever reads e.target.value, so the shape is compatible. */
export default function Select({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string
  onChange: (e: { target: { value: string } }) => void
  disabled?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const options = Children.toArray(children).filter(isValidElement) as OptionEl[]
  const selected = options.find(o => o.props.value === value)

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          ...triggerStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? 'var(--powder)' : '#fff',
          color: disabled ? 'var(--mist)' : value ? 'var(--slate)' : 'var(--mist)',
          borderColor: open ? 'var(--slate)' : 'var(--border-strong)',
          boxShadow: open ? '0 0 0 3px rgba(13,15,20,0.08)' : '0 1px 2px rgba(13,15,20,0.04)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.props.children : '—'}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            flexShrink: 0, color: 'var(--mist)',
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 60,
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          maxHeight: '240px', overflowY: 'auto',
        }}>
          {options.map((opt, i) => {
            const isSelected = opt.props.value === value
            return (
              <button
                key={opt.props.value || i}
                type="button"
                disabled={opt.props.disabled}
                onClick={() => { onChange({ target: { value: opt.props.value } }); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', border: 'none',
                  borderBottom: i < options.length - 1 ? '0.5px solid var(--border)' : 'none',
                  background: isSelected ? 'var(--powder)' : 'transparent',
                  color: opt.props.disabled ? 'var(--mist)' : 'var(--slate)',
                  fontSize: '14px', fontFamily: 'var(--font-sans)',
                  cursor: opt.props.disabled ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!opt.props.disabled) e.currentTarget.style.backgroundColor = 'var(--powder)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? 'var(--powder)' : 'transparent' }}
              >
                {opt.props.children}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
