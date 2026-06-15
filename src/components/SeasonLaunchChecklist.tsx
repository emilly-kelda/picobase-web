type ChecklistItem = {
  label: string
  done: boolean
  sub?: string
  href?: string
}

export default function SeasonLaunchChecklist({
  items,
}: {
  items: ChecklistItem[]
}) {
  const doneCount = items.filter(i => i.done).length
  const pct       = Math.round((doneCount / items.length) * 100)
  const allDone   = doneCount === items.length

  return (
    <div style={{
      background: '#fff',
      border: allDone ? '0.5px solid var(--glacial)' : '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
        background: allDone ? 'var(--glacial-light)' : '#fff',
      }}>
        <div>
          <div style={{
            fontSize: '14px', fontWeight: '500',
            color: allDone ? 'var(--glacial-dark)' : 'var(--slate)',
            marginBottom: '2px',
          }}>
            {allDone ? '✓ Escola pronta para a temporada' : 'Configuração da temporada'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
            {doneCount} de {items.length} itens concluídos
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '22px', fontWeight: '600',
            color: allDone ? 'var(--glacial-dark)' : 'var(--slate)',
          }}>
            {pct}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--powder)' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: allDone ? 'var(--glacial)' : '#D4A017',
          transition: 'width 0.4s',
        }} />
      </div>

      {/* Items */}
      <div>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center',
              gap: '14px', padding: '13px 24px',
              borderBottom: i < items.length - 1
                ? '0.5px solid var(--border)' : 'none',
              background: item.done ? '#fff' : '#FAFAF8',
            }}
          >
            {/* Status icon */}
            <div style={{
              width: '22px', height: '22px',
              borderRadius: '50%',
              background: item.done ? 'var(--glacial-light)' : 'var(--powder)',
              border: item.done
                ? '1.5px solid var(--glacial)'
                : '1.5px solid var(--border-strong)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '11px',
              color: 'var(--glacial-dark)',
            }}>
              {item.done ? '✓' : ''}
            </div>

            {/* Label */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px', fontWeight: '500',
                color: item.done ? 'var(--slate)' : 'var(--mist)',
                marginBottom: item.sub ? '2px' : '0',
              }}>
                {item.label}
              </div>
              {item.sub && (
                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                  {item.sub}
                </div>
              )}
            </div>

            {/* Action link */}
            {!item.done && item.href && (
              <a
                href={item.href}
                style={{
                  padding: '5px 12px',
                  background: 'var(--slate)', color: '#fff',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '11px', fontWeight: '500',
                  textDecoration: 'none', flexShrink: 0,
                }}
              >
                Configurar →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
