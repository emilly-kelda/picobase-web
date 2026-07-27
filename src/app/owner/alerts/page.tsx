import { getAlerts } from '@/repositories/alertRepository'
import OperationalPulse from '@/components/OperationalPulse'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

/** Dedicated route for what used to sit inline at the top of /owner —
 *  moved here (separate sidebar entry, bell icon + badge) so the main
 *  dashboard's top can stay focused on the high-level KPIs (revenue,
 *  occupancy) without a variable-height alerts panel pushing them around.
 *  Renamed Pulso Operacional -> Alertas (route moved from /owner/pulse to
 *  /owner/alerts) per owner feedback — same getAlerts data and the same
 *  OperationalPulse list rendering either way, only the name and URL
 *  changed. */
export default async function AlertsPage() {
  const alerts = await getAlerts(SCHOOL_ID)

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Alertas
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Tudo que precisa de uma decisão hoje — pacotes a esgotar, termos pendentes, pagamentos em aberto.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
            Tudo em dia!
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Nenhum alerta no momento — nada a exigir uma decisão agora.
          </div>
        </div>
      ) : (
        <OperationalPulse alerts={alerts} />
      )}
    </div>
  )
}
