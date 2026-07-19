'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Student = {
  id: string
  name: string
  email: string | null
  whatsapp: string | null
  nationality: string | null
  health_conditions: string | null
  created_at: string
}

const NATIONALITIES: Array<[string, string]> = [
  ['BR', '🇧🇷 Brasil'], ['FR', '🇫🇷 França'],
  ['DE', '🇩🇪 Alemanha'], ['GB', '🇬🇧 UK'],
  ['US', '🇺🇸 EUA'], ['AR', '🇦🇷 Argentina'],
  ['ES', '🇪🇸 Espanha'], ['PT', '🇵🇹 Portugal'],
  ['IT', '🇮🇹 Itália'], ['NL', '🇳🇱 Holanda'],
  ['AU', '🇦🇺 Austrália'], ['SE', '🇸🇪 Suécia'],
  ['OTHER', 'Outro'],
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: '500',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--mist)', marginBottom: '4px', display: 'block',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** Edit mode for the student profile's identity + contact/health block.
 *  Scoped to columns that actually exist on `students` (name, email,
 *  whatsapp, nationality, health_conditions) — this table has no
 *  languages/sports columns (those live on `users`, for instructors via
 *  CrewClient), so there's nothing analogous to add checkboxes for here.
 *  skill_level has its own dedicated editor (ProgressionEditor) further
 *  down the page and isn't duplicated here. */
export default function StudentProfileHeader({ student }: { student: Student }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [name, setName]   = useState(student.name)
  const [email, setEmail] = useState(student.email ?? '')
  const [whatsapp, setWhatsapp] = useState(student.whatsapp ?? '')
  const [nationality, setNationality] = useState(student.nationality ?? '')
  const [healthStatus, setHealthStatus] = useState<'normal' | 'alert'>(
    student.health_conditions ? 'alert' : 'normal'
  )
  const [healthConditions, setHealthConditions] = useState(student.health_conditions ?? '')

  function cancel() {
    setName(student.name)
    setEmail(student.email ?? '')
    setWhatsapp(student.whatsapp ?? '')
    setNationality(student.nationality ?? '')
    setHealthStatus(student.health_conditions ? 'alert' : 'normal')
    setHealthConditions(student.health_conditions ?? '')
    setError(null)
    setIsEditing(false)
  }

  async function save() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          name: name.trim(),
          email: email || null,
          whatsapp: whatsapp || null,
          nationality: nationality || null,
          health_conditions: healthStatus === 'alert' ? healthConditions : '',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setIsEditing(false)
        router.refresh()
      } else {
        setError(data.error ?? 'Erro ao salvar.')
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <a href="/owner/students" style={{
          fontSize: '13px', color: 'var(--mist)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          marginBottom: '16px',
        }}>
          ← Alunos
        </a>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '48px', height: '48px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--glacial-light)',
              color: 'var(--glacial-dark)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px', fontWeight: '600',
              flexShrink: 0,
            }}>
              {student.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <input
                  style={{ ...inputStyle, fontSize: '18px', fontWeight: '500', maxWidth: '360px' }}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome completo"
                />
              ) : (
                <h1 style={{
                  fontSize: '22px', fontWeight: '500',
                  color: 'var(--slate)', marginBottom: '4px',
                }}>
                  {student.name}
                </h1>
              )}
              {!isEditing && (
                <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
                  {student.nationality ?? 'Nacionalidade desconhecida'} · Aluno desde {fmtDate(student.created_at)}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {isEditing ? (
              <>
                <button
                  onClick={cancel}
                  disabled={saving}
                  style={{
                    padding: '7px 14px',
                    background: '#fff', color: 'var(--mist)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px', fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving || !name.trim()}
                  style={{
                    padding: '7px 14px',
                    background: '#007868', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    fontSize: '12px', fontWeight: '500',
                    cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
                    opacity: saving || !name.trim() ? 0.6 : 1,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '7px 14px',
                  background: '#fff', color: 'var(--slate)',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px', fontWeight: '500',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                ✎ Editar ficha
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: '20px', padding: '10px 14px',
          background: 'var(--signal-light)', color: 'var(--signal-dark)',
          borderRadius: 'var(--radius-md)', fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* Contact & health */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: isEditing ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {isEditing ? (
          <>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="aluno@email.com" />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input style={inputStyle} type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+55 85 9..." />
            </div>
            <div>
              <label style={labelStyle}>Nacionalidade</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={nationality} onChange={e => setNationality(e.target.value)}>
                <option value="">—</option>
                {NATIONALITIES.map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Saúde / Avisos</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={healthStatus}
                onChange={e => setHealthStatus(e.target.value as 'normal' | 'alert')}
              >
                <option value="normal">Normal</option>
                <option value="alert">Alerta</option>
              </select>
            </div>
            {healthStatus === 'alert' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Descrição clínica</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  value={healthConditions}
                  onChange={e => setHealthConditions(e.target.value)}
                  placeholder="Ex: asma, alergias, restrições médicas..."
                />
              </div>
            )}
          </>
        ) : (
          [
            { label: 'Email',    value: student.email },
            { label: 'WhatsApp', value: student.whatsapp },
            { label: 'Condições de saúde', value: student.health_conditions },
          ].map(item => (
            <div key={item.label}>
              <div style={labelStyle}>{item.label}</div>
              <div style={{ fontSize: '13px', color: item.value ? 'var(--slate)' : 'var(--mist)' }}>
                {item.value ?? '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
