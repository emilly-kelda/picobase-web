'use client'

import { useState } from 'react'

const COST_ITEMS_PT = [
  { key: 'rent',        label: 'Aluguel / armazenamento' },
  { key: 'insurance',   label: 'Seguro'                  },
  { key: 'accountant',  label: 'Contador'                },
  { key: 'marketing',   label: 'Marketing'               },
  { key: 'maintenance', label: 'Manutenção equipamentos' },
  { key: 'software',    label: 'Softwares e ferramentas' },
  { key: 'transport',   label: 'Transporte'              },
  { key: 'other',       label: 'Outros'                  },
]

const COST_ITEMS_EN = [
  { key: 'rent',        label: 'Rent / storage'          },
  { key: 'insurance',   label: 'Insurance'               },
  { key: 'accountant',  label: 'Accountant'              },
  { key: 'marketing',   label: 'Marketing'               },
  { key: 'maintenance', label: 'Equipment maintenance'   },
  { key: 'software',    label: 'Software and tools'      },
  { key: 'transport',   label: 'Transport'               },
  { key: 'other',       label: 'Other'                   },
]

export default function BurnRateCalculator({
  onApply,
  lang = 'pt',
}: {
  onApply: (total: number) => void
  lang?: 'pt' | 'en'
}) {
  const [open,   setOpen]   = useState(false)
  const [values, setValues] = useState<Record<string, number>>({})

  const items = lang === 'pt' ? COST_ITEMS_PT : COST_ITEMS_EN

  const total = Object.values(values).reduce((s, v) => s + (v || 0), 0)

  function set(key: string, val: string) {
    setValues(prev => ({
      ...prev,
      [key]: val === '' ? 0 : Math.max(0, Number(val)),
    }))
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none',
          cursor: 'pointer', padding: '0',
          fontSize: '12px',
          color: 'var(--teal, #2EC4B6)',
          fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        <span>{open ? '▲' : '▼'}</span>
        <span>
          {lang === 'pt'
            ? 'Como calcular meus custos mensais?'
            : 'How to calculate my monthly costs?'
          }
        </span>
      </button>

      {open && (
        <div style={{
          marginTop: '12px',
          background: 'var(--powder, #F0EEE8)',
          borderRadius: '12px',
          padding: '16px',
          border: '0.5px solid var(--border, #DDD8CF)',
        }}>

          {/* Helper text */}
          <div style={{
            fontSize: '12px',
            color: 'var(--mist, #8A8C98)',
            marginBottom: '16px',
            lineHeight: '1.6',
          }}>
            {lang === 'pt'
              ? 'Preencha os seus custos fixos mensais para calcular o valor correto. Não salva dados individuais — só o total.'
              : 'Fill in your monthly fixed costs to calculate the right number. Individual items are not saved — only the total.'
            }
          </div>

          {/* Cost rows */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px',
          }}>
            {items.map(item => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <label style={{
                  flex: 1,
                  fontSize: '13px',
                  color: 'var(--slate, #0B1F2E)',
                }}>
                  {item.label}
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--mist)',
                  }}>
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={values[item.key] || ''}
                    onChange={e => set(item.key, e.target.value)}
                    placeholder="0"
                    style={{
                      width: '90px',
                      padding: '6px 10px',
                      border: '0.5px solid var(--border, #DDD8CF)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      color: 'var(--slate)',
                      background: '#fff',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{
            height: '0.5px',
            background: 'var(--border)',
            marginBottom: '12px',
          }} />

          {/* Total + apply */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--mist)',
                marginBottom: '3px',
              }}>
                {lang === 'pt' ? 'Total calculado' : 'Calculated total'}
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: '700',
                color: total > 0 ? 'var(--slate)' : 'var(--mist)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                }).format(total)}
              </div>
            </div>

            <button
              type="button"
              disabled={total === 0}
              onClick={() => {
                onApply(total)
                setOpen(false)
              }}
              style={{
                padding: '10px 20px',
                background: total > 0
                  ? 'var(--teal, #2EC4B6)'
                  : 'var(--border)',
                color: total > 0 ? '#fff' : 'var(--mist)',
                border: 'none',
                borderRadius: '99px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: total > 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {lang === 'pt' ? 'Usar este valor →' : 'Use this value →'}
            </button>
          </div>

          {/* Note */}
          {total > 0 && (
            <div style={{
              marginTop: '10px',
              fontSize: '11px',
              color: 'var(--mist)',
              lineHeight: '1.5',
            }}>
              {lang === 'pt'
                ? '💡 Estes valores são apenas para cálculo. Ao clicar em "Usar este valor", só o total será salvo nas configurações.'
                : '💡 These values are for calculation only. Clicking "Use this value" saves only the total to your settings.'
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}
