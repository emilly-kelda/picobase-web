import Link from 'next/link'
import Logo from '@/components/Logo'

/* ─── floating card atoms ─────────────────────────────────────────── */

function InstructorCard() {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #E8E8E8',
      borderRadius: '14px',
      padding: '16px 18px',
      width: '200px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: '#E0F8F5', color: '#007868',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: '700', flexShrink: 0,
        }}>MF</div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1A1C22' }}>Marco Ferreira</div>
          <div style={{ fontSize: '10px', color: '#8A8C98' }}>Kitesurf · 38%</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {[{ l: 'Sessions', v: '24' }, { l: 'Earned', v: 'R$2.4k' }].map(s => (
          <div key={s.l} style={{ background: '#F5F5F5', borderRadius: '8px', padding: '8px 10px' }}>
            <div style={{ fontSize: '9px', color: '#8A8C98', marginBottom: '3px' }}>{s.l}</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1A1C22' }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunwayCard() {
  return (
    <div style={{
      background: '#12343F',
      borderRadius: '14px',
      padding: '20px 22px',
      width: '172px',
    }}>
      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
        Off-season runway
      </div>
      <div style={{ fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: '1', marginBottom: '4px', fontVariantNumeric: 'tabular-nums' }}>
        6.2
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '14px' }}>months funded</div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ height: '100%', width: '52%', background: '#00A896', borderRadius: '99px' }} />
      </div>
      <span style={{
        display: 'inline-flex', padding: '3px 10px',
        borderRadius: '99px', background: 'rgba(0,168,150,0.18)',
        fontSize: '10px', fontWeight: '600', color: '#00A896',
      }}>
        Healthy
      </span>
    </div>
  )
}

function SessionsCard() {
  const sessions = [
    { time: '09:00', name: 'Leila Santos',  sport: 'Wingfoil' },
    { time: '11:30', name: 'Tom Eriksson',  sport: 'Kitesurf' },
    { time: '14:00', name: 'Anna Köhler',   sport: 'Surf' },
  ]
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #E8E8E8',
      borderRadius: '14px',
      padding: '16px 18px',
      width: '220px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: '9px', color: '#8A8C98', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>
        Today · 3 sessions
      </div>
      {sessions.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 0',
          borderBottom: i < sessions.length - 1 ? '0.5px solid #F5F5F5' : 'none',
        }}>
          <span style={{ fontSize: '10px', color: '#8A8C98', width: '34px', flexShrink: 0, fontFamily: 'var(--font-mono, monospace)' }}>
            {s.time}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#1A1C22' }}>{s.name}</div>
            <div style={{ fontSize: '9px', color: '#8A8C98' }}>{s.sport}</div>
          </div>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00A896', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}

function RevenueCard() {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #E8E8E8',
      borderRadius: '14px',
      padding: '18px 20px',
      width: '184px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: '9px', color: '#8A8C98', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
        Season revenue
      </div>
      <div style={{ fontSize: '36px', fontWeight: '700', color: '#1A1C22', lineHeight: '1', marginBottom: '6px', fontVariantNumeric: 'tabular-nums' }}>
        R$38k
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00A896', display: 'inline-block' }} />
        <span style={{ fontSize: '10px', color: '#00A896', fontWeight: '500' }}>Updated now</span>
      </div>
    </div>
  )
}

function CommissionCard() {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #E8E8E8',
      borderRadius: '14px',
      padding: '16px 18px',
      width: '190px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: '9px', color: '#8A8C98', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
        Commissions · June
      </div>
      {[
        { init: 'MF', name: 'Marco F.',  amount: 'R$1.178', color: '#E0F8F5', text: '#007868' },
        { init: 'AK', name: 'Ana K.',    amount: 'R$840',   color: '#E0F8F5', text: '#007868' },
      ].map((r, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 0',
          borderBottom: i === 0 ? '0.5px solid #F5F5F5' : 'none',
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: r.color, color: r.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: '700', flexShrink: 0,
          }}>{r.init}</div>
          <span style={{ fontSize: '11px', color: '#1A1C22', flex: 1 }}>{r.name}</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#1A1C22', fontVariantNumeric: 'tabular-nums' }}>{r.amount}</span>
        </div>
      ))}
    </div>
  )
}

function WaiverCard() {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #E8E8E8',
      borderRadius: '14px',
      padding: '14px 16px',
      width: '185px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    }}>
      <span style={{
        display: 'inline-flex', padding: '3px 10px',
        borderRadius: '99px', background: '#E0F8F5',
        fontSize: '9px', fontWeight: '600', color: '#007868',
        marginBottom: '8px',
      }}>
        ✓ Waiver signed
      </span>
      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1A1C22', marginBottom: '2px' }}>
        Tom Eriksson
      </div>
      <div style={{ fontSize: '10px', color: '#8A8C98', marginBottom: '4px' }}>
        Kitesurf · 🇸🇪
      </div>
      <div style={{ fontSize: '9px', color: '#8A8C98', fontFamily: 'var(--font-mono, monospace)' }}>
        09:47 AM
      </div>
    </div>
  )
}

/* ─── page ─────────────────────────────────────────────────────────── */

export default function StartPage() {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100dvh',
      background: '#ffffff',
      overflowX: 'hidden',
      fontFamily: 'var(--font-geist-sans, -apple-system, system-ui, sans-serif)',
    }}>
      <style>{`
        @keyframes floatA {
          0%   { transform: translateY(0px) rotate(-1.5deg); }
          50%  { transform: translateY(-22px) rotate(0.5deg); }
          100% { transform: translateY(0px) rotate(-1.5deg); }
        }
        @keyframes floatB {
          0%   { transform: translate(0, 0) rotate(1deg); }
          33%  { transform: translate(-14px, -20px) rotate(-0.5deg); }
          66%  { transform: translate(10px, -8px) rotate(1.5deg); }
          100% { transform: translate(0, 0) rotate(1deg); }
        }
        @keyframes floatC {
          0%   { transform: translateX(0) translateY(0) rotate(0.5deg); }
          45%  { transform: translateX(-18px) translateY(-14px) rotate(-1deg); }
          100% { transform: translateX(0) translateY(0) rotate(0.5deg); }
        }
        @keyframes floatD {
          0%   { transform: translate(0, 0) rotate(-0.5deg); }
          50%  { transform: translate(12px, -18px) rotate(1deg); }
          100% { transform: translate(0, 0) rotate(-0.5deg); }
        }
        .float-card { pointer-events: none; user-select: none; }

        /* ── responsive ── */
        .hero-h1   { font-size: clamp(54px, 11vw, 148px); }
        .cta-wrap  { flex-direction: row; }
        .cta-btn   { min-width: 200px; }
        .bottom-chips { display: flex; }
        .float-side-l, .float-side-r { display: block; }

        @media (max-width: 768px) {
          .hero-h1  { font-size: clamp(44px, 13vw, 80px); }
          .cta-wrap { flex-direction: column; align-items: center; }
          .cta-btn  { min-width: 260px; width: 260px; }
          .bottom-chips { display: none; }
          .float-side-l, .float-side-r { display: none; }
        }

        @media (max-width: 480px) {
          .hero-h1 { font-size: clamp(38px, 12vw, 60px); }
        }
      `}</style>

      {/* ── BACKGROUND FLOATING CARDS ─────────────────────────────────── */}

      {/* top-left: sessions */}
      <div className="float-card" style={{
        position: 'absolute', top: '18%', left: '4%',
        opacity: 0.09,
        animation: 'floatB 30s ease-in-out infinite',
        animationDelay: '0s',
      }}>
        <SessionsCard />
      </div>

      {/* top-right: runway */}
      <div className="float-card" style={{
        position: 'absolute', top: '14%', right: '5%',
        opacity: 0.09,
        animation: 'floatA 36s ease-in-out infinite',
        animationDelay: '-10s',
      }}>
        <RunwayCard />
      </div>

      {/* mid-left: commissions */}
      <div className="float-card float-side-l" style={{
        position: 'absolute', top: '48%', left: '2%',
        opacity: 0.07,
        animation: 'floatC 40s ease-in-out infinite',
        animationDelay: '-22s',
      }}>
        <CommissionCard />
      </div>

      {/* mid-right: revenue */}
      <div className="float-card float-side-r" style={{
        position: 'absolute', top: '45%', right: '3%',
        opacity: 0.08,
        animation: 'floatD 34s ease-in-out infinite',
        animationDelay: '-6s',
      }}>
        <RevenueCard />
      </div>

      {/* bottom-left: instructor */}
      <div className="float-card" style={{
        position: 'absolute', bottom: '18%', left: '5%',
        opacity: 0.08,
        animation: 'floatA 44s ease-in-out infinite',
        animationDelay: '-18s',
      }}>
        <InstructorCard />
      </div>

      {/* bottom-right: waiver */}
      <div className="float-card" style={{
        position: 'absolute', bottom: '22%', right: '6%',
        opacity: 0.08,
        animation: 'floatB 38s ease-in-out infinite',
        animationDelay: '-30s',
      }}>
        <WaiverCard />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '60px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(0,0,0,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo size={18} variant="full" />
        </Link>
        <Link href="/owner" style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#1A1C22',
          border: '1px solid rgba(0,0,0,0.13)',
          borderRadius: '999px',
          padding: '8px 22px',
          textDecoration: 'none',
          background: 'transparent',
          lineHeight: '1',
          letterSpacing: '-0.01em',
        }}>
          Sign in
        </Link>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 32px 80px',
      }}>

        {/* Eyebrow */}
        <div style={{
          fontSize: '11px',
          fontWeight: '500',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#8A8C98',
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ display: 'inline-block', width: '20px', height: '1px', background: '#C8C6C0' }} />
          Base Camp · Seasonal sports schools
          <span style={{ display: 'inline-block', width: '20px', height: '1px', background: '#C8C6C0' }} />
        </div>

        {/* Headline */}
        <h1
          className="hero-h1"
          style={{
            fontWeight: '700',
            color: '#1A1C22',
            lineHeight: '0.96',
            letterSpacing: '-0.04em',
            margin: '0 0 32px',
            maxWidth: '1000px',
          }}
        >
          One season.<br />
          <span style={{ color: '#00A896' }}>Full control.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(15px, 1.5vw, 19px)',
          color: '#8A8C98',
          lineHeight: '1.65',
          maxWidth: '460px',
          margin: '0 0 52px',
          fontWeight: '300',
          letterSpacing: '-0.01em',
        }}>
          Manage sessions, crew, and cash flow — and know in real time whether this season will carry you through the off-season.
        </p>

        {/* CTAs */}
        <div
          className="cta-wrap"
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '64px',
          }}
        >
          <Link
            href="/owner"
            className="cta-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#00A896',
              color: '#fff',
              padding: '17px 40px',
              borderRadius: '999px',
              fontSize: '15px',
              fontWeight: '500',
              textDecoration: 'none',
              letterSpacing: '-0.015em',
              boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
            }}
          >
            I&apos;m an owner
          </Link>
          <Link
            href="/demo"
            className="cta-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              color: '#1A1C22',
              padding: '17px 40px',
              borderRadius: '999px',
              fontSize: '15px',
              fontWeight: '500',
              textDecoration: 'none',
              border: '1.5px solid rgba(0,0,0,0.14)',
              letterSpacing: '-0.015em',
            }}
          >
            View demo school
          </Link>
        </div>

        {/* Bottom category chips — Brilliant-style */}
        <div
          className="bottom-chips"
          style={{
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            { emoji: '🏄', label: 'Sessions' },
            { emoji: '👥', label: 'Crew' },
            { emoji: '💸', label: 'Payouts' },
            { emoji: '📊', label: 'Runway' },
            { emoji: '✍️', label: 'Waivers' },
          ].map((item, i) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 16px',
                borderRadius: '999px',
                background: '#F5F5F5',
                fontSize: '12px',
                color: '#6A6C78',
                fontWeight: '500',
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.emoji}</span>
              {item.label}
            </div>
          ))}
        </div>

      </section>
    </div>
  )
}
