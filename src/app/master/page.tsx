import Link from 'next/link'

export default function MasterPage() {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '4px',
          }}>
            Escolas
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Gestão global de clientes Pico Base
          </p>
        </div>
        <Link
          href="/master/schools/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px',
            background: 'var(--slate)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '13px', fontWeight: '500',
            textDecoration: 'none', fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
          }}
        >
          + Nova Escola
        </Link>
      </div>

      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '48px',
        textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
      }}>
        Lista global de escolas em breve.
      </div>
    </div>
  )
}
