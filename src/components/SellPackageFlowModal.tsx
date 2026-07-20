'use client'

import { useState, useEffect, useRef } from 'react'

export type PackageOption = {
  id: string
  name: string
  sport: string | null
  total_minutes: number
  base_price: number | null
  final_price: number | null
}

type FoundStudent = {
  id: string
  name: string
  whatsapp: string | null
  document_number?: string | null
  document_type?: string | null
}

function documentLabel(type: string | null | undefined) {
  return type === 'cpf' ? 'CPF' : type === 'passport' ? 'Passaporte' : 'Documento'
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(n)
}

function fmtH(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

function packagePrice(pkg: PackageOption) {
  return pkg.final_price ?? pkg.base_price ?? 0
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
}

/** Unified sell-package entry point — opened either from the Spot
 *  "Venda Rápida" card (no student known yet, full name search same as
 *  AddBookingModal) or from an Aguardando Vento card whose student has no
 *  active credits (initialStudentName pre-fills and locks the name, since
 *  the checkin already identifies who it is). Both paths post to the same
 *  api/owner/sell-package, which find-or-creates the students row by name —
 *  same convention as SellPackageButton on the Pacotes page. */
export default function SellPackageFlowModal({
  packageTypes,
  initialStudentName,
  onClose,
  onSold,
}: {
  packageTypes: PackageOption[]
  initialStudentName?: string
  onClose: () => void
  onSold: () => void
}) {
  const locked = !!initialStudentName

  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState<FoundStudent[]>([])
  const [searching, setSearching]     = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<FoundStudent | null>(null)
  const [manualMode, setManualMode]   = useState(false)
  const [manualName, setManualName]   = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [packageId, setPackageId] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (locked) return
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
        .then(data => { setResults(data.students ?? []); setShowResults(true) })
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, locked])

  const studentName = locked
    ? initialStudentName!
    : selectedStudent?.name ?? manualName.trim()

  const canSave = !saving
    && packageId !== ''
    && (locked || selectedStudent != null || (manualMode && manualName.trim().length >= 2))

  async function submit() {
    if (!canSave) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/owner/sell-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: packageId, student_name: studentName }),
    })

    const data = await res.json()
    setSaving(false)

    if (data.ok) {
      onSold()
    } else {
      setError(data.error ?? 'Erro ao registrar venda')
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 250, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '440px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '20px' }}>
          Nova venda de pacote
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {locked ? (
            <div>
              <label style={labelStyle}>Cliente</label>
              <div style={{
                padding: '12px 14px', background: 'var(--glacial-light)',
                border: '1px solid var(--glacial)', borderRadius: 'var(--radius-md)',
                fontSize: '14px', fontWeight: '600', color: 'var(--slate)',
              }}>
                {initialStudentName}
              </div>
            </div>
          ) : !manualMode ? (
            <div>
              <label style={labelStyle}>Buscar cliente (Nome ou CPF/Passaporte)</label>

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
                      {selectedStudent.document_number && (
                        <> · {documentLabel(selectedStudent.document_type)}: {selectedStudent.document_number}</>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
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
                    placeholder="Nome ou CPF/Passaporte..."
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
                          onMouseDown={() => { setSelectedStudent(s); setQuery(''); setResults([]); setShowResults(false) }}
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
                            {s.document_number && (
                              <> · {documentLabel(s.document_type)}: {s.document_number}</>
                            )}
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
                + Venda avulsa (cliente não cadastrado)
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={labelStyle}>Venda avulsa</span>
                <button
                  type="button"
                  onClick={() => { setManualMode(false); setManualName('') }}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'var(--glacial-dark)', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', textDecoration: 'underline',
                  }}
                >
                  Buscar cliente cadastrado
                </button>
              </div>
              <label style={labelStyle}>Nome completo *</label>
              <input
                style={inputStyle}
                type="text"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="Nome do cliente"
                autoFocus
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Pacote</label>
            {packageTypes.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
                Nenhum pacote cadastrado — crie um em Pacotes primeiro.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {packageTypes.map(pkg => {
                  const active = packageId === pkg.id
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setPackageId(pkg.id)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', textAlign: 'left',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${active ? 'var(--glacial)' : 'var(--border)'}`,
                        background: active ? 'var(--glacial-light)' : '#fff',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                          {fmtH(pkg.total_minutes)}{pkg.sport ? ` · ${pkg.sport}` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(packagePrice(pkg))}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
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
            onClick={submit}
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
            {saving ? 'Registrando...' : 'Registrar venda'}
          </button>
        </div>
      </div>
    </div>
  )
}
