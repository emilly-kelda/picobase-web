export type LogoVariant = 'full' | 'mark'

export default function Logo({
  size = 16,
  variant = 'full',
  theme = 'light',
}: {
  size?: number
  variant?: LogoVariant
  theme?: 'light' | 'dark'
}) {
  const baseColor = theme === 'dark' ? 'rgba(255,255,255,0.85)' : '#1A1C22'

  if (variant === 'mark') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size * 1.75}px`,
        height: `${size * 1.75}px`,
        borderRadius: `${size * 0.35}px`,
        background: '#1A1C22',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-jakarta, system-ui)',
          fontSize: `${size}px`,
          fontWeight: '800',
          fontStyle: 'italic',
          color: '#E8471A',
          lineHeight: '1',
          letterSpacing: '-0.02em',
          userSelect: 'none',
        }}>
          P
        </span>
      </span>
    )
  }

  return (
    <span style={{
      fontFamily: 'var(--font-jakarta, system-ui)',
      fontSize: `${size}px`,
      letterSpacing: '-0.02em',
      lineHeight: '1',
      display: 'inline-flex',
      alignItems: 'baseline',
      userSelect: 'none',
    }}>
      <span style={{
        fontWeight: '800',
        fontStyle: 'italic',
        color: '#E8471A',
      }}>
        Pico
      </span>
      <span style={{
        fontWeight: '500',
        fontStyle: 'normal',
        color: baseColor,
      }}>
        {' '}Base
      </span>
    </span>
  )
}
