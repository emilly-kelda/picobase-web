'use client'

import { useState } from 'react'
import MaskableValue from './MaskableValue'

type Props = {
  runwayMonths: number
  seasonRevenue: number
  commissions: number
  netProfit: number
  // Informational only (see costs/page.tsx's own comment on this) — revenue
  // minus commissions minus one month of operational cost, NOT fed into
  // runwayMonths/gapToTarget (those stay netProfit ÷ monthlyBurn, since
  // netProfit already having costs subtracted would double-count monthlyBurn
  // as both a subtraction and the divisor).
  netAfterOperationalCosts?: number
  monthlyBurn: number
  gapToTarget: number
  projectedRunway?: number
  daysLeft?: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
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
  runwayMonths, seasonRevenue, commissions, netProfit, netAfterOperationalCosts, monthlyBurn,
  gapToTarget, projectedRunway, daysLeft,
}: Props) {
  const [isOpen, setIsOpen] = useState(true)

  // Zinc/muted palette, not the old dark-teal (--ocean-deep) + mint/amber/
  // coral trio — emerald-400 for goals met, matching the emerald-family
  // "success" tone used everywhere else in the app now.
  const safetyScore = runwayMonths >= 9
    ? { label: 'Protegido', color: '#34D399' }
    : runwayMonths >= 6
    ? { label: 'Saudável',  color: '#34D399' }
    : runwayMonths >= 3
    ? { label: 'Vulnerável', color: '#FBBF24' }
    : runwayMonths > 0
    ? { label: 'Crítico',   color: '#FB7185' }
    : { label: '—', color: 'rgba(255,255,255,0.4)' }

  return (
    <div style={{ background: '#18181B', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
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
          Reserva de Baixa Temporada
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
              meses cobertos
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
                Receita da temporada
              </span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                <MaskableValue>{fmt(seasonRevenue)}</MaskableValue>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                Comissões pagas
              </span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                <MaskableValue>{fmt(commissions)}</MaskableValue>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
                Lucro líquido
              </span>
              <span style={{
                fontSize: '14px', fontWeight: '700',
                color: netProfit < 0 ? '#FB7185' : '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}>
                <MaskableValue>{fmt(netProfit)}</MaskableValue>
              </span>
            </div>
            {netAfterOperationalCosts !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }} title="Lucro líquido menos 1 mês de custo operacional — informativo, não afeta o cálculo de meses cobertos abaixo.">
                  Lucro após custos operacionais
                </span>
                <span style={{
                  fontSize: '13px', fontWeight: '500',
                  color: netAfterOperationalCosts < 0 ? '#FB7185' : '#34D399',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <MaskableValue>{fmt(netAfterOperationalCosts)}</MaskableValue>
                </span>
              </div>
            )}
            {monthlyBurn > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                  Custo operacional mensal
                </span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  <MaskableValue>{fmt(monthlyBurn)}</MaskableValue>
                </span>
              </div>
            )}
          </div>

          {runwayMonths < 6 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                height: '6px', background: 'rgba(255,255,255,0.1)',
                borderRadius: '99px', overflow: 'hidden', marginBottom: '8px',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, (runwayMonths / 6) * 100))}%`,
                  background: safetyScore.color,
                  borderRadius: '99px',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              {gapToTarget > 0 && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  fontSize: '12px', color: 'rgba(255,255,255,0.6)',
                  lineHeight: '1.5',
                }}>
                  Faltam <MaskableValue>{fmt(gapToTarget)}</MaskableValue> para 6 meses de reserva
                </div>
              )}
            </div>
          )}

          {projectedRunway !== undefined && daysLeft !== undefined && daysLeft > 0 && (
            <div style={{
              marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6',
            }}>
              Projeção: {projectedRunway.toFixed(1)} meses ao fim da temporada · {daysLeft} dias restantes
            </div>
          )}
        </div>
      )}
    </div>
  )
}
