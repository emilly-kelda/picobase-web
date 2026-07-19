'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const REFRESH_INTERVAL_MS = 30000

/** Polls router.refresh() every 30s so owner-facing pages stay current
 *  without a manual F5. router.refresh() re-fetches the current route's
 *  server component data in place — same URL, same search params, so
 *  active filters (month/instructor/tab/origin) survive it untouched.
 *  Client components below it that copy their data prop into local
 *  useState (PaymentsClient, PendingLessons) need their own sync effect
 *  to actually pick up the refreshed props — this component only drives
 *  the interval and reports status, it can't fix that on its own.
 *
 *  One instance per page, not per card: router.refresh() reloads the
 *  whole route's data at once, so multiple timers on one page would
 *  just fire the same refresh redundantly. Render this once near the
 *  top of the page; it's the single source of truth other containers
 *  could read from if they need their own visible indicator later. */
export default function AutoRefresh() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [justUpdated, setJustUpdated] = useState(false)
  const hasRefreshedOnce = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh()
      })
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [router])

  // isPending flips back to false the instant React finishes committing
  // the refreshed server props — the real "done" signal, not a guessed
  // timeout. Guarded so the very first render (nothing has refreshed
  // yet) doesn't flash "Atualizado agora mesmo" on page load.
  useEffect(() => {
    if (isPending) {
      hasRefreshedOnce.current = true
      return
    }
    if (!hasRefreshedOnce.current) return
    setJustUpdated(true)
    const t = setTimeout(() => setJustUpdated(false), 4000)
    return () => clearTimeout(t)
  }, [isPending])

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontSize: '11px', color: 'var(--mist)',
    }}>
      {isPending ? (
        <>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--glacial)', display: 'inline-block',
            animation: 'pb-autorefresh-pulse 1s ease-in-out infinite',
          }} />
          Sincronizando dados...
        </>
      ) : justUpdated ? (
        <span style={{ color: '#007868' }}>✓ Atualizado agora mesmo</span>
      ) : (
        <span style={{ opacity: 0.6 }}>Atualização automática a cada 30s</span>
      )}
      <style>{`
        @keyframes pb-autorefresh-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
