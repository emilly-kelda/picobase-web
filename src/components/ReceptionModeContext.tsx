'use client'

import { createContext, useContext, useState } from 'react'

type ReceptionModeValue = {
  isReceptionMode: boolean
  toggle: () => void
}

const ReceptionModeContext = createContext<ReceptionModeValue>({
  isReceptionMode: false,
  toggle: () => {},
})

export function useReceptionMode() {
  return useContext(ReceptionModeContext)
}

/** "Modo Recepção" — blurs financial figures on Spot for front-desk
 *  use, when the screen is visible to walk-in students/parents rather than
 *  just the owner. Pure client-side display state, deliberately not
 *  persisted (cookie/localStorage) — it always starts revealed on load, so
 *  nobody can leave the desk with values silently still hidden, and nobody
 *  can leave them silently exposed after a previous recepção shift either. */
export function ReceptionModeProvider({ children }: { children: React.ReactNode }) {
  const [isReceptionMode, setIsReceptionMode] = useState(false)
  return (
    <ReceptionModeContext.Provider value={{ isReceptionMode, toggle: () => setIsReceptionMode(v => !v) }}>
      {children}
    </ReceptionModeContext.Provider>
  )
}
