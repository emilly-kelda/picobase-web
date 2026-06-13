'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

type Activity = {
  id: string
  name: string
  code: string
  sport: string | null
  default_price: number
  default_duration_min: number
  pricing_mode: string
  active: boolean
  sort_order: number
}

const empty = {
  name: '', code: '', sport: '', default_price: 0,
  default_duration_min: 60, pricing_mode: 'proportional', active: true, sort_order: 0,
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(n)
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<Activity | null>(null)
  const [form, setForm]             = useState(empty)
  const [saving, setSaving]         = useState(false)
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('school_id', SCHOOL_ID)
      .order('sort_order')
    setActivities(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(empty)
    setShowForm(true)
  }

  function openEdit(a: Activity) {
    setEditing(a)
    setForm({
      name: a.name, code: a.code, sport: a.sport ?? '',
      default_price: a.default_price, default_duration_min: a.default_duration_min,
      pricing_mode: a.pricing_mode, active: a.active, sort_order: a.sort_order,
    })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, school_id: SCHOOL_ID, sport: form.sport || null }
    if (editing) {
      await supabase.from('activities').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('activities').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function toggleActive(a: Activity) {
    await supabase.from('activities').update({ active: !a.active }).eq('id', a.id)
    load()
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: '500' as const,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: 'var(--mist)', display: 'block', marginBottom: '6px',
  }
  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '13px',
    border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
    background: '#fff', color: 'var(--slate)', outline: 'none',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', marginBottom: '4px' }}>Activities</h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>Lesson types available at your school.</p>
        </div>
        <button onClick={openNew} style={{
          padding: '8px 16px', fontSize: '13px', fontWeight: '500',
          background: 'var(--slate)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer',
        }}>
          + New activity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '20px' }}>
            {editing ? 'Edit activity' : 'New activity'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Code</label>
              <input style={inputStyle} value={form.code} placeholder="e.g. KI"
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label style={labelStyle}>Sport</label>
              <input style={inputStyle} value={form.sport} placeholder="e.g. kitesurf"
                onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Default price (R$)</label>
              <input style={inputStyle} type="number" value={form.default_price}
                onChange={e => setForm(f => ({ ...f, default_price: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input style={inputStyle} type="number" value={form.default_duration_min}
                onChange={e => setForm(f => ({ ...f, default_duration_min: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Pricing mode</label>
              <select style={inputStyle} value={form.pricing_mode}
                onChange={e => setForm(f => ({ ...f, pricing_mode: e.target.value }))}>
                <option value="proportional">Proportional</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={save} disabled={saving} style={{
              padding: '8px 20px', fontSize: '13px', fontWeight: '500',
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

      {/* Table */}
      <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Code', 'Sport', 'Price', 'Duration', 'Pricing', 'Status', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 20px', textAlign: 'left',
                    fontSize: '11px', fontWeight: '500',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--mist)', background: 'var(--powder)',
                    borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < activities.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>{a.name}</td>
                  <td style={{ padding: '12px 20px', fontSize: '12px', color: 'var(--mist)', fontFamily: 'var(--font-mono)' }}>{a.code}</td>
                  <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--mist)' }}>{a.sport ?? '—'}</td>
                  <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--slate)' }}>{fmt(a.default_price)}</td>
                  <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--mist)' }}>{a.default_duration_min}min</td>
                  <td style={{ padding: '12px 20px', fontSize: '12px', color: 'var(--mist)' }}>{a.pricing_mode}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span onClick={() => toggleActive(a)} style={{
                      fontSize: '11px', fontWeight: '500', padding: '3px 10px',
                      borderRadius: 'var(--radius-full)', cursor: 'pointer',
                      background: a.active ? 'var(--glacial-light)' : 'var(--powder)',
                      color: a.active ? 'var(--glacial-dark)' : 'var(--mist)',
                    }}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <button onClick={() => openEdit(a)} style={{
                      fontSize: '12px', color: 'var(--mist)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: '0',
                    }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}