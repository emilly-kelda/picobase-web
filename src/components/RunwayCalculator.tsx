'use client'

import { useState } from 'react'

type Props = {
  seasonProfit: number
  burnRate: number
  currency?: string
  daysLeft?: number
  projectedRunway?: number
  gap?: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

export default function RunwayCalculator({ seasonProfit, burnRate, currency = 'BRL', daysLeft, projectedRunway, gap }: Props) {
  const [burn, setBurn] = useState(burnRate > 0 ? burnRate : 5000)
  const [profit, setProfit] = useState(seasonProfit > 0 ? seasonProfit : 0)

  const runway = burn > 0 ? profit / burn : 0
  const runwayMonths = Math.max(0, runway)

  const barPct = Math.min(100, (runwayMonths / 12) * 100)

  const monthsCovered = burn > 0 ? profit / burn : 0

  const targetMonths = 6

  const targetProfit = burn * targetMonths

  const profitGap = Math.max(0, targetProfit - profit)

  const estimatedMonth = new Date(
    Date.now() + monthsCovered * 30 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-US", {
    month: "long"
  })

  const barColor = runwayMonths >= 6
    ? 'var(--glacial)'
    : runwayMonths >= 3
      ? '#D4A017'
      : 'var(--signal)'

  const verdict = runwayMonths >= 6
    ? { label: 'Comfortable', color: 'var(--glacial-dark)', bg: 'var(--glacial-light)' }
    : runwayMonths >= 3
      ? { label: 'Tight', color: '#7A4C00', bg: '#FBF3E2' }
      : { label: 'Critical', color: 'var(--signal-dark)', bg: 'var(--signal-light)' }

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: '32px',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--slate)' }}>
            Off-Season Runway Calculator
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '2px' }}>
            How many months can this season cover?
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '12px', fontWeight: '500',
          background: verdict.bg, color: verdict.color,
        }}>
          {verdict.label}
        </span>
      </div>

      <div style={{
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        alignItems: 'center',
      }}>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)',
              }}>
                Season profit
              </label>
              <span style={{
                fontSize: '13px', fontWeight: '600',
                color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
              }}>
                {fmt(profit)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100000}
              step={500}
              value={profit}
              onChange={e => setProfit(Number(e.target.value))}
              style={{
                width: '100%', accentColor: 'var(--glacial)',
                cursor: 'pointer', height: '4px',
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: '4px', fontSize: '10px', color: 'var(--mist)',
            }}>
              <span>R$ 0</span>
              <span>R$ 100k</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)',
              }}>
                Monthly burn rate
              </label>
              <span style={{
                fontSize: '13px', fontWeight: '600',
                color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
              }}>
                {fmt(burn)}
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={30000}
              step={250}
              value={burn}
              onChange={e => setBurn(Number(e.target.value))}
              style={{
                width: '100%', accentColor: 'var(--glacial)',
                cursor: 'pointer', height: '4px',
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: '4px', fontSize: '10px', color: 'var(--mist)',
            }}>
              <span>R$ 500</span>
              <span>R$ 30k</span>
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            background: 'var(--powder)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px', color: 'var(--mist)',
            lineHeight: '1.6',
          }}>
            Formula: season profit &divide; monthly burn rate = months of runway
          </div>

          {(daysLeft !== undefined && daysLeft > 0) && (
            <div style={{
              padding: '14px 16px',
              background: 'var(--powder)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '4px',
              }}>
                Ao ritmo atual
              </div>
              {projectedRunway !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--mist)' }}>Projeção ao fim da temporada</span>
                  <span style={{
                    fontWeight: '600',
                    color: projectedRunway >= 6
                      ? 'var(--glacial-dark)'
                      : projectedRunway >= 3
                        ? '#D4A017'
                        : 'var(--signal)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {projectedRunway.toFixed(1)} meses
                  </span>
                </div>
              )}
              {gap !== undefined && gap > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--mist)' }}>Faltam para 6 meses</span>
                  <span style={{ fontWeight: '600', color: 'var(--signal)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(gap)}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--mist)' }}>Dias restantes na temporada</span>
                <span style={{ fontWeight: '600', color: 'var(--mist)' }}>
                  {daysLeft} dias
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '16px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '11px', fontWeight: '500',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '8px',
            }}>
              Off-Season Runway
            </div>
            <div style={{
              fontSize: '72px', fontWeight: '600',
              color: barColor, lineHeight: '1',
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.3s ease',
            }}>
              {runwayMonths.toFixed(1)}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--mist)', marginTop: '4px' }}>
              months covered
            </div>
          </div>

          {/* Bar */}
          <div style={{ width: '100%' }}>
            <div style={{
              height: '8px', background: 'var(--powder)',
              borderRadius: 'var(--radius-full)', overflow: 'hidden',
              marginBottom: '8px',
            }}>
              <div style={{
                height: '100%',
                width: `${barPct}%`,
                background: barColor,
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }} />
            </div>

            {/* Month markers */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '10px', color: 'var(--mist)',
            }}>
              {['0', '3', '6', '9', '12'].map(m => (
                <span key={m}>{m}mo</span>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{
            width: '100%', padding: '12px 16px',
            background: verdict.bg,
            borderRadius: 'var(--radius-md)',
            fontSize: '12px', color: verdict.color,
            textAlign: 'center', lineHeight: '1.5',
          }}>
            {fmt(profit)} profit &divide; {fmt(burn)}/month
            {runwayMonths > 0
              ? ` = ${runwayMonths.toFixed(1)} months off-season covered`
              : '— enter season profit to calculate'
            }
          </div>
        </div>

      </div>
    </div>
  )
}




