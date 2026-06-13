import Link from 'next/link'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      {children}
    </div>
  )
}
