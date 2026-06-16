'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

// ─── palette ───────────────────────────────────────────────────────────────
const C = {
  signal:       '#E8471A',
  signalLight:  '#FDF0EC',
  signalDark:   '#B83010',
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
  dark:         '#0D0F12',
}

// ─── content ───────────────────────────────────────────────────────────────
const CONTENT = {
  pt: {
    nav_calc:    'Calculadora',
    nav_enter:   'Entrar →',

    hero_eyebrow: 'Sistema operacional · escolas sazonais de esportes',
    hero_h1a:    'Uma temporada.',
    hero_h1b:    'Doze meses',
    hero_h1c:    'para sobreviver.',
    hero_sub:    'Do registro das aulas ao pagamento dos instrutores — e a resposta que todo dono de escola sazonal precisa: esta temporada será suficiente para atravessar a baixa temporada?',
    hero_cta1:   'Agendar demonstração →',
    hero_cta2:   'Calcular minha reserva',

    ticker: [
      '6 meses de receita',
      '12 meses de despesa',
      'Comissões calculadas no Excel',
      'Waivers em papel',
      'Instrutores pagos no olho',
      'Nenhum número confiável',
      'Temporada encerrada — e agora?',
      'Check-in em papel',
      'Planilha desatualizada',
      'Caixa no negativo em março',
    ],

    calc_eyebrow: 'Calculadora gratuita',
    calc_h2:     'Esta temporada vai ser suficiente?',
    calc_sub:    'A maioria dos donos de escola sazonal sabe a receita. Poucos sabem por quanto tempo ela vai durar. Ajuste os números abaixo e veja.',
    calc_link:   'Abrir calculadora completa →',
    runway_label: 'Reserva de Baixa Temporada',
    runway_sub:  'meses financiados',
    profit_label: 'Lucro da temporada',
    burn_label:  'Custos mensais',

    q_eyebrow:   'As perguntas que todo dono faz',
    q_h2:        'Todo dono de escola sazonal carrega as mesmas dúvidas.',
    questions: [
      { n: '01', q: 'Esta temporada vai durar?',      a: 'Veja em tempo real quantos meses de baixa temporada esta temporada vai financiar.' },
      { n: '02', q: 'Quanto devo para minha equipe?', a: 'Comissões calculadas automaticamente a cada aula confirmada. Sem planilha, sem erro.' },
      { n: '03', q: 'Onde estão os waivers?',         a: 'Check-in digital com waiver assinado, arquivado e pesquisável.' },
      { n: '04', q: 'A escola sobrevive o inverno?',  a: 'O painel de reserva mostra exatamente até quando o caixa aguenta.' },
    ],

    without_eyebrow: 'O que acontece sem visibilidade',
    without_h2:  'Cada um desses cenários é evitável.',
    without_items: [
      { icon: '📋', title: 'Waiver perdido',             body: 'Um aluno se machuca. Você não encontra o waiver assinado. A escola responde pelos prejuízos.' },
      { icon: '💸', title: 'Comissão errada',            body: 'Você paga o instrutor na intuição. Em um mês fraco, você paga mais do que deveria — e nunca vai saber.' },
      { icon: '📉', title: 'Temporada boa, caixa zerado', body: 'Você fechou uma boa temporada. Dois meses depois, o caixa acabou. Ninguém te avisou.' },
    ],

    dash_eyebrow: 'Reserva em tempo real',
    dash_h2:     'A resposta no centro do painel.',
    dash_sub:    'Não enterrada num relatório. Não calculada depois. Atualizada automaticamente a cada aula confirmada.',
    dash_runway: 'meses de reserva',
    dash_status: 'Saudável',
    dash_sessions: 'Aulas esta semana',
    dash_revenue:  'Receita da temporada',
    dash_updated:  'Atualizado agora',

    tabs_eyebrow: 'Como o Pico Base responde',
    tabs_h2:     'Da chegada do aluno à reserva de baixa temporada.',
    tabs:        ['Check-in', 'Aulas', 'Pagamentos', 'Reserva'],
    tabs_content: [
      { title: 'Check-in em 2 minutos',    body: 'Aluno escaneia o QR code, preenche os dados e assina o waiver digital. Funciona offline. Funciona em 4 idiomas. Nenhum papel.' },
      { title: 'Confirme e calcule',        body: 'Veja os alunos pendentes no painel. Confirme duração, valor e instrutor. A comissão é calculada automaticamente.' },
      { title: 'Feche o mês em minutos',   body: 'Cada aula atualiza os pagamentos automaticamente. No fechamento, exporte PIX ou Wise com um clique.' },
      { title: 'Reserva em tempo real',    body: 'Cada aula confirmada atualiza a Reserva de Baixa Temporada. Você sabe em tempo real se esta temporada vai ser suficiente.' },
    ],

    cmp_eyebrow: 'Por que não uma planilha?',
    cmp_h2:      'Pico Base foi feito para responder a pergunta que planilha não responde.',
    cmp_headers: ['', 'Pico Base', 'Planilha', 'SaaS genérico'],
    cmp_rows: [
      ['Check-in digital',           '✓', '✗', 'Parcial'],
      ['Waiver digital',              '✓', '✗', '✗'],
      ['Comissões automáticas',       '✓', 'Manual', '✗'],
      ['Reserva de baixa temporada',  '✓', 'Manual', '✗'],
      ['Pagamentos PIX / Wise',        '✓', '✗', '✗'],
      ['Feito para escola sazonal',   '✓', '✗', '✗'],
    ],

    who_eyebrow: 'Para quem é',
    who_h2:      'Escolas sazonais de esportes.',
    who_for_h:   'Para você se:',
    who_not_h:   'Não é para você se:',
    who_for: [
      'Você tem uma escola de kitesurf, windsurf, wingfoil, surf, ski ou snowboard',
      'Sua receita vem em 4–7 meses e você precisa sobreviver em 12',
      'Você quer saber em tempo real se a temporada vai ser suficiente',
      'Você tem instrutores com comissões diferentes',
      'Você precisa de waivers digitais e check-in rápido',
    ],
    who_not: [
      'Academia aberta o ano inteiro',
      'Escola de natação ou ioga com receita linear',
      'Qualquer negócio sem pico sazonal claro',
    ],

    cta_h2:         'Veja se esta temporada vai ser suficiente.',
    cta_sub:        'Configuramos a escola completa em uma semana. Você começa no primeiro dia da temporada.',
    cta_demo:       'Agendar demonstração →',
    cta_calc:       'Calcular minha reserva',

    footer_tag:   'O sistema operacional para escolas sazonais de esportes.',
    footer_calc:  'Calculadora',
    footer_demo:  'Demonstração',
    footer_enter: 'Entrar',
  },
  en: {
    nav_calc:    'Calculator',
    nav_enter:   'Sign in →',

    hero_eyebrow: 'Operating system · seasonal sports schools',
    hero_h1a:    'One season.',
    hero_h1b:    'Twelve months',
    hero_h1c:    'to survive.',
    hero_sub:    'From check-in to instructor payroll — and the one number that tells you whether this season will carry your school through the off-season.',
    hero_cta1:   'Book a demo →',
    hero_cta2:   'Calculate my runway',

    ticker: [
      '6 months of revenue',
      '12 months of expenses',
      'Commissions in a spreadsheet',
      'Paper waivers',
      'Instructors paid by gut feel',
      'No reliable numbers',
      'Season over — what now?',
      'Paper check-in',
      'Outdated spreadsheet',
      'Cash negative by March',
    ],

    calc_eyebrow: 'Free planning tool',
    calc_h2:     'Will this season be enough?',
    calc_sub:    'Most seasonal school owners know revenue. Few know how long it will last. Adjust the numbers below and see.',
    calc_link:   'Open full runway calculator →',
    runway_label: 'Off-Season Runway',
    runway_sub:  'months funded',
    profit_label: 'Season profit',
    burn_label:  'Monthly costs',

    q_eyebrow:   'Questions every owner asks',
    q_h2:        'Every seasonal school owner carries the same questions.',
    questions: [
      { n: '01', q: 'Will this season last?',       a: 'See in real time how many off-season months this season will fund.' },
      { n: '02', q: 'What do I owe my team?',       a: 'Commissions calculated automatically with every confirmed lesson. No spreadsheet, no errors.' },
      { n: '03', q: 'Where are the waivers?',       a: 'Digital check-in with signed waiver, archived and searchable.' },
      { n: '04', q: 'Can the school survive winter?', a: 'The runway dashboard shows exactly how long current funds will last.' },
    ],

    without_eyebrow: 'What happens without visibility',
    without_h2:  'Each of these scenarios is preventable.',
    without_items: [
      { icon: '📋', title: 'Lost waiver',          body: "A student gets hurt. You can't find the signed waiver. The school takes the liability." },
      { icon: '💸', title: 'Wrong commission',      body: "You pay the instructor by gut feel. In a slow month, you pay more than you should — and never know it." },
      { icon: '📉', title: 'Good season, zero cash', body: "You closed a great season. Two months later, the money's gone. Nobody warned you." },
    ],

    dash_eyebrow: 'Real-time runway',
    dash_h2:     'The answer at the center of the dashboard.',
    dash_sub:    'Not buried in a report. Not calculated after the fact. Updated automatically with every confirmed lesson.',
    dash_runway: 'months of runway',
    dash_status: 'Healthy',
    dash_sessions: 'Lessons this week',
    dash_revenue:  'Season revenue',
    dash_updated:  'Updated now',

    tabs_eyebrow: 'How Pico Base answers',
    tabs_h2:     'From student arrival to off-season runway.',
    tabs:        ['Check-in', 'Lessons', 'Payouts', 'Runway'],
    tabs_content: [
      { title: 'Check-in in 2 minutes',    body: 'Student scans the QR code, fills in details, signs the digital waiver. Works offline. Works in 4 languages. No paper.' },
      { title: 'Confirm and calculate',    body: 'See pending students in the dashboard. Confirm duration, price, and instructor. Commission calculated automatically.' },
      { title: 'Close the month in minutes', body: 'Every lesson automatically updates payouts. At month close, export PIX or Wise in one click.' },
      { title: 'Real-time runway',         body: 'Every confirmed lesson updates the Off-Season Runway. You know in real time whether this season will be enough.' },
    ],

    cmp_eyebrow: 'Why not a spreadsheet?',
    cmp_h2:      "Pico Base was built to answer the question a spreadsheet can't.",
    cmp_headers: ['', 'Pico Base', 'Spreadsheet', 'Generic SaaS'],
    cmp_rows: [
      ['Digital check-in',          '✓', '✗', 'Partial'],
      ['Digital waiver',             '✓', '✗', '✗'],
      ['Automatic commissions',      '✓', 'Manual', '✗'],
      ['Off-season runway',          '✓', 'Manual', '✗'],
      ['PIX / Wise payouts',         '✓', '✗', '✗'],
      ['Built for seasonal schools', '✓', '✗', '✗'],
    ],

    who_eyebrow: "Who it's for",
    who_h2:      'Seasonal sports schools.',
    who_for_h:   'For you if:',
    who_not_h:   'Not for you if:',
    who_for: [
      'You run a kitesurf, windsurf, wingfoil, surf, ski, or snowboard school',
      'Your revenue comes in 4–7 months and you need to survive 12',
      'You want to know in real time if the season will be enough',
      'You have instructors on different commission rates',
      'You need digital waivers and fast check-in',
    ],
    who_not: [
      'Year-round gyms or fitness studios',
      'Swim schools or yoga studios with linear revenue',
      'Any business without a clear seasonal peak',
    ],

    cta_h2:         'See if this season will be enough.',
    cta_sub:        'We set up the full school in one week. You start on the first day of the season.',
    cta_demo:       'Book a demo →',
    cta_calc:       'Calculate my runway',

    footer_tag:   'The operating system for seasonal sports schools.',
    footer_calc:  'Calculator',
    footer_demo:  'Demo',
    footer_enter: 'Sign in',
  },
}

type Lang = 'pt' | 'en'

// ─── embedded runway calculator ─────────────────────────────────────────────
function RunwayCalc({ t, lang }: { t: typeof CONTENT.pt; lang: Lang }) {
  const [profit, setProfit] = useState(28000)
  const [burn,   setBurn]   = useState(6000)

  const runway  = burn > 0 ? profit / burn : 0
  const barPct  = Math.min(100, (runway / 12) * 100)
  const safetyScore =
    runway >= 9 ? { label: lang === 'pt' ? 'Protegido'   : 'Protected',   color: '#007868', bg: '#E0F8F5' }
    : runway >= 6 ? { label: lang === 'pt' ? 'Saudável'    : 'Healthy',     color: '#00A896', bg: '#E0F8F5' }
    : runway >= 3 ? { label: lang === 'pt' ? 'Vulnerável'  : 'Vulnerable',  color: '#8A5E00', bg: '#FFF8E8' }
    : runway > 0  ? { label: lang === 'pt' ? 'Crítico'     : 'Critical',    color: '#B83010', bg: '#FDF0EC' }
    :               { label: '—',                                             color: '#6A6C78', bg: 'rgba(255,255,255,0.08)' }

  const gap = runway >= 12 ? 0 : Math.round((12 * burn) - profit)
  const avgLessonProfit = 250
  const lessonsNeeded   = gap > 0 ? Math.ceil(gap / avgLessonProfit) : 0
  const survivalDate = (() => {
    if (runway <= 0) return null
    const d = new Date()
    d.setMonth(d.getMonth() + Math.floor(runway))
    return d.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' })
  })()

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
          display: 'inline-flex', alignSelf: 'flex-start',
          padding: '4px 12px', borderRadius: '99px',
          background: runway > 0 ? safetyScore.bg : 'rgba(255,255,255,0.08)',
          marginBottom: '16px',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: '600',
            color: runway > 0 ? safetyScore.color : 'rgba(255,255,255,0.3)',
            letterSpacing: '0.04em',
          }}>
            {safetyScore.label}
          </span>
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
            height: '100%', width: `${barPct}%`, background: safetyScore.color,
            borderRadius: '99px', transition: 'width 0.35s, background 0.3s',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginBottom: '20px',
        }}>
          <span>0</span><span>6mo</span><span style={{ color: '#00A896' }}>12mo ✓</span>
        </div>
        {survivalDate && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5', margin: '0 0 12px' }}>
            {lang === 'pt'
              ? <>Escola operacional até <strong style={{ color: '#fff' }}>{survivalDate}</strong>.</>
              : <>School operational until <strong style={{ color: '#fff' }}>{survivalDate}</strong>.</>
            }
          </p>
        )}
        {gap > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.07)', borderRadius: '10px',
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: '11px', color: '#D4A017', fontWeight: '600', marginBottom: '4px' }}>
              {lang === 'pt' ? `Faltam ${fmt(gap)}` : `Gap: ${fmt(gap)}`}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
              {lang === 'pt'
                ? `≈ ${lessonsNeeded} aulas extras para atingir 12 meses`
                : `≈ ${lessonsNeeded} extra lessons to reach 12 months`
              }
            </div>
          </div>
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
  const [lang, setLang]       = useState<Lang>('pt')
  const [activeTab, setActiveTab] = useState(0)
  const t = CONTENT[lang]
  const tickerItems = [...t.ticker, ...t.ticker]

  return (
    <div>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)',
        borderBottom: `0.5px solid ${C.powderBorder}`,
        height: '56px', display: 'flex', alignItems: 'center',
        padding: '0 40px', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo size={20} variant="full" />
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
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '120px 40px 80px',
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
          <div style={{
            fontSize: '11px', fontWeight: '500', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: C.fog,
            marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ display: 'inline-block', width: '24px', height: '1px', background: C.fog }} />
            {t.hero_eyebrow}
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 72px)',
            fontWeight: '700', color: C.slate,
            lineHeight: '1.05', letterSpacing: '-0.03em',
            margin: '0 0 28px',
          }}>
            {t.hero_h1a}<br />
            <span style={{ color: C.teal }}>{(t as typeof CONTENT.pt & { hero_h1c: string }).hero_h1b}</span><br />
            {(t as typeof CONTENT.pt & { hero_h1c: string }).hero_h1c}
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            color: C.mist,
            maxWidth: '520px', lineHeight: '1.7',
            margin: '0 0 36px', fontWeight: '300',
          }}>
            {t.hero_sub}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/demo" style={{
              display: 'inline-flex', alignItems: 'center',
              background: C.signal, color: C.white,
              padding: '13px 26px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '500', textDecoration: 'none',
            }}>
              {t.hero_cta1}
            </Link>
            <Link href="/calculadora" style={{
              display: 'inline-flex', alignItems: 'center',
              background: C.powder, color: C.slate,
              padding: '13px 26px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '500', textDecoration: 'none',
              border: `0.5px solid ${C.powderBorder}`,
            }}>
              {t.hero_cta2}
            </Link>
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <div style={{ background: C.slate, overflow: 'hidden', padding: '12px 0' }}>
        <div style={{
          display: 'flex',
          width: 'max-content',
          animation: 'ticker 28s linear infinite',
        }}>
          {tickerItems.map((item, i) => (
            <span key={i} style={{
              padding: '0 28px',
              fontSize: '12px', fontWeight: '500',
              color: 'rgba(255,255,255,0.85)',
              whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '28px',
            }}>
              {item}
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
            </span>
          ))}
        </div>
      </div>

      {/* ── CALCULATOR ───────────────────────────────────────────────────── */}
      <section style={{
        background: C.powder, padding: '100px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{
          maxWidth: '960px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1.4fr',
          gap: '64px', alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.fog, marginBottom: '16px',
            }}>
              {t.calc_eyebrow}
            </div>
            <h2 style={{
              fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: '700', color: C.slate,
              lineHeight: '1.1', margin: '0 0 16px', letterSpacing: '-0.03em',
            }}>
              {t.calc_h2}
            </h2>
            <p style={{ fontSize: '14px', color: C.mist, lineHeight: '1.7', margin: '0 0 24px' }}>
              {t.calc_sub}
            </p>
            <Link href="/calculadora" style={{ fontSize: '13px', color: C.teal, textDecoration: 'none' }}>
              {t.calc_link}
            </Link>
          </div>
          <RunwayCalc t={t} lang={lang} />
        </div>
      </section>

      {/* ── FOUR QUESTIONS ───────────────────────────────────────────────── */}
      <section style={{
        background: C.white, padding: '100px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ marginBottom: '56px' }}>
            <div style={{
              fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.fog, marginBottom: '14px',
            }}>
              {t.q_eyebrow}
            </div>
            <h2 style={{
              fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: '700', color: C.slate,
              lineHeight: '1.2', margin: '0', letterSpacing: '-0.03em', maxWidth: '480px',
            }}>
              {t.q_h2}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
            {t.questions.map((q, i) => (
              <div key={i} style={{
                padding: '32px 36px',
                background: i % 2 === 0 ? C.powder : C.white,
                borderRadius:
                  i === 0 ? '14px 0 0 0' :
                  i === 1 ? '0 14px 0 0' :
                  i === 2 ? '0 0 0 14px' : '0 0 14px 0',
                border: `0.5px solid ${C.powderBorder}`,
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: '600',
                  color: C.teal, marginBottom: '12px',
                  fontFamily: 'var(--font-geist-mono, monospace)',
                }}>
                  {q.n}
                </div>
                <div style={{
                  fontSize: '16px', fontWeight: '600', color: C.slate,
                  lineHeight: '1.3', marginBottom: '10px', letterSpacing: '-0.01em',
                }}>
                  {q.q}
                </div>
                <div style={{ fontSize: '13px', color: C.mist, lineHeight: '1.6' }}>
                  {q.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WITHOUT VISIBILITY ───────────────────────────────────────────── */}
      <section style={{
        background: C.storm, padding: '100px 40px',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ marginBottom: '56px' }}>
            <div style={{
              fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '14px',
            }}>
              {t.without_eyebrow}
            </div>
            <h2 style={{
              fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: '700', color: C.white,
              lineHeight: '1.2', margin: '0', letterSpacing: '-0.03em',
            }}>
              {t.without_h2}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {t.without_items.map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderTop: `2px solid ${C.signal}`,
                borderRadius: '12px', padding: '28px 24px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '16px' }}>{item.icon}</div>
                <div style={{
                  fontSize: '15px', fontWeight: '600', color: C.white,
                  marginBottom: '10px', lineHeight: '1.3',
                }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DECISION DASHBOARD ───────────────────────────────────────────── */}
      <section style={{
        background: C.powder, padding: '100px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.4fr',
            gap: '72px', alignItems: 'center',
          }}>
            <div>
              <div style={{
                fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
                textTransform: 'uppercase', color: C.fog, marginBottom: '14px',
              }}>
                {t.dash_eyebrow}
              </div>
              <h2 style={{
                fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: '700', color: C.slate,
                lineHeight: '1.2', margin: '0 0 16px', letterSpacing: '-0.03em',
              }}>
                {t.dash_h2}
              </h2>
              <p style={{ fontSize: '14px', color: C.mist, lineHeight: '1.7', margin: '0' }}>
                {t.dash_sub}
              </p>
            </div>

            {/* Dashboard mock */}
            <div style={{
              background: C.dark, borderRadius: '16px',
              overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.06)',
            }}>
              {/* top bar */}
              <div style={{
                padding: '12px 20px',
                borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['#FF5F57', '#FFBD2E', '#28C840'].map(color => (
                    <span key={color} style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Base Camp</span>
                <span style={{ width: '60px' }} />
              </div>

              {/* runway hero */}
              <div style={{ padding: '28px 24px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {t.dash_runway}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '52px', fontWeight: '700', color: C.white, lineHeight: '1', fontVariantNumeric: 'tabular-nums' }}>
                    6.2
                  </span>
                  <span style={{
                    padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
                    background: C.tealLight, color: C.tealDark,
                  }}>
                    {t.dash_status}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '52%', background: C.teal, borderRadius: '99px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.15)', marginTop: '4px' }}>
                  <span>0</span><span>6mo</span><span style={{ color: C.teal }}>12mo ✓</span>
                </div>
              </div>

              {/* stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                {[
                  { label: t.dash_sessions, value: '14' },
                  { label: t.dash_revenue,  value: lang === 'pt' ? 'R$ 38k' : '$ 38k' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: '18px 24px',
                    borderRight: i === 0 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: C.white, fontVariantNumeric: 'tabular-nums' }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* updated line */}
              <div style={{
                padding: '10px 24px',
                borderTop: '0.5px solid rgba(255,255,255,0.04)',
                fontSize: '10px', color: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.teal, display: 'inline-block' }} />
                {t.dash_updated}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: C.white, padding: '100px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.fog, marginBottom: '14px',
            }}>
              {t.tabs_eyebrow}
            </div>
            <h2 style={{
              fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: '700', color: C.slate,
              lineHeight: '1.2', margin: '0', letterSpacing: '-0.03em',
            }}>
              {t.tabs_h2}
            </h2>
          </div>

          {/* tab buttons */}
          <div style={{
            display: 'flex', gap: '4px',
            background: C.powder, borderRadius: '12px', padding: '4px',
            marginBottom: '40px', width: 'fit-content',
          }}>
            {t.tabs.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)} style={{
                padding: '8px 20px', borderRadius: '9px', border: 'none',
                fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                fontFamily: 'var(--font-geist-sans, system-ui)',
                background: activeTab === i ? C.white : 'transparent',
                color: activeTab === i ? C.slate : C.fog,
                boxShadow: activeTab === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                {tab}
              </button>
            ))}
          </div>

          {/* tab content */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '48px', alignItems: 'center',
          }}>
            <div>
              <h3 style={{
                fontSize: '22px', fontWeight: '700', color: C.slate,
                margin: '0 0 14px', letterSpacing: '-0.02em',
              }}>
                {t.tabs_content[activeTab].title}
              </h3>
              <p style={{ fontSize: '15px', color: C.mist, lineHeight: '1.7', margin: '0' }}>
                {t.tabs_content[activeTab].body}
              </p>
            </div>

            {/* Tab mock panels — rendered conditionally to avoid textTransform type issues */}
            <div>
              {activeTab === 0 && (
                <div style={{
                  background: C.powder, borderRadius: '14px', padding: '24px',
                  border: `0.5px solid ${C.powderBorder}`,
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.fog, marginBottom: '16px' }}>
                    {lang === 'pt' ? 'Check-in pendente' : 'Pending check-in'}
                  </div>
                  {[
                    { name: 'Leila Santos',  sport: 'Kitesurf', flag: '🇧🇷' },
                    { name: 'Tom Eriksson', sport: 'Wingfoil', flag: '🇸🇪' },
                  ].map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: C.white, borderRadius: '10px', padding: '12px 14px',
                      marginBottom: '8px', border: `0.5px solid ${C.powderBorder}`,
                    }}>
                      <span style={{ fontSize: '20px' }}>{s.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: C.slate }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: C.fog }}>{s.sport}</div>
                      </div>
                      <span style={{
                        padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: '600',
                        background: C.tealLight, color: C.tealDark,
                      }}>
                        ✓ Waiver
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 1 && (
                <div style={{
                  background: C.powder, borderRadius: '14px', padding: '24px',
                  border: `0.5px solid ${C.powderBorder}`,
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.fog, marginBottom: '16px' }}>
                    {lang === 'pt' ? 'Confirmar aula' : 'Confirm lesson'}
                  </div>
                  <div style={{ background: C.white, borderRadius: '10px', padding: '16px', border: `0.5px solid ${C.powderBorder}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: C.slate, marginBottom: '12px' }}>Leila Santos</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                      {[
                        { label: lang === 'pt' ? 'Duração' : 'Duration', value: '90 min' },
                        { label: lang === 'pt' ? 'Valor'   : 'Price',    value: lang === 'pt' ? 'R$ 350' : '$ 350' },
                        { label: lang === 'pt' ? 'Instrutor' : 'Instructor', value: 'Marco F.' },
                        { label: lang === 'pt' ? 'Comissão' : 'Commission',  value: '38% → R$ 133' },
                      ].map(field => (
                        <div key={field.label} style={{ background: C.powder, borderRadius: '8px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '9px', color: C.fog, marginBottom: '3px' }}>{field.label}</div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: C.slate }}>{field.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      background: C.signal, color: C.white, borderRadius: '8px',
                      padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '500',
                    }}>
                      {lang === 'pt' ? 'Confirmar aula →' : 'Confirm lesson →'}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div style={{
                  background: C.powder, borderRadius: '14px', padding: '24px',
                  border: `0.5px solid ${C.powderBorder}`,
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.fog, marginBottom: '16px' }}>
                    {lang === 'pt' ? 'Pagamentos · Junho 2026' : 'Payouts · June 2026'}
                  </div>
                  {[
                    { initials: 'MF', name: 'Marco Ferreira', detail: lang === 'pt' ? '6 aulas · 38%' : '6 lessons · 38%', amount: lang === 'pt' ? 'R$ 1.178' : '$ 1.178', status: lang === 'pt' ? 'Pendente' : 'Pending', statusBg: C.amberBg, statusColor: C.amberDark },
                    { initials: 'AK', name: 'Ana Köhler',     detail: lang === 'pt' ? '4 aulas · 35%' : '4 lessons · 35%', amount: lang === 'pt' ? 'R$ 840'  : '$ 840',   status: lang === 'pt' ? 'Aprovado' : 'Approved', statusBg: C.tealLight, statusColor: C.tealDark },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: C.white, borderRadius: '10px', padding: '12px 14px',
                      marginBottom: '8px', border: `0.5px solid ${C.powderBorder}`,
                    }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: C.tealLight, color: C.tealDark,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '700', flexShrink: 0,
                      }}>
                        {row.initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: C.slate }}>{row.name}</div>
                        <div style={{ fontSize: '11px', color: C.fog }}>{row.detail}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: C.slate, fontVariantNumeric: 'tabular-nums' }}>{row.amount}</div>
                        <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: '500', background: row.statusBg, color: row.statusColor }}>{row.status}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {[
                      lang === 'pt' ? '↓ PIX (BTG)' : '↓ PIX (BTG)',
                      lang === 'pt' ? '↓ Wise'      : '↓ Wise',
                    ].map(btn => (
                      <div key={btn} style={{
                        flex: 1, textAlign: 'center', padding: '8px',
                        borderRadius: '8px', border: `0.5px solid ${C.powderBorder}`,
                        fontSize: '11px', fontWeight: '500', color: C.slate,
                        background: C.white, cursor: 'pointer',
                      }}>
                        {btn}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div style={{
                  background: '#1B4B5A', borderRadius: '14px', padding: '28px 24px',
                }}>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {t.runway_label}
                  </div>
                  <div style={{ fontSize: '56px', fontWeight: '700', color: C.white, lineHeight: '1', fontVariantNumeric: 'tabular-nums', marginBottom: '4px' }}>
                    6.2
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>
                    {t.runway_sub}
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginBottom: '4px' }}>
                    <div style={{ height: '100%', width: '52%', background: C.teal, borderRadius: '99px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginBottom: '20px' }}>
                    <span>0</span><span>6mo</span><span style={{ color: C.teal }}>12mo ✓</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: C.amber, fontWeight: '600', marginBottom: '4px' }}>
                      {lang === 'pt' ? 'Faltam R$ 35.000' : 'Gap: $ 35.000'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
                      {lang === 'pt' ? '≈ 140 aulas para atingir 12 meses' : '≈ 140 lessons to reach 12 months'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section style={{
        background: C.powder, padding: '100px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.fog, marginBottom: '14px',
            }}>
              {t.cmp_eyebrow}
            </div>
            <h2 style={{
              fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: '700', color: C.slate,
              lineHeight: '1.2', margin: '0', letterSpacing: '-0.03em',
            }}>
              {t.cmp_h2}
            </h2>
          </div>

          <div style={{ borderRadius: '14px', overflow: 'hidden', border: `0.5px solid ${C.powderBorder}` }}>
            {/* header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
              background: C.slate, padding: '14px 20px',
            }}>
              {t.cmp_headers.map((h, i) => (
                <div key={i} style={{
                  fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em',
                  color: i === 1 ? C.teal : 'rgba(255,255,255,0.35)',
                  textAlign: i > 0 ? 'center' : 'left',
                }}>
                  {h}
                </div>
              ))}
            </div>
            {/* data rows */}
            {t.cmp_rows.map((row, ri) => (
              <div key={ri} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '13px 20px',
                background: ri % 2 === 0 ? C.white : '#FAFAF8',
                borderBottom: ri < t.cmp_rows.length - 1 ? `0.5px solid ${C.powderBorder}` : 'none',
              }}>
                {row.map((cell, ci) => (
                  <div key={ci} style={{
                    fontSize: ci === 0 ? '13px' : '14px',
                    fontWeight: ci === 1 ? '600' : '400',
                    color:
                      ci === 0 ? C.slate :
                      cell === '✓' && ci === 1 ? C.tealDark :
                      cell === '✗' ? '#C8C6C0' :
                      cell === 'Manual' || cell === 'Parcial' || cell === 'Partial' ? C.amberDark :
                      C.slate,
                    textAlign: ci > 0 ? 'center' : 'left',
                  }}>
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section style={{
        background: C.white, padding: '100px 40px',
        borderBottom: `0.5px solid ${C.powderBorder}`,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              fontSize: '10px', fontWeight: '500', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.fog, marginBottom: '14px',
            }}>
              {t.who_eyebrow}
            </div>
            <h2 style={{
              fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: '700', color: C.slate,
              lineHeight: '1.2', margin: '0', letterSpacing: '-0.03em',
            }}>
              {t.who_h2}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* For */}
            <div style={{
              border: `0.5px solid ${C.tealLight}`,
              borderRadius: '14px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 20px', background: C.tealLight,
                fontSize: '11px', fontWeight: '600', color: C.tealDark,
                letterSpacing: '0.08em',
              }}>
                {t.who_for_h}
              </div>
              <div style={{ padding: '8px 0' }}>
                {t.who_for.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 20px',
                    borderBottom: i < t.who_for.length - 1 ? `0.5px solid ${C.tealLight}` : 'none',
                  }}>
                    <span style={{ color: C.teal, fontWeight: '700', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: C.slate, lineHeight: '1.5' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Not for */}
            <div style={{
              border: `0.5px solid ${C.powderBorder}`,
              borderRadius: '14px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 20px', background: C.powder,
                fontSize: '11px', fontWeight: '600', color: C.mist,
                letterSpacing: '0.08em',
              }}>
                {t.who_not_h}
              </div>
              <div style={{ padding: '8px 0' }}>
                {t.who_not.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 20px',
                    borderBottom: i < t.who_not.length - 1 ? `0.5px solid ${C.powderBorder}` : 'none',
                  }}>
                    <span style={{ color: '#C8C6C0', fontWeight: '700', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✕</span>
                    <span style={{ fontSize: '13px', color: C.mist, lineHeight: '1.5' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        background: C.slate, padding: '28px 40px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontWeight: '600', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
          Pico Base
        </span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
          {t.footer_tag}
        </span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {[
            { href: '/calculadora', label: t.footer_calc  },
            { href: '/demo',        label: t.footer_demo  },
            { href: '/owner',       label: t.footer_enter },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none',
            }}>
              {link.label}
            </Link>
          ))}
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.12)' }}>
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>

    </div>
  )
}
