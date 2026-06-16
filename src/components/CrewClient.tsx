'use client'

import { useState } from 'react'
import Link from 'next/link'

type Cert = { name: string; code: string; expiration_date: string }
type Stats = { sessions: number; revenue: number; commissions: number }

type CrewMember = {
  id: string
  name: string
  email: string | null
  whatsapp: string | null
  commission_pct: number | null
  pix_key: string | null
  wise_email: string | null
  active: boolean
  created_at?: string
  nationality?: string | null
  languages?: unknown
  sports?: unknown
  certifications?: unknown
  bio?: string | null
  experience_years?: number | null
  max_students_per_session?: number | null
  first_aid_certified?: boolean | null
  contract_type?: string | null
  stats: Stats
}

const MODALITIES = ['kitesurf', 'wingfoil', 'kitefoil', 'surf'] as const
const LANG_OPTIONS = ['PT', 'EN', 'ES'] as const

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtPct(n: number | null | undefined) {
  if (n == null) return '—'
  return `${Math.round(n * 100)}%`
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const emptyForm = () => ({
  name: '',
  email: '',
  commission_pct: '',
  experience_years: '',
  sports: [] as string[],
  languages: [] as string[],
  certifications: [] as Cert[],
  pix_key: '',
})

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

const sectionHeadStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: '600',
  letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--mist)', marginBottom: '12px',
  paddingBottom: '8px', borderBottom: '0.5px solid var(--border)',
}

export default function CrewClient({ initialCrew }: { initialCrew: CrewMember[] }) {
  const [crew, setCrew] = useState(initialCrew)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<CrewMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [form, setForm] = useState(emptyForm())

  const totalRevenue     = crew.reduce((s, m) => s + m.stats.revenue, 0)
  const totalCommissions = crew.reduce((s, m) => s + m.stats.commissions, 0)
  const totalSessions    = crew.reduce((s, m) => s + m.stats.sessions, 0)

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm())
    setDeleteConfirm(false)
    setShowModal(true)
  }

  function openEdit(member: CrewMember, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setEditTarget(member)
    setDeleteConfirm(false)
    setForm({
      name:             member.name,
      email:            member.email ?? '',
      commission_pct:   member.commission_pct != null
        ? String(Math.round(member.commission_pct * 100))
        : '',
      experience_years: member.experience_years != null
        ? String(member.experience_years)
        : '',
      sports:    Array.isArray(member.sports)    ? (member.sports as string[])    : [],
      languages: Array.isArray(member.languages) ? (member.languages as string[]) : [],
      certifications: Array.isArray(member.certifications)
        ? (member.certifications as Cert[])
        : [],
      pix_key: member.pix_key ?? '',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditTarget(null)
    setDeleteConfirm(false)
  }

  function toggleTag(field: 'sports' | 'languages', value: string) {
    setForm(f => ({
      ...f,
      [field]: (f[field] as string[]).includes(value)
        ? (f[field] as string[]).filter(v => v !== value)
        : [...(f[field] as string[]), value],
    }))
  }

  function addCert() {
    setForm(f => ({
      ...f,
      certifications: [...f.certifications, { name: '', code: '', expiration_date: '' }],
    }))
  }

  function updateCert(i: number, field: keyof Cert, value: string) {
    setForm(f => ({
      ...f,
      certifications: f.certifications.map((c, idx) =>
        idx === i ? { ...c, [field]: value } : c
      ),
    }))
  }

  function removeCert(i: number) {
    setForm(f => ({
      ...f,
      certifications: f.certifications.filter((_, idx) => idx !== i),
    }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) { showToast('err', 'Name is required'); return }
    if (!form.email.trim()) { showToast('err', 'Email is required'); return }

    setSaving(true)
    const payload = {
      name:             form.name.trim(),
      email:            form.email.trim(),
      commission_pct:   form.commission_pct !== '' ? Number(form.commission_pct) / 100 : null,
      experience_years: form.experience_years !== '' ? Number(form.experience_years) : null,
      sports:           form.sports,
      languages:        form.languages,
      certifications:   form.certifications.filter(c => c.name.trim()),
      pix_key:          form.pix_key.trim() || null,
    }

    if (editTarget) {
      const res = await fetch('/api/owner/crew', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id, ...payload }),
      })
      const data = await res.json()
      setSaving(false)
      if (!res.ok) { showToast('err', data.error ?? 'Update failed'); return }
      setCrew(prev => prev.map(m =>
        m.id === editTarget.id ? { ...m, ...payload } : m
      ))
      showToast('ok', `${form.name} updated`)
      closeModal()
    } else {
      const res = await fetch('/api/owner/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setSaving(false)
      if (!res.ok) { showToast('err', data.error ?? 'Add failed'); return }
      const newMember: CrewMember = {
        ...data.instructor,
        stats: { sessions: 0, revenue: 0, commissions: 0 },
      }
      setCrew(prev => [...prev, newMember])
      showToast('ok', `${form.name} added to crew`)
      closeModal()
    }
  }

  async function handleDelete() {
    if (!editTarget) return
    setDeleting(true)
    const res = await fetch(`/api/owner/crew?id=${editTarget.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { showToast('err', data.error ?? 'Delete failed'); return }
    setCrew(prev => prev.filter(m => m.id !== editTarget.id))
    showToast('ok', `${editTarget.name} removed from crew`)
    closeModal()
  }

  const tagBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    border: `1.5px solid ${active ? 'var(--glacial)' : 'var(--border)'}`,
    background: active ? 'var(--glacial-light)' : '#fff',
    color: active ? 'var(--glacial-dark)' : 'var(--mist)',
    fontSize: '13px', fontWeight: '500',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  })

  return (
    <div>
      <style>{`.crew-card{transition:border-color 0.15s}.crew-card:hover{border-color:var(--glacial)!important}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 300,
          background: toast.type === 'ok' ? 'var(--glacial-light)' : '#FFF3F3',
          border: `0.5px solid ${toast.type === 'ok' ? 'var(--glacial)' : 'var(--signal)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '12px 20px',
          fontSize: '13px',
          color: toast.type === 'ok' ? 'var(--glacial-dark)' : 'var(--signal)',
          fontWeight: '500',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>{toast.type === 'ok' ? '✓' : '⚠'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
            Crew
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            {crew.length} instructor{crew.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            padding: '9px 18px',
            background: 'var(--slate)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '13px', fontWeight: '500',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          + Add Instructor
        </button>
      </div>

      {/* Season totals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '28px',
      }}>
        {[
          { label: 'Total sessions',    value: String(totalSessions)  },
          { label: 'Revenue generated', value: fmt(totalRevenue)      },
          { label: 'Total commissions', value: fmt(totalCommissions)  },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: '500',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--mist)',
            }}>
              {card.label}
            </span>
            <span style={{
              fontSize: '18px', fontWeight: '600',
              color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
            }}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Crew cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '12px',
      }}>
        {crew.map(member => (
          <div
            key={member.id}
            className="crew-card"
            style={{
              background: '#fff',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Card header — clickable via Link */}
            <Link
              href={`/owner/crew/${member.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: '0.5px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}>
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: 'var(--radius-full)',
                  background: member.active ? 'var(--glacial-light)' : 'var(--powder)',
                  color: member.active ? 'var(--glacial-dark)' : 'var(--mist)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '600', flexShrink: 0,
                }}>
                  {getInitials(member.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '15px', fontWeight: '500',
                    color: 'var(--slate)', marginBottom: '2px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    {member.name}
                    {!member.active && (
                      <span style={{
                        fontSize: '10px', fontWeight: '500',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--powder)', color: 'var(--mist)',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    {member.email ?? member.whatsapp ?? 'No contact'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '22px', fontWeight: '600',
                    color: 'var(--glacial)', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmtPct(member.commission_pct)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--mist)', letterSpacing: '0.06em' }}>
                    commission
                  </div>
                </div>
              </div>
            </Link>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderBottom: '0.5px solid var(--border)',
            }}>
              {[
                { label: 'Sessions', value: String(member.stats.sessions) },
                { label: 'Revenue',  value: fmt(member.stats.revenue)     },
                { label: 'Earned',   value: fmt(member.stats.commissions) },
              ].map((stat, i) => (
                <div key={stat.label} style={{
                  padding: '14px 16px',
                  borderRight: i < 2 ? '0.5px solid var(--border)' : 'none',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '16px', fontWeight: '600',
                    color: 'var(--slate)', marginBottom: '3px',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '10px', fontWeight: '500',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--mist)',
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment info + Edit */}
            <div style={{ padding: '14px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {member.pix_key && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--mist)', width: '36px', flexShrink: 0 }}>PIX</span>
                    <span style={{ color: 'var(--slate)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {member.pix_key}
                    </span>
                  </div>
                )}
                {member.wise_email && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--mist)', width: '36px', flexShrink: 0 }}>Wise</span>
                    <span style={{ color: 'var(--slate)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {member.wise_email}
                    </span>
                  </div>
                )}
                {!member.pix_key && !member.wise_email && (
                  <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    No payment details on file
                  </span>
                )}
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={(e) => openEdit(member, e)}
                  style={{
                    background: 'transparent', border: 'none',
                    fontSize: '12px', color: 'var(--mist)',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    padding: '0',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--border)',
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}

        {crew.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '48px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--mist)',
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            No instructors yet. Add the first one →
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200, padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '560px',
            padding: '28px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '24px' }}>
              {editTarget ? 'Edit Instructor' : 'Add Instructor'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Basic Info */}
              <div>
                <div style={sectionHeadStyle}>Basic Info</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="Full name"
                      value={form.name}
                      autoFocus
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input
                      style={inputStyle}
                      type="email"
                      placeholder="instructor@example.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Commission (%)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        min={0} max={100} step={1}
                        placeholder="e.g. 38"
                        value={form.commission_pct}
                        onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Years of Experience</label>
                      <input
                        style={inputStyle}
                        type="number"
                        min={0} step={1}
                        placeholder="e.g. 5"
                        value={form.experience_years}
                        onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Teaching */}
              <div>
                <div style={sectionHeadStyle}>Teaching</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Modalities</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {MODALITIES.map(mod => (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => toggleTag('sports', mod)}
                          style={tagBtn(form.sports.includes(mod))}
                        >
                          {mod}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Languages</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {LANG_OPTIONS.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleTag('languages', lang)}
                          style={tagBtn(form.languages.includes(lang))}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <div style={sectionHeadStyle}>Certifications</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {form.certifications.map((cert, i) => (
                    <div key={i} style={{
                      padding: '12px 14px',
                      background: 'var(--powder)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          style={{ ...inputStyle, fontSize: '13px', padding: '8px 10px' }}
                          type="text"
                          placeholder="Name — e.g. IKO Instructor Level 2"
                          value={cert.name}
                          onChange={e => updateCert(i, 'name', e.target.value)}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            style={{ ...inputStyle, fontSize: '13px', padding: '8px 10px' }}
                            type="text"
                            placeholder="Code — e.g. IKO-BR-2891"
                            value={cert.code}
                            onChange={e => updateCert(i, 'code', e.target.value)}
                          />
                          <input
                            style={{ ...inputStyle, fontSize: '13px', padding: '8px 10px' }}
                            type="month"
                            placeholder="Expiry"
                            value={cert.expiration_date}
                            onChange={e => updateCert(i, 'expiration_date', e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCert(i)}
                          style={{
                            background: 'transparent', border: 'none',
                            fontSize: '12px', color: 'var(--signal)',
                            cursor: 'pointer', fontFamily: 'var(--font-sans)',
                            padding: '0', textAlign: 'left',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCert}
                    style={{
                      padding: '8px 14px',
                      background: '#fff',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px', color: 'var(--mist)',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      textAlign: 'left',
                    }}
                  >
                    + Add certification
                  </button>
                </div>
              </div>

              {/* Payment */}
              <div>
                <div style={sectionHeadStyle}>Payment</div>
                <div>
                  <label style={labelStyle}>PIX Key</label>
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="CPF, email, phone or random key"
                    value={form.pix_key}
                    onChange={e => setForm(f => ({ ...f, pix_key: e.target.value }))}
                  />
                </div>
              </div>

              {/* Danger zone — edit mode only */}
              {editTarget && (
                <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '16px' }}>
                  {!deleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      style={{
                        background: 'transparent', border: 'none',
                        fontSize: '12px', color: 'var(--mist)',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        padding: '0',
                        textDecoration: 'underline',
                        textDecorationColor: 'var(--border)',
                      }}
                    >
                      Remove instructor from crew
                    </button>
                  ) : (
                    <div style={{
                      padding: '12px 14px',
                      background: '#FFF3F3',
                      border: '0.5px solid var(--signal)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{
                        fontSize: '13px', color: 'var(--signal)',
                        marginBottom: '10px', fontWeight: '500',
                      }}>
                        Remove {editTarget.name} from crew?
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleting}
                          style={{
                            padding: '7px 16px',
                            background: 'var(--signal)', color: '#fff',
                            border: 'none', borderRadius: 'var(--radius-md)',
                            fontSize: '12px', fontWeight: '500',
                            cursor: deleting ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-sans)',
                            opacity: deleting ? 0.6 : 1,
                          }}
                        >
                          {deleting ? '...' : 'Yes, remove'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(false)}
                          style={{
                            padding: '7px 16px',
                            background: '#fff', color: 'var(--mist)',
                            border: '0.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '12px', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  flex: 1, padding: '11px',
                  background: '#fff', color: 'var(--mist)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  flex: 2, padding: '11px',
                  background: saving ? 'var(--border)' : 'var(--slate)',
                  color: saving ? 'var(--mist)' : '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Instructor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
