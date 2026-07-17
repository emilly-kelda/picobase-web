'use client'

import { useEffect, useState } from 'react'

type Notice = { id: string; message: string }

export default function NoticeBanner() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    fetch('/api/owner/notices')
      .then(r => r.json())
      .then(data => setNotice(data.notice ?? null))
      .catch(() => {})
  }, [])

  async function dismiss() {
    if (!notice || dismissing) return
    setDismissing(true)
    try {
      await fetch('/api/owner/notices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notice.id }),
      })
      setNotice(null)
    } finally {
      setDismissing(false)
    }
  }

  if (!notice) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', padding: '12px 20px', marginBottom: '20px',
      background: '#FFF8E8', border: '0.5px solid #F5D485',
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#8A5E00' }}>
        <span>⚠</span>
        <span>{notice.message}</span>
      </div>
      <button
        onClick={dismiss}
        disabled={dismissing}
        style={{
          background: 'none', border: 'none', cursor: dismissing ? 'not-allowed' : 'pointer',
          color: '#8A5E00', fontSize: '12px', fontWeight: '500',
          fontFamily: 'var(--font-sans)', flexShrink: 0,
        }}
      >
        Dispensar
      </button>
    </div>
  )
}
