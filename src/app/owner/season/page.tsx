'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

type Season = {
  id: string
  label: string
  start_date: string
  end_date: string
  burn_rate: number
}

const empty = { label: '', start_date: '', end_date: '', burn_rate: 5000 }

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(n)
}

function monthsBetween(start: string, end: string) {
  const s = new Date(start), e = new Date(end)
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
}

export default function SeasonPage() {
  const [seasons, setSeasons]   = useState<Season[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Season | null>(null)
  const [form, setForm]         = useState(empty)
  const [saving, setSaving]     = useState(false)
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .order('start_date', { ascending: false })
    setSeasons(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(empty)
    setShowForm(true)
  }

  function openEdit(s: Season) {
    setEditing(s)
    setForm({ label: s.label, start_date: s.start_date, end_date: s.end_date, burn_rate: s.burn_rate })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, school_id: SCHOOL_ID }
    if (editing) {
      await supabase.from('seasons').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('seasons').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--mist)', display: 'block', marginBottom: '6px',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: '13px',
    border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
    background: '#fff', color: 'var(--slate)', outline: 'none',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '4px' }}>Season</h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>Manage your school seasons and monthly burn rate.</p>
        </div>
        <button onClick={openNew} style={{
          padding: '8px 16px', fontSize: '13px', fontWeight: 500,
          background: 'var(--slate)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer',
        }}>
          + New season
        </button>
      </div>

      {showForm && (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '20px' }}>
            {editing ? 'Edit season' : 'New season'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Label</label>
              <input style={inputStyle} value={form.label} placeholder="e.g. 2026-2027"
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Start date</label>
              <input style={inputStyle} type="date" value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>End date</label>
              <input style={inputStyle} type="date" value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Monthly burn rate (R$)</label>
              <input style={inputStyle} type="number" value={form.burn_rate}
                onChange={e => setForm(f => ({ ...f, burn_rate: Number(e.target.value) }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={save} disabled={saving} style={{
              padding: '8px 20px', fontSize: '13px', fontWeight: 500,
              background: 'var(--slate)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
            }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '8px 16px', fontSize: '13px',
              background: 'transparent', color: 'var(--mist)',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>Carregando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {seasons.map((s, i) => {
            const months = monthsBetween(s.start_date, s.end_date)
            const isCurrent = i === 0
            return (
              <div key={s.id} style={{
                background: '#fff',
                border: isCurrent ? '0.5px solid var(--glacial)' : '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                alignItems: 'center',
                gap: '24px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--slate)' }}>{s.label}</span>
                    {isCurrent && (
                      <span style={{
                        fontSize: '10px', fontWeight: 500, padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--glacial-light)', color: 'var(--glacial-dark)',
                      }}>Current</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    {new Date(s.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(s.end_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '4px' }}>Duration</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate)' }}>{months} months</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '4px' }}>Burn rate</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate)' }}>
                    {fmt(s.burn_rate)}<span style={{ fontSize: '11px', color: 'var(--mist)', fontWeight: 400 }}>/month</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '4px' }}>Total exposure</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate)' }}>{fmt(s.burn_rate * months)}</div>
                </div>
                <button onClick={() => openEdit(s)} style={{
                  fontSize: '12px', color: 'var(--mist)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '0',
                }}>
                  Edit
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}