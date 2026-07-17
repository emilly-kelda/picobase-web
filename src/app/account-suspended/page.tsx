import Logo from '@/components/Logo'

export default function AccountSuspendedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--powder)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <Logo size={20} variant="full" />
      </div>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        maxWidth: '380px',
      }}>
        <h1 style={{
          fontSize: '18px', fontWeight: '600',
          color: 'var(--slate)', marginBottom: '8px',
        }}>
          Acesso suspenso
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)', lineHeight: '1.5' }}>
          O acesso da sua escola está temporariamente suspenso. Entre em contato
          com o suporte Pico Base para regularizar sua assinatura.
        </p>
      </div>
    </div>
  )
}
