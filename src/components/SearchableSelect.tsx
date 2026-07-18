'use client'

import { useRef, useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  color: 'var(--slate)',
  background: '#fff',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
}

/** Free-text input with a custom-styled suggestion dropdown — replaces the
 *  native <input list> + <datalist> combo used across the modals in this
 *  app (PartnerFormModal, PackageFormModal, AddCostModal all have one).
 *  <datalist>'s popup is rendered by the browser/OS shell, not the page, so
 *  it can never be styled via CSS — hence the unaligned, unpadded,
 *  inconsistent look. This is a from-scratch replacement (no Radix/shadcn/
 *  Headless UI in this project — checked package.json) built from the same
 *  div + inline-style + CSS-variable convention every other modal here uses.
 *  Still free text, not a constrained enum — selecting a suggestion just
 *  fills the input, typing anything else is still accepted. */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const needle = value.trim().toLowerCase()
  const filtered = needle
    ? options.filter(o => o.toLowerCase().includes(needle))
    : options

  function selectOption(opt: string) {
    onChange(opt)
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        autoComplete="off"
        style={inputStyle}
      />

      {open && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '6px',
            zIndex: 300,
            maxHeight: '220px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {filtered.map(opt => (
            <div
              key={opt}
              // onMouseDown (not onClick) fires before the input's onBlur,
              // so the selection registers instead of the dropdown closing
              // out from under the click first.
              onMouseDown={e => { e.preventDefault(); selectOption(opt) }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--slate)',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--powder)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
