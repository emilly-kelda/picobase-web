'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type School = {
  id: string
  name: string
  slug: string
  burn_rate: number | null
  currency: string
  language: string
  sport_types: string[] | null
  country: string | null
  waiver_en: string | null
  waiver_pt: string | null
  waiver_fr: string | null
  waiver_es: string | null
}

type Season = {
  id: string
  label: string
  start_date: string
  end_date: string
  burn_rate: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
  color: 'var(--slate)',
  background: '#fff',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: '500' as const,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'var(--mist)',
  marginBottom: '6px',
  display: 'block',
}

const sectionStyle = {
  background: '#fff',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  marginBottom: '20px',
}

const sectionHeaderStyle = {
  padding: '16px 24px',
  borderBottom: '0.5px solid var(--border)',
  fontSize: '14px',
  fontWeight: '500' as const,
  color: 'var(--slate)',
}

const sectionBodyStyle = {
  padding: '24px',
}

export default function SettingsClient({
  school: initialSchool,
  seasons: initialSeasons,
}: {
  school: School
  seasons: Season[]
}) {
  const router = useRouter()
  const [school, setSchool] = useState(initialSchool)
  const [seasons, setSeasons] = useState(initialSeasons)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  async function saveSchool() {
    setSaving('school')
    const res = await fetch('/api/owner/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:      'school',
        name:      school.name,
        burn_rate: school.burn_rate,
        language:  school.language,
        country:   school.country,
        waiver_en: school.waiver_en,
        waiver_pt: school.waiver_pt,
        waiver_fr: school.waiver_fr,
        waiver_es: school.waiver_es,
      }),
    })
    const data = await res.json()
    setSaving(null)
    if (data.ok) {
      setSaved('school')
      setTimeout(() => setSaved(null), 2000)
      router.refresh()
    }
  }

  async function saveSeason(season: Season) {
    setSaving(season.id)
    const res = await fetch('/api/owner/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:       'season',
        id:         season.id,
        label:      season.label,
        start_date: season.start_date,
        end_date:   season.end_date,
        burn_rate:  season.burn_rate,
      }),
    })
    const data = await res.json()
    setSaving(null)
    if (data.ok) {
      setSaved(season.id)
      setTimeout(() => setSaved(null), 2000)
      router.refresh()
    }
  }

  const btnStyle = (id: string) => ({
    padding: '9px 20px',
    background: saving === id ? 'var(--mist)' : 'var(--slate)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: '500' as const,
    cursor: saving === id ? 'not-allowed' as const : 'pointer' as const,
    fontFamily: 'var(--font-sans)',
    opacity: saving === id ? 0.7 : 1,
  })

  return (
    <div style={{ maxWidth: '720px' }}>

      {/* School settings */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>School</div>
        <div style={sectionBodyStyle}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}>
            <div>
              <label style={labelStyle}>School name</label>
              <input
                style={inputStyle}
                value={school.name}
                onChange={e => setSchool(s => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input
                style={inputStyle}
                value={school.country ?? ''}
                placeholder="BR"
                onChange={e => setSchool(s => ({ ...s, country: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Language</label>
              <select
                style={inputStyle}
                value={school.language}
                onChange={e => setSchool(s => ({ ...s, language: e.target.value }))}
              >
                <option value="pt">Portuguese</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                Monthly burn rate
                <span style={{ marginLeft: '6px', color: 'var(--glacial)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>
                  {school.burn_rate ? fmt(school.burn_rate) : '—'}
                </span>
              </label>
              <input
                style={inputStyle}
                type="number"
                value={school.burn_rate ?? ''}
                placeholder="5000"
                onChange={e => setSchool(s => ({ ...s, burn_rate: Number(e.target.value) }))}
              />
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
                Fixed monthly costs during off-season. Used to calculate Off-Season Runway.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={saveSchool}
              disabled={saving === 'school'}
              style={btnStyle('school')}
            >
              {saving === 'school' ? 'Saving...' : 'Save school settings'}
            </button>
            {saved === 'school' && (
              <span style={{ fontSize: '13px', color: 'var(--glacial-dark)' }}>
                Saved
              </span>
            )}
          </div>

          <div style={{ borderTop: '0.5px solid var(--border)', marginTop: '24px', paddingTop: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
              Liability Waiver Text
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '16px', lineHeight: '1.5' }}>
              Each language version is shown to students during check-in based on
              their language selection. Edit with your legal counsel.
            </div>

            {[
              { key: 'waiver_en', label: '???? English'    },
              { key: 'waiver_pt', label: '???? Portuguese' },
              { key: 'waiver_fr', label: '???? French'     },
              { key: 'waiver_es', label: '???? Spanish'    },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{label}</label>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: '120px',
                    resize: 'vertical' as const,
                    lineHeight: '1.6',
                    fontSize: '13px',
                  }}
                  value={(school as any)[key] ?? ''}
                  onChange={e => setSchool(s => ({ ...s, [key]: e.target.value }))}
                  placeholder={`Waiver text in ${label}...`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seasons */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Seasons</div>
        <div style={{ padding: '8px 0' }}>
          {seasons.length === 0 ? (
            <div style={{
              padding: '32px 24px', textAlign: 'center',
              fontSize: '13px', color: 'var(--mist)',
            }}>
              No seasons configured.
            </div>
          ) : (
            seasons.map((season, i) => (
              <div key={season.id} style={{
                padding: '20px 24px',
                borderBottom: i < seasons.length - 1
                  ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '14px',
                }}>
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input
                      style={inputStyle}
                      value={season.label}
                      onChange={e => setSeasons(prev =>
                        prev.map(s => s.id === season.id
                          ? { ...s, label: e.target.value } : s)
                      )}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Start date</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={season.start_date}
                      onChange={e => setSeasons(prev =>
                        prev.map(s => s.id === season.id
                          ? { ...s, start_date: e.target.value } : s)
                      )}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>End date</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={season.end_date}
                      onChange={e => setSeasons(prev =>
                        prev.map(s => s.id === season.id
                          ? { ...s, end_date: e.target.value } : s)
                      )}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Burn rate / month</label>
                    <input
                      style={inputStyle}
                      type="number"
                      value={season.burn_rate}
                      onChange={e => setSeasons(prev =>
                        prev.map(s => s.id === season.id
                          ? { ...s, burn_rate: Number(e.target.value) } : s)
                      )}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => saveSeason(season)}
                    disabled={saving === season.id}
                    style={btnStyle(season.id)}
                  >
                    {saving === season.id ? 'Saving...' : 'Save season'}
                  </button>
                  {saved === season.id && (
                    <span style={{ fontSize: '13px', color: 'var(--glacial-dark)' }}>
                      Saved
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Read-only system info */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>System info</div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'School ID', value: initialSchool.id                           },
            { label: 'Slug',      value: initialSchool.slug                         },
            { label: 'Currency',  value: initialSchool.currency                     },
            { label: 'Sports',    value: initialSchool.sport_types?.join(', ') ?? '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
              <span style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--mist)', width: '80px', flexShrink: 0,
              }}>
                {item.label}
              </span>
              <span style={{
                fontSize: '12px', fontFamily: 'var(--font-mono)',
                color: 'var(--slate)',
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

