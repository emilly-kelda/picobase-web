'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GeneralSettingsModal from './GeneralSettingsModal'
import FinancialSettingsModal from './FinancialSettingsModal'
import SeasonsModal from './SeasonsModal'
import WaiverModal from './WaiverModal'

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
  waiver_type: string | null
  waiver_file_global_url: string | null
  waiver_files_by_lang: Record<string, string> | null
}

type Season = {
  id: string
  label: string
  start_date: string
  end_date: string
  burn_rate: number
}

type ModalKey = 'general' | 'financial' | 'seasons' | 'waiver'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0,
  }).format(n)
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'var(--font-sans)',
  transition: 'border-color 0.15s',
}

export default function SettingsClient({
  school: initialSchool,
  seasons: initialSeasons,
  currentLang,
}: {
  school: School
  seasons: Season[]
  currentLang: string
}) {
  const router = useRouter()
  const [school, setSchool]   = useState(initialSchool)
  const [seasons, setSeasons] = useState(initialSeasons)
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null)

  // Every modal only ever writes its own slice, then patches that same
  // slice into local state and refreshes the server-rendered parts of the
  // page (the launch checklist) — no other card's data is touched.
  function closeAndRefresh() {
    setActiveModal(null)
    router.refresh()
  }

  const waiverCount = [school.waiver_en, school.waiver_pt, school.waiver_fr, school.waiver_es]
    .filter(w => w && w.trim().length > 0).length
  const waiverFileCount = Object.keys(school.waiver_files_by_lang ?? {}).length
    + (school.waiver_file_global_url ? 1 : 0)
  const waiverSummary = school.waiver_type === 'file'
    ? `${waiverFileCount} arquivo${waiverFileCount !== 1 ? 's' : ''}`
    : `${waiverCount}/4 idiomas`

  const cards: Array<{ key: ModalKey; title: string; summary: string; sub: string }> = [
    {
      key: 'general',
      title: 'Geral',
      summary: school.name,
      sub: `${school.country || '—'} · ${school.language.toUpperCase()}`,
    },
    {
      key: 'financial',
      title: 'Financeiro',
      summary: school.burn_rate ? fmt(school.burn_rate) : 'Não definido',
      sub: 'Custo operacional mensal',
    },
    {
      key: 'seasons',
      title: 'Temporadas',
      summary: `${seasons.length} temporada${seasons.length !== 1 ? 's' : ''}`,
      sub: seasons[0]?.label ?? 'Nenhuma cadastrada',
    },
    {
      key: 'waiver',
      title: 'Waiver',
      summary: waiverSummary,
      sub: 'Termo de responsabilidade',
    },
  ]

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px',
      }}>
        {cards.map(card => (
          <button
            key={card.key}
            onClick={() => setActiveModal(card.key)}
            style={cardStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <div style={{
              fontSize: '11px', fontWeight: '500',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '10px',
            }}>
              {card.title}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--slate)', marginBottom: '4px' }}>
              {card.summary}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
              {card.sub}
            </div>
          </button>
        ))}
      </div>

      {activeModal === 'general' && (
        <GeneralSettingsModal
          school={school}
          currentLang={currentLang}
          onClose={() => setActiveModal(null)}
          onSaved={patch => { setSchool(s => ({ ...s, ...patch })); closeAndRefresh() }}
        />
      )}

      {activeModal === 'financial' && (
        <FinancialSettingsModal
          burnRate={school.burn_rate}
          onClose={() => setActiveModal(null)}
          onSaved={burnRate => { setSchool(s => ({ ...s, burn_rate: burnRate })); closeAndRefresh() }}
        />
      )}

      {activeModal === 'seasons' && (
        <SeasonsModal
          seasons={seasons}
          onClose={() => { setActiveModal(null); router.refresh() }}
          onSaved={updated => setSeasons(prev => prev.map(s => s.id === updated.id ? updated : s))}
        />
      )}

      {activeModal === 'waiver' && (
        <WaiverModal
          waivers={{
            waiver_en: school.waiver_en,
            waiver_pt: school.waiver_pt,
            waiver_fr: school.waiver_fr,
            waiver_es: school.waiver_es,
            waiver_type: school.waiver_type,
            waiver_file_global_url: school.waiver_file_global_url,
            waiver_files_by_lang: school.waiver_files_by_lang,
          }}
          onClose={() => setActiveModal(null)}
          onSaved={patch => { setSchool(s => ({ ...s, ...patch })); closeAndRefresh() }}
        />
      )}
    </div>
  )
}
