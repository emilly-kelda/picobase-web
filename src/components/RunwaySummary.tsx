'use client'

import { useState } from 'react'

type Props = {
  runwayMonths: number
  seasonRevenue: number
  commissions: number
  netProfit: number
  monthlyBurn: number
  gapToTarget: number
  lang: string
  projectedRunway?: number
  daysLeft?: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

/** Purely static — the interactive slider version (where an owner can play
 *  with hypothetical numbers) lives in /owner/costs now, under "Simulador de
 *  Cenários". This card shows only what's actually true today: real season
 *  profit over real logged operational_costs. Also absorbs what used to be
 *  a separate "Reserva de Baixa Temporada" card (revenue/commissions/profit
 *  breakdown) — same numbers, so keeping both was the redundant part, not
 *  the breakdown itself. */
export default function RunwaySummary({
  runwayMonths, seasonRevenue, commissions, netProfit, monthlyBurn,
  gapToTarget, lang, projectedRunway, daysLeft,
}: Props) {
  const [isOpen, setIsOpen] = useState(true)

  const safetyScore = runwayMonths >= 9
    ? { label: lang === 'pt' ? 'Protegido' : 'Protected', color: '#6DD5C0' }
    : runwayMonths >= 6
    ? { label: lang === 'pt' ? 'Saudável' : 'Healthy',    color: '#6DD5C0' }
    : runwayMonths >= 3
    ? { label: lang === 'pt' ? 'Vulnerável' : 'Vulnerable', color: '#F0C674' }
    : runwayMonths > 0
    ? { label: lang === 'pt' ? 'Crítico' : 'Critical',    color: '#E88C7D' }
    : { label: '—', color: 'rgba(255,255,255,0.4)' }

  return (
    <div style={{ background: 'var(--ocean-deep)', borderRadius: '16px', overflow: 'hidden' }}>
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '100%', padding: '20px 28px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--font-sans)', textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: '10px', fontWeight: '500',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.6)',
        }}>
          {lang === 'pt' ? 'Reserva de Baixa Temporada' : 'Off-Season Runway'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isOpen && (
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {runwayMonths > 0 ? `${runwayMonths.toFixed(1)}mo` : '—'}
            </span>
          )}
          <span style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '12px',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.15s',
          }}>
            ▾
          </span>
        </span>
      </button>

      {isOpen && (
        <div style={{ padding: '0 28px 28px' }}>
          <div style={{
            fontSize: '56px', fontWeight: '700',
            color: '#fff', lineHeight: '1',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em', marginBottom: '4px',
          }}>
            {runwayMonths > 0 ? runwayMonths.toFixed(1) : '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {lang === 'pt' ? 'meses cobertos' : 'months covered'}
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: '99px',
              fontSize: '11px', fontWeight: '600',
              background: 'rgba(255,255,255,0.1)', color: safetyScore.color,
            }}>
              {safetyScore.label}
            </span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '18px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                {lang === 'pt' ? 'Receita da temporada' : 'Season revenue'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(seasonRevenue)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                {lang === 'pt' ? 'Comissões pagas' : 'Commissions paid'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(220,100,100,0.8)', fontVariantNumeric: 'tabular-nums' }}>
                − {fmt(commissions)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
                {lang === 'pt' ? 'Lucro líquido' : 'Net profit'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(netProfit)}
              </span>
            </div>
            {monthlyBurn > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                  {lang === 'pt' ? 'Custo mensal' : 'Monthly burn'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(monthlyBurn)}
                </span>
              </div>
            )}
          </div>

          {runwayMonths < 6 && gapToTarget > 0 && (
            <div style={{
              marginTop: '16px', padding: '10px 14px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '8px',
              fontSize: '12px', color: 'var(--warning)',
              lineHeight: '1.5',
            }}>
              {lang === 'pt'
                ? `Faltam ${fmt(gapToTarget)} para 6 meses`
                : `${fmt(gapToTarget)} short of 6 months`}
            </div>
          )}

          {projectedRunway !== undefined && daysLeft !== undefined && daysLeft > 0 && (
            <div style={{
              marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6',
            }}>
              {lang === 'pt'
                ? `Projeção: ${projectedRunway.toFixed(1)} meses ao fim da temporada · ${daysLeft} dias restantes`
                : `Projection: ${projectedRunway.toFixed(1)} months at season end · ${daysLeft} days left`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
