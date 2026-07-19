'use client'

import { useReceptionMode } from './ReceptionModeContext'

// Same hand-drawn inline-SVG convention as nav-icons.tsx — no icon library
// installed in this project.
function EyeIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7c1.6 0 3 .3 4.2.8M22 12s-1.2 2.3-3.4 4.3M15.5 15.2A5 5 0 0 1 8.8 8.5" />
      <path d="M2 2l20 20" />
    </svg>
  )
}

export default function ReceptionModeToggle() {
  const { isReceptionMode, toggle } = useReceptionMode()
  return (
    <button
      type="button"
      onClick={toggle}
      title={isReceptionMode ? 'Modo Recepção ativo — clique para mostrar os valores' : 'Ocultar valores (Modo Recepção)'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', flexShrink: 0,
        borderRadius: 'var(--radius-md)',
        border: `0.5px solid ${isReceptionMode ? 'var(--slate)' : 'var(--border-strong)'}`,
        background: isReceptionMode ? 'var(--slate)' : '#fff',
        color: isReceptionMode ? '#fff' : 'var(--mist)',
        cursor: 'pointer', fontFamily: 'var(--font-sans)',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { if (!isReceptionMode) e.currentTarget.style.background = 'var(--powder)' }}
      onMouseLeave={e => { if (!isReceptionMode) e.currentTarget.style.background = '#fff' }}
    >
      {isReceptionMode ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  )
}
