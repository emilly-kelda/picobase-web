'use client'

import { useState, useEffect, useRef } from 'react'

type Activity = {
  id: string
  name: string
}

type FoundStudent = {
  id: string
  name: string
  whatsapp: string | null
}

function generateHourlySlots(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
  }
  return slots
}

const TIME_SLOTS = generateHourlySlots(7, 17)

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  color: 'var(--slate)',
  background: '#fff',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--mist)',
  display: 'block',
  marginBottom: '6px',
}

/** Reception looks up a customer who already filled the public check-in/
 *  waiver form on their own phone (that flow find-or-creates a students
 *  row — see api/checkin/route.ts) instead of re-typing their name and
 *  WhatsApp. "Cadastrar novo cliente manualmente" stays as the fallback
 *  for someone who hasn't done that yet. Note: search is by name only —
 *  this app doesn't collect CPF anywhere (not in students, not at
 *  check-in), so a CPF search field would have nothing to search against;
 *  that'd need to be added to the check-in form first if wanted. */
export default function AddBookingModal({
  schoolSlug,
  activities,
  onClose,
  onCreated,
}: {
  schoolSlug: string
  activities: Activity[]
  onClose: () => void
  onCreated: () => void
}) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<FoundStudent[]>([])
  const [searching, setSearching]   = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<FoundStudent | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    student_name:   '',
    whatsapp:       '',
    activity_id:    '',
    preferred_date: '',
    preferred_time: '',
    notes:          '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true)
      fetch(`/api/owner/students?q=${encodeURIComponent(query.trim())}`)
        .then(r => r.json())
        .then(data => {
          setResults(data.students ?? [])
          setShowResults(true)
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function selectStudent(student: FoundStudent) {
    setSelectedStudent(student)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  function clearSelection() {
    setSelectedStudent(null)
  }

  const canSave = (selectedStudent != null || (manualMode && form.student_name.trim().length >= 2 && form.whatsapp.replace(/\D/g, '').length >= 8))
    && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id:     selectedStudent?.id ?? null,
          student_name:   selectedStudent ? undefined : form.student_name,
          whatsapp:       selectedStudent ? undefined : form.whatsapp,
          activity_id:    form.activity_id || null,
          preferred_date: form.preferred_date || null,
          preferred_time: form.preferred_time || null,
          notes:          form.notes || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        onCreated()
      } else {
        setError(data.error ?? 'Não foi possível registrar a reserva.')
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
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '440px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          fontSize: '18px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '20px',
        }}>
          Nova reserva
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {!manualMode ? (
            <div>
              <label style={labelStyle}>Buscar cliente cadastrado</label>

              {selectedStudent ? (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', background: 'var(--glacial-light)',
                  border: '1px solid var(--glacial)', borderRadius: 'var(--radius-md)',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)' }}>
                      {selectedStudent.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--glacial-dark)' }}>
                      {selectedStudent.whatsapp || 'Sem WhatsApp cadastrado'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    style={{
                      background: 'none', border: 'none', padding: '4px 8px',
                      color: 'var(--mist)', fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', textDecoration: 'underline',
                    }}
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    style={inputStyle}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setShowResults(true) }}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    placeholder="Nome do cliente..."
                    autoFocus
                  />
                  {searching && (
                    <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
                      Buscando...
                    </div>
                  )}
                  {showResults && results.length > 0 && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: '#fff', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-md)', zIndex: 50,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      maxHeight: '220px', overflowY: 'auto',
                    }}>
                      {results.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={() => selectStudent(s)}
                          style={{
                            width: '100%', padding: '10px 14px', cursor: 'pointer',
                            border: 'none', background: 'transparent',
                            borderBottom: '0.5px solid var(--border)',
                            textAlign: 'left', fontFamily: 'var(--font-sans)',
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                            {s.whatsapp || 'Sem WhatsApp cadastrado'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showResults && results.length === 0 && !searching && query.trim().length >= 2 && (
                    <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '6px' }}>
                      Nenhum cliente encontrado com esse nome.
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setManualMode(true)}
                style={{
                  marginTop: '10px', background: 'none', border: 'none', padding: 0,
                  color: 'var(--mist)', fontSize: '12px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', textDecoration: 'underline',
                }}
              >
                + Cadastrar novo cliente manualmente
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)' }}>
                  Novo cliente
                </span>
                <button
                  type="button"
                  onClick={() => { setManualMode(false); setForm(f => ({ ...f, student_name: '', whatsapp: '' })) }}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'var(--glacial-dark)', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', textDecoration: 'underline',
                  }}
                >
                  Buscar cliente cadastrado
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nome completo *</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={form.student_name}
                    onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
                    placeholder="Nome do cliente"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp *</label>
                  <input
                    style={inputStyle}
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="+55 85 99999-9999"
                  />
                </div>
              </div>
            </div>
          )}

          {activities.length > 0 && (
            <div>
              <label style={labelStyle}>Atividade</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.activity_id}
                onChange={e => setForm(f => ({ ...f, activity_id: e.target.value }))}
              >
                <option value="">Selecionar</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Data preferida</label>
              <input
                style={inputStyle}
                type="date"
                value={form.preferred_date}
                onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Horário</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.preferred_time}
                onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))}
              >
                <option value="">Selecionar</option>
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Observações</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Opcional..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
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

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
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
            disabled={!canSave}
            style={{
              flex: 2, padding: '11px',
              background: canSave ? 'var(--slate)' : 'var(--border)',
              color: canSave ? '#fff' : 'var(--mist)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Salvando...' : 'Adicionar reserva'}
          </button>
        </div>
      </div>
    </div>
  )
}
