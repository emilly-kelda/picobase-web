export default function DemoPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0EEE9',
      paddingTop: '56px',
      fontFamily: 'var(--font-geist-sans, system-ui)',
    }}>

      {/* Nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid #E4E0D8',
        height: '56px',
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{
          fontSize: '16px', fontWeight: '600',
          color: '#1A1C22', textDecoration: 'none',
          letterSpacing: '0.01em',
          fontFamily: 'var(--font-jakarta, system-ui)',
        }}>
          <span style={{ fontWeight: '800', fontStyle: 'italic', color: '#E8471A' }}>Pico</span>
          <span style={{ fontWeight: '500' }}> Base</span>
        </a>
        <a href="/owner" style={{
          fontSize: '13px', fontWeight: '500',
          color: '#fff', background: '#1A1C22',
          textDecoration: 'none',
          padding: '8px 18px', borderRadius: '8px',
        }}>
          Entrar →
        </a>
      </header>

      <div style={{
        maxWidth: '960px', margin: '0 auto',
        padding: '60px 40px',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#8A8C98', marginBottom: '16px',
          }}>
            Demonstração
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: '700', color: '#1A1C22',
            lineHeight: '1.1', margin: '0 0 16px',
            letterSpacing: '-0.03em',
          }}>
            Veja o Pico Base com a<br />
            <span style={{ color: '#00A896' }}>sua escola configurada.</span>
          </h1>
          <p style={{
            fontSize: '16px', color: '#6A6C78',
            lineHeight: '1.6', margin: '0 auto',
            maxWidth: '480px',
          }}>
            30 minutos. Mostramos o sistema funcionando com os seus
            instrutores, pacotes e custos reais — não um demo genérico.
          </p>
        </div>

        {/* What to expect */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px', marginBottom: '48px',
        }}>
          {[
            {
              n: '01',
              title: 'Sua escola configurada',
              body: 'Antes da call, configuramos a escola com seus instrutores e pacotes reais.',
            },
            {
              n: '02',
              title: 'O workflow completo',
              body: 'Check-in → confirmar aula → comissão atualiza → fechar mês → exportar pagamento.',
            },
            {
              n: '03',
              title: 'Sua Reserva de Baixa Temporada',
              body: 'Você vê ao vivo quanto essa temporada vai sustentar a escola.',
            },
          ].map((step, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '0.5px solid #E4E0D8',
              borderRadius: '14px',
              padding: '24px',
            }}>
              <div style={{
                fontSize: '12px', fontWeight: '600',
                color: '#00A896', marginBottom: '12px',
                fontFamily: 'var(--font-geist-mono, monospace)',
              }}>
                {step.n}
              </div>
              <div style={{
                fontSize: '15px', fontWeight: '600',
                color: '#1A1C22', marginBottom: '8px',
                lineHeight: '1.3',
              }}>
                {step.title}
              </div>
              <div style={{
                fontSize: '13px', color: '#6A6C78',
                lineHeight: '1.6',
              }}>
                {step.body}
              </div>
            </div>
          ))}
        </div>

        {/* Two CTAs side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          maxWidth: '720px',
          margin: '0 auto',
        }}>

          {/* Cal.com card */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '28px',
            border: '0.5px solid #E4E0D8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
          }}>
            <div style={{ fontSize: '32px' }}>📅</div>
            <div>
              <div style={{
                fontSize: '16px', fontWeight: '600',
                color: '#1A1C22', marginBottom: '6px',
              }}>
                Agendar horário
              </div>
              <div style={{
                fontSize: '13px', color: '#8A8C98',
                lineHeight: '1.5', marginBottom: '20px',
              }}>
                Escolha o melhor horário direto na agenda.
              </div>
            </div>
            <a
              href="https://cal.com/emilly-kelda/pico-base-demo"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center',
                gap: '8px', width: '100%',
                justifyContent: 'center',
                background: '#1A1C22', color: '#fff',
                padding: '13px 24px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '500',
                textDecoration: 'none',
              }}
            >
              Ver agenda →
            </a>
          </div>

          {/* WhatsApp card */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '28px',
            border: '0.5px solid #E4E0D8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
          }}>
            <div style={{ fontSize: '32px' }}>💬</div>
            <div>
              <div style={{
                fontSize: '16px', fontWeight: '600',
                color: '#1A1C22', marginBottom: '6px',
              }}>
                Falar no WhatsApp
              </div>
              <div style={{
                fontSize: '13px', color: '#8A8C98',
                lineHeight: '1.5', marginBottom: '20px',
              }}>
                Prefere conversar primeiro? Manda uma mensagem direta.
              </div>
            </div>
            <a
              href="https://wa.me/5562981757687?text=Oi%2C%20quero%20saber%20mais%20sobre%20o%20Pico%20Base"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center',
                gap: '8px', width: '100%',
                justifyContent: 'center',
                background: '#25D366', color: '#fff',
                padding: '13px 24px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '500',
                textDecoration: 'none',
              }}
            >
              Abrir WhatsApp →
            </a>
          </div>

        </div>

        {/* Footer note */}
        <div style={{
          textAlign: 'center', marginTop: '40px',
          fontSize: '13px', color: '#8A8C98',
          lineHeight: '1.6',
        }}>
          Sem compromisso. 30 minutos.<br />
          Configuramos a escola antes da call — você chega e já vê o sistema funcionando.
        </div>

      </div>
    </div>
  )
}
