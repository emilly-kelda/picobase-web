'use client'

import { useEffect, useState } from 'react'
import Logo from '@/components/Logo'

// Splash overlay shown until the app has mounted client-side. The delay
// before fading isn't an artificial wait — it just lets the logo's pop-in
// bounce (see .pb-loader-logo, ~0.6s) finish playing before the fade starts,
// so the entrance animation is never cut off mid-bounce.
const FADE_DELAY_MS = 600
const FADE_DURATION_MS = 400

export default function AppLoader() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setMounted(true), FADE_DELAY_MS)
    const removeTimer = setTimeout(() => setVisible(false), FADE_DELAY_MS + FADE_DURATION_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '28px',
        background: '#1A1C22',
        opacity: mounted ? 0 : 1,
        transition: `opacity ${FADE_DURATION_MS}ms ease`,
        pointerEvents: mounted ? 'none' : 'auto',
      }}
    >
      <div className="pb-loader-logo">
        <Logo size={30} variant="full" theme="dark" />
      </div>
      <div className="pb-loader-spinner" />
    </div>
  )
}
