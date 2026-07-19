'use client'

import { useState } from 'react'

export type NotificationFlags = {
  notify_student_before_class: boolean
  notify_payment_and_waiver: boolean
  notify_instructor_on_checkin: boolean
  notify_package_low: boolean
  notify_late_cancellation: boolean
  notify_post_class_feedback: boolean
}

type Row = { key: keyof NotificationFlags; title: string; description: string }

const CATEGORIES: Array<{ title: string; rows: Row[] }> = [
  {
    title: 'Cobrança e Pacotes (Financeiro)',
    rows: [
      {
        key: 'notify_payment_and_waiver',
        title: 'Confirmação e Termo',
        description: 'Enviar comprovante de pagamento e link do Termo de Responsabilidade (Waiver) assim que a reserva for confirmada.',
      },
      {
        key: 'notify_package_low',
        title: 'Alerta de Fim de Pacote',
        description: 'Notificar o aluno automaticamente via WhatsApp quando restar apenas 1 hora no seu pacote de créditos, sugerindo a renovação.',
      },
    ],
  },
  {
    title: 'Operacionais e Logística',
    rows: [
      {
        key: 'notify_student_before_class',
        title: 'Lembrete de Aula',
        description: 'Enviar mensagem automática no WhatsApp do aluno 2 horas antes da aula confirmando as condições do vento/mar.',
      },
      {
        key: 'notify_instructor_on_checkin',
        title: 'Aviso aos Instrutores',
        description: 'Notificar o instrutor via e-mail/WhatsApp quando um novo aluno fizer check-in na aula dele.',
      },
      {
        key: 'notify_late_cancellation',
        title: 'Cancelamento Tardio',
        description: 'Enviar aviso automático quando o aluno desmarcar uma aula dentro da janela limite (menos de 24h antes), notificando o débito da hora ou perda do reembolso.',
      },
    ],
  },
  {
    title: 'Relacionamento e Vendas (Pós-Aula)',
    rows: [
      {
        key: 'notify_post_class_feedback',
        title: 'Feedback e Evolução',
        description: 'Enviar mensagem de parabéns e resumo da habilidade conquistada para o WhatsApp do aluno 1 hora após o instrutor concluir a aula.',
      },
    ],
  },
]

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '40px', height: '22px', borderRadius: '99px',
        border: 'none', padding: '2px', flexShrink: 0,
        background: checked ? 'var(--slate)' : 'var(--border)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        transition: 'background 0.15s',
      }}
    >
      <span style={{
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', display: 'block',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

export default function NotificationsModal({
  flags,
  onClose,
  onSaved,
}: {
  flags: NotificationFlags
  onClose: () => void
  onSaved: (patch: NotificationFlags) => void
}) {
  const [values, setValues] = useState<NotificationFlags>(flags)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'school', ...values }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved(values)
      } else {
        setError(data.error ?? 'Não foi possível salvar.')
        setSaving(false)
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '560px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
            Notificações Automáticas e Gatilhos
          </div>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Controle quais mensagens automáticas o sistema deve disparar.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {CATEGORIES.map(category => (
            <div key={category.title}>
              <div style={{
                fontSize: '10px', fontWeight: '600',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '10px',
              }}>
                {category.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {category.rows.map(row => (
                  <div
                    key={row.key}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      padding: '14px 16px',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
                        {row.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--mist)', lineHeight: '1.5' }}>
                        {row.description}
                      </div>
                    </div>
                    <Switch
                      checked={values[row.key]}
                      onChange={v => setValues(prev => ({ ...prev, [row.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 2, padding: '11px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
