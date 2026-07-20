'use client'

import { useEffect, useRef, useState } from 'react'

export type OverflowMenuItem = {
  label: string
  danger?: boolean
  disabled?: boolean
} & (
  | { onClick: () => void; href?: undefined }
  // Real <a href target="_blank"> instead of a window.open() from an
  // onClick — WhatsAppActionButton's own reasoning (see
  // ScheduledLessons.tsx) applies here too: an actual link survives
  // middle-click/cmd-click and isn't subject to popup-blocker heuristics
  // the way a script-triggered window.open() sometimes is.
  | { href: string; onClick?: undefined }
)

/** Kebab ("⋮") trigger for a card/row's secondary actions
 *  (picobase_chameleon_button_dossie.md, Fase 2) — Ver ficha, WhatsApp,
 *  Editar, Remover, etc. move here instead of sitting in the row as their
 *  own buttons, so a row is never more than
 *  [info] [ChameleonButton] [OverflowMenu]. Nothing is lost, just
 *  reorganized behind one more click for the less time-critical actions. */
export default function OverflowMenu({ items }: { items: OverflowMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  if (items.length === 0) return null

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Mais ações"
        aria-expanded={open}
        // 18px glyph — exact size from the approved mockup, which calls
        // out the kebab alongside the WhatsApp icon explicitly (both
        // "font-size: 18px; color: #8A8C98; sem fundo, sem borda").
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[18px] text-pb-mist hover:bg-pb-powder hover:text-pb-slate"
      >
        ⋮
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-pb-border bg-pb-white py-1 shadow-lg"
        >
          {items.map((item, i) => {
            const className = `block w-full px-3 py-2 text-left text-xs whitespace-nowrap hover:bg-pb-powder ${
              item.disabled ? 'text-pb-mist opacity-50 pointer-events-none' : item.danger ? 'text-pb-signal' : 'text-pb-slate'
            }`
            if (item.href) {
              return (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  {item.label}
                </a>
              )
            }
            return (
              <button
                key={i}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => { setOpen(false); item.onClick?.() }}
                className={className}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
