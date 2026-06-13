export default function DemoPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0EEE9',
      paddingTop: '80px',
      fontFamily: 'var(--font-geist-sans, system-ui)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 40px 80px',
    }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#8A8C98', marginBottom: '16px',
        }}>
          Demonstração
        </div>
        <h1 style={{
          fontSize: '36px', fontWeight: '700',
          color: '#0D0F12', margin: '0 0 16px',
          letterSpacing: '-0.03em',
        }}>
          Agende uma demonstração
        </h1>
        <p style={{
          fontSize: '16px', color: '#6A6C78',
          lineHeight: '1.6', margin: '0 0 40px',
        }}>
          Mostramos o sistema funcionando com a sua escola configurada.
          30 minutos. Sem compromisso.
        </p>
        <div style={{
          background: '#fff', borderRadius: '16px',
          padding: '48px 32px', border: '0.5px solid #E4E0D8',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>📅</div>
          <div style={{
            fontSize: '15px', fontWeight: '500',
            color: '#0D0F12', marginBottom: '8px',
          }}>
            Em breve
          </div>
          <div style={{
            fontSize: '14px', color: '#8A8C98',
            marginBottom: '24px', lineHeight: '1.5',
          }}>
            Enquanto isso, entre em contato pelo WhatsApp
          </div>
          <a href="https://wa.me/5585999999999" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#25D366', color: '#fff',
            padding: '12px 24px', borderRadius: '10px',
            fontSize: '14px', fontWeight: '500',
            textDecoration: 'none',
          }}>
            Falar no WhatsApp →
          </a>
        </div>
      </div>
    </div>
  )
}
