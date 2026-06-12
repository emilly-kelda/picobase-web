import OwnerNav from '@/components/OwnerNav'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--powder)' }}>
      <OwnerNav />
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 40px',
      }}>
        {children}
      </main>
    </div>
  )
}

