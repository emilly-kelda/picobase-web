import Link from 'next/link'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      {children}
      <footer style={{
        borderTop: '0.5px solid #E4E0D8',
        padding: '28px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#8A8C98',
        background: '#fff',
      }}>
        <span style={{ fontWeight: '600', color: '#1A1C22', fontSize: '14px' }}>
          Pico Base
        </span>
        <span>
          O sistema operacional para escolas sazonais de esportes.
        </span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
