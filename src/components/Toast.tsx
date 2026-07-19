'use client'

import { useState } from 'react'

export type ToastState = { type: 'ok' | 'err'; msg: string } | null

/** Same fixed-bottom-right pattern already used inline in CrewClient.tsx,
 *  pulled out here since NotificationsModal needs it too. CrewClient's own
 *  copy is left as-is — not touched by this change. */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null)
  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }
  return { toast, showToast }
}

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 300,
      background: toast.type === 'ok' ? 'var(--glacial-light)' : '#FFF3F3',
      border: `0.5px solid ${toast.type === 'ok' ? 'var(--glacial)' : 'var(--signal)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '12px 20px',
      fontSize: '13px',
      color: toast.type === 'ok' ? 'var(--glacial-dark)' : 'var(--signal)',
      fontWeight: '500',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <span>{toast.type === 'ok' ? '✓' : '⚠'}</span>
      {toast.msg}
    </div>
  )
}
