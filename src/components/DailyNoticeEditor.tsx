'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DailyNoticeEditor({ notice }: { notice: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue]     = useState(notice ?? '')
  const [saving, setSaving]   = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'school', daily_notice: value.trim() || null }),
      })
      if (res.ok) {
        setEditing(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      padding: '16px 20px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: editing || notice ? '8px' : '0',
      }}>
        <span style={{
          fontSize: '10px', fontWeight: '600',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)',
        }}>
          📌 Mural de Avisos
        </span>
        {!editing && (
          <button
            onClick={() => { setValue(notice ?? ''); setEditing(true) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--glacial-dark)', fontWeight: '500',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {notice ? 'Editar' : '+ Adicionar aviso'}
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Ex: Atenção com a correnteza na bancada leste hoje"
            rows={2}
            autoFocus
            style={{
              width: '100%', padding: '8px 10px',
              border: '0.5px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px', color: 'var(--slate)',
              fontFamily: 'var(--font-sans)', outline: 'none',
              resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              style={{
                padding: '6px 14px', background: '#fff', color: 'var(--mist)',
                border: '0.5px solid var(--border)', borderRadius: '99px',
                fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: '6px 14px', background: 'var(--slate)', color: '#fff',
                border: 'none', borderRadius: '99px',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : notice ? (
        <div style={{ fontSize: '13px', color: 'var(--slate)', lineHeight: '1.5' }}>
          {notice}
        </div>
      ) : null}
    </div>
  )
}
