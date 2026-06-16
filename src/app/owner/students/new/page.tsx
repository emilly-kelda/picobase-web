'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewStudentPage() {
  const router = useRouter()
  const [name,        setName]        = useState('')
  const [nationality, setNationality] = useState('')
  const [whatsapp,    setWhatsapp]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/owner/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        nationality: nationality || null,
        whatsapp: whatsapp || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.ok) {
      router.push('/owner/students')
      router.refresh()
    } else {
      setError(data.error ?? 'Erro ao criar aluno')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '0.5px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px', color: 'var(--slate)',
    fontFamily: 'var(--font-sans)', outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: '500',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--mist)', display: 'block', marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Novo aluno
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Adicionar aluno manualmente ao sistema.
        </p>
      </div>

      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '18px',
      }}>
        <div>
          <label style={labelStyle}>Nome completo *</label>
          <input
            style={inputStyle} type="text"
            placeholder="Sofia Andersson"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>Nacionalidade</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={nationality}
            onChange={e => setNationality(e.target.value)}
          >
            <option value="">—</option>
            {[
              ['BR','🇧🇷 Brasil'], ['FR','🇫🇷 França'],
              ['DE','🇩🇪 Alemanha'], ['GB','🇬🇧 UK'],
              ['US','🇺🇸 EUA'], ['AR','🇦🇷 Argentina'],
              ['ES','🇪🇸 Espanha'], ['PT','🇵🇹 Portugal'],
              ['IT','🇮🇹 Itália'], ['NL','🇳🇱 Holanda'],
              ['AU','🇦🇺 Austrália'], ['SE','🇸🇪 Suécia'],
              ['OTHER','Outro'],
            ].map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>WhatsApp</label>
          <input
            style={inputStyle} type="tel"
            placeholder="+55 85 9..."
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'var(--signal-light)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px', color: 'var(--signal-dark)',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={() => router.back()}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            style={{
              flex: 2, padding: '11px',
              background: saving || !name.trim()
                ? 'var(--border)' : 'var(--slate)',
              color: saving || !name.trim()
                ? 'var(--mist)' : '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Salvando...' : 'Criar aluno'}
          </button>
        </div>
      </div>
    </div>
  )
}
