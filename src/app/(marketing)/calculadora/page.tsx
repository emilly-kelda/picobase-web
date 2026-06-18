'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function CalculadoraPage() {
  const [profit, setProfit] = useState(0)
  const [burn,   setBurn]   = useState(6000)
  const [custom, setCustom] = useState(false)
  const [customBurn, setCustomBurn] = useState('')

  const activeBurn = custom ? (parseInt(customBurn) || 0) : burn
  const runway     = activeBurn > 0 ? profit / activeBurn : 0
  const barPct     = Math.min(100, (runway / 12) * 100)
  const barColor   = runway >= 6 ? '#00A896' : runway >= 3 ? '#D4A017' : '#E8471A'
  const safetyScore = runway >= 9
    ? { label: 'Protegido',  color: '#007868', bg: '#E0F8F5', sub: 'Sua temporada cobre mais de 9 meses. Posição excelente.' }
    : runway >= 6
    ? { label: 'Saudável',   color: '#00A896', bg: '#E0F8F5', sub: 'Cobertura confortável para a baixa temporada.' }
    : runway >= 3
    ? { label: 'Vulnerável', color: '#8A5E00', bg: '#FFF8E8', sub: 'Alguma reserva, mas uma temporada fraca pode comprometer o caixa.' }
    : runway > 0
    ? { label: 'Crítico',    color: '#B83010', bg: '#FDF0EC', sub: 'A temporada não cobre a baixa temporada. Revise custos ou receita.' }
    : { label: '—', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)', sub: 'Ajuste os valores ao lado para ver sua reserva de baixa temporada.' }
  const targetMonths    = 12
  const gap             = runway >= targetMonths ? 0 : Math.round((targetMonths * activeBurn) - profit)
  const avgLessonProfit = 250
  const lessonsNeeded   = gap > 0 ? Math.ceil(gap / avgLessonProfit) : 0
  const survivalDate    = (() => {
    if (runway <= 0) return null
    const d = new Date()
    d.setMonth(d.getMonth() + Math.floor(runway))
    return d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  })()

  function fmt(n: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n)
  }

  const scenarios = [3000, 5000, 8000, 12000, 20000]

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="calc-wrap" style={{
      minHeight: '100vh', background: '#F0EEE9',
      paddingTop: '56px',
      fontFamily: 'var(--font-geist-sans, system-ui)',
    }}>

      <style>{`
        .calc-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }
        .calc-sticky { display: none; }
        @media (max-width: 768px) {
          .calc-columns  { grid-template-columns: 1fr; }
          .calc-wrap     { padding-bottom: 76px !important; }
          .calc-nav      { padding: 0 20px !important; }
          .calc-main     { padding: 32px 20px !important; }
          .calc-sticky   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .calc-sticky { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <header className="calc-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid #E4E0D8',
        height: '56px',
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo size={20} variant="full" />
        </Link>
        <Link href="/owner" style={{
          fontSize: '13px', fontWeight: '500',
          color: '#fff', background: '#1A1C22',
          textDecoration: 'none',
          padding: '8px 18px', borderRadius: '8px',
        }}>
          Entrar →
        </Link>
      </header>

      <div className="calc-main" style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 40px' }}>

        {/* Headline */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#8A8C98', marginBottom: '12px',
          }}>
            Ferramenta gratuita
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: '700', color: '#1A1C22',
            lineHeight: '1.1', margin: '0 0 16px',
            letterSpacing: '-0.03em',
          }}>
            Calculadora de Reserva<br />de Baixa Temporada
          </h1>
          <p style={{ fontSize: '16px', color: '#6A6C78', lineHeight: '1.6', margin: '0' }}>
            Digite o lucro da sua temporada e o custo mensal da escola para descobrir quantos meses de baixa temporada você consegue cobrir.
          </p>
        </div>

        {/* Two-column: Inputs (left) + Results (right) */}
        <div className="calc-columns" style={{ marginBottom: '32px' }}>

          {/* Inputs */}
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '32px',
            border: '0.5px solid #E4E0D8',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1A1C22', margin: '0 0 24px' }}>
              Seus números
            </h3>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#1A1C22' }}>
                  Lucro da temporada
                </label>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1A1C22', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(profit)}
                </span>
              </div>
              <input type="range" min={0} max={300000} step={1000} value={profit}
                onChange={e => setProfit(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#1B4B5A', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#C8C6C0', marginTop: '4px' }}>
                <span>R$ 0</span><span>R$ 300k</span>
              </div>
              <div style={{ fontSize: '12px', color: '#8A8C98', marginTop: '8px' }}>
                Receita total menos comissões de instrutores e parceiros.
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#1A1C22' }}>
                  Custo operacional mensal
                </label>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1A1C22', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(activeBurn)}
                </span>
              </div>
              {!custom ? (
                <>
                  <input type="range" min={500} max={50000} step={500} value={burn}
                    onChange={e => setBurn(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#E8471A', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#C8C6C0', marginTop: '4px' }}>
                    <span>R$ 500</span><span>R$ 50k</span>
                  </div>
                </>
              ) : (
                <input type="number" value={customBurn}
                  onChange={e => setCustomBurn(e.target.value)}
                  placeholder="Digite o valor exato..."
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '0.5px solid #D8D2C8', borderRadius: '8px',
                    fontSize: '15px', color: '#1A1C22',
                    fontFamily: 'inherit', outline: 'none',
                    boxSizing: 'border-box' as const,
                  }}
                />
              )}
              <button onClick={() => { setCustom(!custom); setCustomBurn('') }} style={{
                background: 'transparent', border: 'none',
                fontSize: '12px', color: '#1B4B5A',
                cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit',
              }}>
                {custom ? '← Usar controle deslizante' : 'Digitar valor exato →'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div style={{
            background: '#1A1C22', borderRadius: '20px',
            padding: '40px', textAlign: 'center',
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '500',
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)', marginBottom: '12px',
            }}>
              Reserva de Baixa Temporada
            </div>
            <div style={{
              fontSize: '96px', fontWeight: '700',
              color: runway > 0 ? barColor : 'rgba(255,255,255,0.2)',
              lineHeight: '1', fontVariantNumeric: 'tabular-nums',
              marginBottom: '8px', transition: 'color 0.3s',
            }}>
              {runway > 0 ? runway.toFixed(1) : '—'}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>
              meses cobertos
            </div>
            <div style={{
              height: '8px', background: 'rgba(255,255,255,0.08)',
              borderRadius: '99px', overflow: 'hidden', marginBottom: '8px',
            }}>
              <div style={{
                height: '100%', width: `${barPct}%`,
                background: barColor, borderRadius: '99px',
                transition: 'width 0.4s, background 0.3s',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginBottom: '28px',
            }}>
              {['0', '3mo', '6mo', '9mo', '12mo'].map(m => <span key={m}>{m}</span>)}
            </div>
            <div style={{
              display: 'inline-block', padding: '8px 20px',
              borderRadius: '99px', fontSize: '14px', fontWeight: '500',
              background: safetyScore.bg,
              color: safetyScore.color,
              marginBottom: '8px',
            }}>
              {safetyScore.label}
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px', lineHeight: '1.5' }}>
              {safetyScore.sub}
            </p>
            {survivalDate && (
              <div style={{
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '10px', textAlign: 'left',
                marginBottom: '12px',
              }}>
                <div style={{
                  fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                  marginBottom: '4px', letterSpacing: '0.06em',
                }}>
                  A escola opera até
                </div>
                <div style={{ fontSize: '22px', fontWeight: '600', color: '#fff' }}>
                  {survivalDate}
                </div>
              </div>
            )}
            {gap > 0 && (
              <div style={{
                padding: '14px 16px',
                background: '#FFF8E8', borderRadius: '10px',
                textAlign: 'left',
              }}>
                <div style={{
                  fontSize: '12px', color: '#8A5E00',
                  fontWeight: '500', marginBottom: '6px',
                }}>
                  Para atingir {targetMonths} meses de reserva:
                </div>
                <div style={{
                  fontSize: '24px', fontWeight: '700',
                  color: '#8A5E00', fontVariantNumeric: 'tabular-nums',
                  marginBottom: '4px',
                }}>
                  + {new Intl.NumberFormat('pt-BR', {
                    style: 'currency', currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(gap)}
                </div>
                <div style={{ fontSize: '12px', color: '#8A5E00', opacity: 0.7 }}>
                  ≈ {lessonsNeeded} aulas a mais (média R$ {avgLessonProfit}/aula)
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Scenario table */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          padding: '24px 32px', marginBottom: '40px',
          border: '0.5px solid #E4E0D8',
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1C22', marginBottom: '16px' }}>
            Com {fmt(profit)} de lucro, diferentes custos mensais:
          </div>
          {scenarios.map((s, i) => {
            const r = profit > 0 ? profit / s : 0
            const c = r >= 6 ? '#00A896' : r >= 3 ? '#D4A017' : '#E8471A'
            return (
              <div key={s} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '12px 0',
                borderBottom: i < scenarios.length - 1 ? '0.5px solid #F0EEE9' : 'none',
              }}>
                <span style={{ fontSize: '14px', color: '#6A6C78' }}>{fmt(s)}/mês</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: c, fontVariantNumeric: 'tabular-nums' }}>
                  {profit > 0 ? `${r.toFixed(1)} meses` : '—'}
                </span>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{
          background: '#2B3340', borderRadius: '16px',
          padding: '32px', textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', margin: '0 0 12px' }}>
            Veja esse número em tempo real durante a temporada
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', lineHeight: '1.6' }}>
            No Pico Base, a Reserva de Baixa Temporada atualiza a cada aula confirmada.
          </p>
          <Link href="/demo" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#E8471A', color: '#fff',
            padding: '14px 28px', borderRadius: '10px',
            fontSize: '15px', fontWeight: '500', textDecoration: 'none',
            minHeight: '48px',
          }}>
            Agendar demonstração →
          </Link>
        </div>

      </div>

      {/* Sticky CTA — mobile only, after scroll */}
      <div
        className="calc-sticky"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45,
          background: '#fff', borderTop: '0.5px solid #E4E0D8',
          padding: '12px 20px', gap: '10px',
          display: scrolled ? 'flex' : 'none',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.05)',
        }}
      >
        <Link href="/" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F0EEE9', color: '#1A1C22',
          padding: '14px', borderRadius: '10px',
          fontSize: '14px', fontWeight: '500', textDecoration: 'none',
          border: '0.5px solid #E4E0D8', minHeight: '48px',
        }}>
          ← Início
        </Link>
        <Link href="/demo" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#E8471A', color: '#fff',
          padding: '14px', borderRadius: '10px',
          fontSize: '14px', fontWeight: '500', textDecoration: 'none',
          minHeight: '48px',
        }}>
          Agendar demo →
        </Link>
      </div>

    </div>
  )
}
