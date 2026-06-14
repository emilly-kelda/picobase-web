'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── palette ───────────────────────────────────────────────────────────────
// signal  #E8471A   ocean-dark #1B4B5A   teal  #00A896
// amber   #FFF8E8   powder     #F0EEE9   storm #2B3340
// slate   #1A1C22   mist       #6A6C78   fog   #8A8C98

const C = {
  signal:       '#E8471A',
  signalLight:  '#FDF0EC',
  signalDark:   '#B83010',
  ocean:        '#1B4B5A',
  teal:         '#00A896',
  tealLight:    '#E0F8F5',
  tealDark:     '#007868',
  amber:        '#D4A017',
  amberBg:      '#FFF8E8',
  amberBorder:  '#F0D080',
  amberDark:    '#8A5E00',
  powder:       '#F0EEE9',
  powderBorder: '#E4E0D8',
  storm:        '#2B3340',
  slate:        '#1A1C22',
  mist:         '#6A6C78',
  fog:          '#8A8C98',
  white:        '#fff',
}

// ─── content ───────────────────────────────────────────────────────────────
const CONTENT = {
  pt: {
    nav_calc:    'Calculadora',
    nav_enter:   'Entrar →',
    eyebrow:     'Sistema operacional · escolas sazonais de esportes',
    sub:         'Do registro das aulas ao pagamento dos instrutores — e a resposta que todo dono de escola sazonal precisa: esta temporada será suficiente para atravessar a baixa temporada?',
    cta_primary:   'Agendar demonstração →',
    cta_secondary: 'Calcular minha reserva',
    stats: [
      { n: '< 2min', label: 'para um aluno fazer check-in'      },
      { n: '4',      label: 'idiomas suportados'                 },
      { n: '1',      label: 'dashboard para a temporada inteira' },
    ],
    alert_label: 'Atenção',
    alert_band:  '2 pacotes expirando esta semana · 1 alerta médico ativo',
    metrics: [
      { label: 'Reserva',  value: '4.7',      sub: 'meses'     },
      { label: 'Receita',  value: 'R$ 3,6k',  sub: 'temporada' },
      { label: 'Alertas',  value: '3',         sub: 'atenção'   },
      { label: 'Lucro',    value: 'R$ 2,2k',  sub: 'líquido'   },
    ],
    problem_eyebrow: 'O problema',
    problem_h2:      'Todo software de escola mostra o que aconteceu.',
    problem_accent:  'Pico Base mostra se essa temporada é suficiente para atravessar a baixa temporada.',
    problem_body:    'Escolas sazonais não têm receita linear. Você ganha em seis meses e precisa sobreviver em doze. A maioria dos donos descobre que a temporada não foi suficiente só quando o dinheiro acaba.',
    before_after: [
      { label: 'WhatsApp para comunicar aulas',            before: true  },
      { label: 'Excel para calcular comissões',            before: true  },
      { label: 'Papel para registrar waivers',             before: true  },
      { label: 'Check-in digital em 2 minutos',            before: false },
      { label: 'Comissões calculadas automaticamente',     before: false },
      { label: 'Reserva de baixa temporada em tempo real', before: false },
    ],
    calc_eyebrow: 'Ferramenta de planejamento gratuita',
    calc_h2:      'Essa temporada vai ser suficiente?',
    calc_body:    'A maioria dos donos de escola sazonal sabe a receita. Poucos sabem por quanto tempo ela vai durar. Ajuste os números abaixo e veja quantos meses sua temporada pode financiar a baixa temporada.',
    calc_link:    'Abrir calculadora completa →',
    runway_label: 'Reserva de Baixa Temporada',
    runway_sub:   'meses financiados',
    profit_label: 'Lucro da temporada',
    burn_label:   'Custos operacionais mensais',
    how_eyebrow:  'Como funciona',
    how_h2:       'Da chegada do aluno ao planejamento da temporada.',
    steps: [
      { n: '01', title: 'Aluno faz check-in',   body: 'Escaneia o QR code, preenche os dados em menos de 2 minutos e assina o waiver digital. Funciona em 4 idiomas.' },
      { n: '02', title: 'Dono confirma a aula', body: 'Vê o aluno pendente no Base Camp, confirma duração e valor. Comissão calculada automaticamente.' },
      { n: '03', title: 'Dashboard atualiza',    body: 'Receita, comissões e Reserva de Baixa Temporada em tempo real. Feche o mês e exporte o pagamento dos instrutores.' },
    ],
    for_eyebrow: 'Feito para',
    for_h2:      'Qualquer escola sazonal de esportes',
    sports: [
      { emoji: '🪁',  label: 'Kitesurf'  },
      { emoji: '🌊',  label: 'Wingfoil'  },
      { emoji: '🏄',  label: 'Windsurf'  },
      { emoji: '⛷️', label: 'Ski'       },
      { emoji: '🏂',  label: 'Snowboard' },
      { emoji: '🏄‍♂️', label: 'Surf'   },
    ],
    cta_h2:  'Sua temporada começa em quanto tempo?',
    cta_sub: 'Configuramos a escola completa em uma semana. Você começa a usar no primeiro dia da temporada.',
    cta_demo: 'Agendar demonstração →',
    cta_calc: 'Calcular minha reserva',
    footer_tag:   'O sistema operacional para escolas sazonais de esportes.',
    footer_calc:  'Calculadora',
    footer_demo:  'Demonstração',
    footer_enter: 'Entrar',
  },
  en: {
    nav_calc:    'Calculator',
    nav_enter:   'Sign in →',
    eyebrow:     'Operating system · seasonal sports schools',
    sub:         'From check-in to instructor payroll — and the one number that tells you whether this season will carry your school through the off-season.',
    cta_primary:   'Book a demo →',
    cta_secondary: 'Calculate my runway',
    stats: [
      { n: '< 2min', label: 'for a student to check in'      },
      { n: '4',      label: 'languages supported'             },
      { n: '1',      label: 'dashboard for the whole season'  },
    ],
    alert_label: 'Attention',
    alert_band:  '2 packages expiring this week · 1 active medical alert',
    metrics: [
      { label: 'Runway',   value: '4.7',    sub: 'months'  },
      { label: 'Revenue',  value: '$ 3.6k', sub: 'season'  },
      { label: 'Alerts',   value: '3',      sub: 'active'  },
      { label: 'Profit',   value: '$ 2.2k', sub: 'net'     },
    ],
    problem_eyebrow: 'The problem',
    problem_h2:      'Most school software tracks lessons.',
    problem_accent:  'Pico Base tracks whether you\'ll make it through the off-season.',
    problem_body:    "Most school software helps you record what happened. Pico Base helps you understand whether this season generated enough profit to get you safely through the off-season.",
    before_after: [
      { label: 'WhatsApp to communicate lessons',      before: true  },
      { label: 'Excel to calculate commissions',       before: true  },
      { label: 'Paper waivers',                        before: true  },
      { label: 'Digital check-in in 2 minutes',        before: false },
      { label: 'Commissions calculated automatically', before: false },
      { label: 'Off-season runway in real time',       before: false },
    ],
    calc_eyebrow: 'Free planning tool',
    calc_h2:      'Will this season be enough?',
    calc_body:    'Most seasonal school owners know revenue. Few know how long that revenue will last. Adjust the numbers below and see how many months your season can fund the off-season.',
    calc_link:    'Open full runway calculator →',
    runway_label: 'Off-Season Runway',
    runway_sub:   'months funded',
    profit_label: 'Season profit',
    burn_label:   'Monthly operating costs',
    how_eyebrow:  'How it works',
    how_h2:       'From student arrival to season planning.',
    steps: [
      { n: '01', title: 'Student checks in',     body: 'Scans the QR code, fills in details in under 2 minutes, signs the digital waiver. Works in 4 languages.' },
      { n: '02', title: 'Owner confirms lesson', body: 'Sees the pending student in Base Camp, confirms duration and price. Commission calculated automatically.' },
      { n: '03', title: 'Dashboard updates',     body: 'Revenue, commissions, and Off-Season Runway updated in real time. Close the month and export instructor payroll.' },
    ],
    for_eyebrow: 'Built for',
    for_h2:      'Any seasonal sports school',
    sports: [
      { emoji: '🪁',  label: 'Kitesurfing'  },
      { emoji: '🌊',  label: 'Wingfoil'     },
      { emoji: '🏄',  label: 'Windsurfing'  },
      { emoji: '⛷️', label: 'Skiing'       },
      { emoji: '🏂',  label: 'Snowboarding' },
      { emoji: '🏄‍♂️', label: 'Surfing'    },
    ],
    cta_h2:  'How soon does your season start?',
    cta_sub: 'We set up the full school in one week. You start using it on the first day of the season.',
    cta_demo: 'Book a demo →',
    cta_calc: 'Calculate my runway',
    footer_tag:   'The operating system for seasonal sports schools.',
    footer_calc:  'Calculator',
    footer_demo:  'Demo',
    footer_enter: 'Sign in',
  },
}

type Lang = 'pt' | 'en'

// ─── embedded mini-calculator ───────────────────────────────────────────────
function RunwayCalc({ t, lang }: { t: typeof CONTENT.pt; lang: Lang }) {
  const [profit, setProfit] = useState(28000)
  const [burn,   setBurn]   = useState(6000)

  const runway   = burn > 0 ? profit / burn : 0
  const barPct   = Math.min(100, (runway / 12) * 100)
  const verdict = runway >= 6
    ? {
        label: lang === 'pt' ? 'Sustentável' : 'Sustainable',
        sub: lang === 'pt'
          ? 'Sua temporada gera lucro suficiente para atravessar a baixa temporada com segurança.'
          : 'Your season generates enough profit to comfortably support the off-season.',
      }
    : runway >= 3
    ? {
        label: lang === 'pt' ? 'Requer atenção' : 'Needs attention',
        sub: lang === 'pt'
          ? 'A escola possui alguma margem de segurança, mas uma temporada mais fraca ou custos inesperados podem pressionar o caixa.'
          : 'The school has some runway, but a weaker season or unexpected costs could create pressure during the off-season.',
      }
    : runway > 0
    ? {
        label: lang === 'pt' ? 'Em risco' : 'At risk',
        sub: lang === 'pt'
          ? 'A temporada atual não gera lucro suficiente para sustentar a escola durante toda a baixa temporada.'
          : 'The current season does not generate enough profit to safely fund the off-season.',
      }
    : {
        label: '—',
        sub: lang === 'pt'
          ? 'Informe o lucro da temporada e os custos mensais para calcular sua autonomia.'
          : 'Enter your season profit and monthly costs to calculate your runway.',
      }
  const barColor = runway >= 6 ? C.teal : runway >= 3 ? C.amber : C.signal
  const targetMonths = 6
  const gap = runway >= targetMonths ? 0 : Math.round((targetMonths * burn) - profit)
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + Math.floor(runway))
  const runwayUntil = futureDate.toLocaleString(
    lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long' }
  )

  function fmt(n: number) {
    return new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', {
      style: 'currency', currency: lang === 'pt' ? 'BRL' : 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n)
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      borderRadius: '16px', border: `0.5px solid ${C.powderBorder}`,
      overflow: 'hidden', width: '100%',
    }}>
      {/* left — result */}
      <div style={{
        background: '#1B4B5A', padding: '28px 24px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          fontSize: '9px', fontWeight: '500',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)', marginBottom: '12px',
        }}>
          {t.runway_label}
        </div>
        <div style={{
          fontSize: '64px', fontWeight: '700', color: '#fff',
          lineHeight: '1', fontVariantNumeric: 'tabular-nums', marginBottom: '4px',
        }}>
          {runway > 0 ? runway.toFixed(1) : '—'}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>
          {t.runway_sub}
        </div>
        <div style={{
          height: '4px', background: 'rgba(255,255,255,0.1)',
          borderRadius: '99px', overflow: 'hidden', marginBottom: '4px',
        }}>
          <div style={{
            height: '100%', width: `${barPct}%`, background: barColor,
            borderRadius: '99px', transition: 'width 0.35s, background 0.3s',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginBottom: '24px',
        }}>
          <span>0</span><span>6mo</span><span>12mo</span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: barColor, marginBottom: '8px' }}>
          {verdict.label}
        </div>
        {runway > 0 && (
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', margin: '0 0 10px' }}>
            {lang === 'pt'
              ? <>Ao lucro atual, a escola pode operar até <strong style={{ color: '#fff' }}>{runwayUntil}</strong>.</>
              : <>At your current profit, the school can operate until <strong style={{ color: '#fff' }}>{runwayUntil}</strong>.</>
            }
          </p>
        )}
        {gap > 0 && (
          <p style={{ fontSize: '12px', color: '#D4A017', lineHeight: '1.6', margin: '0' }}>
            {lang === 'pt'
              ? <>Você precisa de mais <strong>{fmt(gap)}</strong> de lucro para atingir <strong>{targetMonths} meses</strong>.</>
              : <>You need <strong>{fmt(gap)}</strong> more profit to reach <strong>{targetMonths} months</strong>.</>
            }
          </p>
        )}
        {runway === 0 && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6', margin: '0' }}>
            {lang === 'pt'
              ? 'Ajuste os controles para ver sua reserva.'
              : 'Adjust the sliders to see your runway.'
            }
          </p>
        )}
      </div>

      {/* right — inputs */}
      <div style={{
        background: C.white, padding: '28px 24px',
        borderLeft: `0.5px solid ${C.powderBorder}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: '9px', fontWeight: '500', letterSpacing: '0.14em',
            textTransform: 'uppercase', color: C.fog, marginBottom: '20px',
          }}>
            {lang === 'pt' ? 'Seus números' : 'Your numbers'}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
              <label style={{ fontSize: '11px', fontWeight: '500', color: C.mist }}>
                {t.profit_label}
              </label>
              <span style={{ fontSize: '13px', fontWeight: '600', color: C.slate, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(profit)}
              </span>
            </div>
            <input type="range" min={0} max={200000} step={1000} value={profit}
              onChange={e => setProfit(Number(e.target.value))}
              style={{ width: '100%', accentColor: C.teal, cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
              <label style={{ fontSize: '11px', fontWeight: '500', color: C.mist }}>
                {t.burn_label}
              </label>
              <span style={{ fontSize: '13px', fontWeight: '600', color: C.slate, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(burn)}
              </span>
            </div>
            <input type="range" min={500} max={50000} step={500} value={burn}
              onChange={e => setBurn(Number(e.target.value))}
              style={{ width: '100%', accentColor: C.signal, cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{
          padding: '11px 14px', background: C.powder,
          borderRadius: '10px', fontSize: '12px', color: C.mist, lineHeight: '1.5',
        }}>
          {lang === 'pt'
            ? 'Lucro da temporada ÷ custos mensais = meses de reserva'
            : 'Season profit ÷ monthly costs = months of runway'
          }
        </div>
      </div>
    </div>
  )
}

// ─── page ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [lang, setLang] = useState<Lang>('pt')
  const t = CONTENT[lang]

  const metricCards = [
    { bg: C.ocean,      color: C.white,      sub: 'rgba(255,255,255,0.4)' },
    { bg: C.powder,     color: C.slate,      sub: C.fog                   },
    { bg: C.signalLight,color: C.signal,     sub: C.signalDark            },
    { bg: C.tealLight,  color: C.tealDark,   sub: C.tealDark              },
  ]

  return (
    <div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)',
        borderBottom: `0.5px solid ${C.powderBorder}`,
        height: '56px', display: 'flex', alignItems: 'center',
        padding: '0 40px', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          fontSize: '16px', fontWeight: '600',
          color: C.slate, textDecoration: 'none', letterSpacing: '0.01em',
        }}>
          Pico Base
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link href="/calculadora" style={{
            fontSize: '13px', color: C.fog,
            textDecoration: 'none', padding: '6px 14px',
          }}>
            {t.nav_calc}
          </Link>

          <div style={{
            display: 'flex', gap: '2px', background: C.powder,
            borderRadius: '8px', padding: '2px', marginRight: '4px',
          }}>
            {(['pt', 'en'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '4px 10px', borderRadius: '6px',
                fontSize: '12px', fontWeight: '500',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-geist-sans, system-ui)',
                background: lang === l ? C.white : 'transparent',
                color: lang === l ? C.slate : C.fog,
                boxShadow: lang === l ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <Link href="/owner" style={{
            fontSize: '13px', fontWeight: '500',
            color: C.white, background: C.slate,
            textDecoration: 'none', padding: '8px 18px', borderRadius: '8px',
          }}>
            {t.nav_enter}
          </Link>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: C.white, minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '120px 40px 0',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>

          <div style={{
            fontSize: '11px', fontWeight: '500', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: C.fog, marginBottom: '28px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ display: 'inline-block', width: '24px', height: '1px', background: C.fog }} />
            {t.eyebrow}
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 72px)',
            fontWeight: '700', color: '#1A1C22',
            lineHeight: '1.05', letterSpacing: '-0.03em',
            margin: '0 0 28px',
          }}>
            {lang === 'pt' ? (
              <>
                Uma temporada.<br />
                <span style={{ color: '#1B4B5A' }}>Doze meses</span><br />
                para sobreviver.
              </>
            ) : (
              <>
                One season.<br />
                <span style={{ color: '#1B4B5A' }}>Twelve months</span><br />
                to survive.
              </>
            )}
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)', color: C.mist,
            maxWidth: '520px', lineHeight: '1.7',
            margin: '0 0 36px', fontWeight: '300',
          }}>
            {t.sub}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '48px' }}>
            <Link href="/demo" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: C.signal, color: C.white,
              padding: '13px 26px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '500', textDecoration: 'none',
            }}>
              {t.cta_primary}
            </Link>
            <Link href="/calculadora" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: C.powder, color: C.slate,
              padding: '13px 26px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '500', textDecoration: 'none',
              border: `0.5px solid ${C.powderBorder}`,
            }}>
              {t.cta_secondary}
            </Link>
          </div>

          <div style={{
            paddingTop: '28px', borderTop: `0.5px solid ${C.powderBorder}`,
            display: 'flex', gap: '48px', flexWrap: 'wrap',
          }}>
            {t.stats.map((s, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '28px', fontWeight: '600', color: C.slate,
                  fontVariantNumeric: 'tabular-nums', marginBottom: '4px',
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: '12px', color: C.fog }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* amber alert band */}
        <div style={{
          background: C.amberBg, borderTop: `0.5px solid ${C.amberBorder}`,
          padding: '12px 40px', display: 'flex', alignItems: 'center',
          gap: '12px', marginTop: '48px',
        }}>
          <span style={{
            fontSize: '9px', fontWeight: '600', color: C.amberDark,
            letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0,
          }}>
            {t.alert_label}
          </span>
          <span style={{ width: '1px', height: '14px', background: C.amber, opacity: 0.5 }} />
          <span style={{ fontSize: '13px', color: C.amberDark }}>{t.alert_band}</span>
        </div>

        {/* 4-column metric strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {t.metrics.map((m, i) => {
            const card = metricCards[i]
            return (
              <div key={i} style={{
                background: card.bg, padding: '20px 28px',
                borderLeft: i > 0 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
              }}>
                <div style={{
                  fontSize: '9px', fontWeight: '500', letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: card.sub, marginBottom: '6px',
                }}>
                  {m.label}
                </div>
                <div style={{
                  fontSize: '28px', fontWeight: '700', color: card.color,
                  lineHeight: '1', fontVariantNumeric: 'tabular-nums', marginBottom: '4px',
                }}>
                  {m.value}
                </div>
                <div style={{ fontSize: '11px', color: card.sub }}>{m.sub}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
      <section style={{
        background: C.white, padding: '100px 40px',
        borderTop: `0.5px solid ${C.powderBorder}`,
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '72px', alignItems: 'center' }}>

            <div>
              <div style={{
                fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
                textTransform: 'uppercase', color: C.fog, marginBottom: '16px',
              }}>
                {t.problem_eyebrow}
              </div>
              <h2 style={{
                fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: '600', color: C.slate,
                lineHeight: '1.2', margin: '0 0 16px', letterSpacing: '-0.02em',
              }}>
                {t.problem_h2}
              </h2>
              <p style={{ fontSize: '17px', fontWeight: '600', color: C.ocean, margin: '0 0 20px' }}>
                {t.problem_accent}
              </p>
              <p style={{ fontSize: '14px', color: C.mist, lineHeight: '1.7', margin: '0' }}>
                {t.problem_body}
              </p>
            </div>

            <div style={{
              borderRadius: '14px', border: `0.5px solid ${C.powderBorder}`, overflow: 'hidden',
            }}>
              {t.before_after.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 20px',
                  borderBottom: i < t.before_after.length - 1 ? `0.5px solid ${C.powder}` : 'none',
                  background: item.before ? C.white : '#FAFAF8',
                }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: item.before ? C.signalLight : C.tealLight,
                    color: item.before ? C.signal : C.teal,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: '700',
                  }}>
                    {item.before ? '✕' : '✓'}
                  </span>
                  <span style={{
                    fontSize: '13px', fontWeight: item.before ? '400' : '500',
                    color: item.before ? '#C8C6C0' : C.slate,
                    textDecoration: item.before ? 'line-through' : 'none',
                  }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── CALCULATOR ───────────────────────────────────────────────────── */}
      <section style={{
        background: C.powder, padding: '100px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '72px', alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.fog, marginBottom: '16px',
            }}>
              {t.calc_eyebrow}
            </div>
            <h2 style={{
              fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: '600', color: C.slate,
              lineHeight: '1.2', margin: '0 0 16px', letterSpacing: '-0.02em',
            }}>
              {t.calc_h2}
            </h2>
            <p style={{ fontSize: '14px', color: C.mist, lineHeight: '1.7', margin: '0 0 24px' }}>
              {t.calc_body}
            </p>
            <Link href="/calculadora" style={{ fontSize: '13px', color: C.ocean, textDecoration: 'none' }}>
              {t.calc_link}
            </Link>
          </div>
          <RunwayCalc t={t} lang={lang} />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{
        background: C.white, padding: '100px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.fog, marginBottom: '14px',
          }}>
            {t.how_eyebrow}
          </div>
          <h2 style={{
            fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: '600', color: C.slate,
            lineHeight: '1.2', margin: '0 0 48px',
            letterSpacing: '-0.02em', maxWidth: '480px',
          }}>
            {t.how_h2}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {t.steps.map((step, i) => (
              <div key={i} style={{
                background: i === 1 ? C.ocean : C.powder,
                padding: '28px',
                borderRadius: i === 0 ? '14px 0 0 14px' : i === 2 ? '0 14px 14px 0' : '0',
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: '600', marginBottom: '14px',
                  fontFamily: 'var(--font-geist-mono, monospace)',
                  color: i === 1 ? 'rgba(255,255,255,0.35)' : C.teal,
                }}>
                  {step.n}
                </div>
                <div style={{
                  fontSize: '15px', fontWeight: '600', lineHeight: '1.3', marginBottom: '10px',
                  color: i === 1 ? C.white : C.slate,
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: '13px', lineHeight: '1.6',
                  color: i === 1 ? 'rgba(255,255,255,0.5)' : C.mist,
                }}>
                  {step.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section style={{
        background: C.powder, padding: '80px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.fog, marginBottom: '14px',
          }}>
            {t.for_eyebrow}
          </div>
          <h2 style={{
            fontSize: '28px', fontWeight: '600', color: C.slate,
            margin: '0 0 40px', letterSpacing: '-0.02em',
          }}>
            {t.for_h2}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {t.sports.map(sport => (
              <div key={sport.label} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: C.white, padding: '9px 16px',
                borderRadius: '99px', border: `0.5px solid ${C.powderBorder}`,
                fontSize: '13px', fontWeight: '500', color: C.slate,
              }}>
                <span style={{ fontSize: '16px' }}>{sport.emoji}</span>
                {sport.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ background: C.storm, padding: '100px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '700', color: C.white,
            lineHeight: '1.1', margin: '0 0 16px', letterSpacing: '-0.03em',
          }}>
            {t.cta_h2}
          </h2>
          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.4)',
            lineHeight: '1.6', margin: '0 0 36px',
          }}>
            {t.cta_sub}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/demo" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: C.signal, color: C.white,
              padding: '14px 32px', borderRadius: '10px',
              fontSize: '15px', fontWeight: '500', textDecoration: 'none',
            }}>
              {t.cta_demo}
            </Link>
            <Link href="/calculadora" style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              padding: '14px 32px', borderRadius: '10px',
              fontSize: '15px', fontWeight: '500', textDecoration: 'none',
              border: '0.5px solid rgba(255,255,255,0.12)',
            }}>
              {t.cta_calc}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        background: C.slate, padding: '28px 40px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '16px',
      }}>
        <span style={{ fontWeight: '600', color: C.white, fontSize: '14px' }}>Pico Base</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          {t.footer_tag}
        </span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {[
            { href: '/calculadora', label: t.footer_calc  },
            { href: '/demo',        label: t.footer_demo  },
            { href: '/owner',       label: t.footer_enter },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
            }}>
              {link.label}
            </Link>
          ))}
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}>
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>

    </div>
  )
}
