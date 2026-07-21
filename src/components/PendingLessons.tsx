'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { normalizeStudentName } from '@/lib/text'
import StudentPackageHistoryModal from '@/components/StudentPackageHistoryModal'
import CheckinQRButton from '@/components/CheckinQRButton'
import SellPackageFlowModal, { type PackageOption } from '@/components/SellPackageFlowModal'
import ScheduleFromCheckinModal from '@/components/ScheduleFromCheckinModal'
import { translateModalityName } from '@/lib/modality'
import Badge from '@/components/ui/Badge'
import ChameleonButton from '@/components/ui/ChameleonButton'
import PackageProgressBar from '@/components/PackageProgressBar'
import type { Stage } from '@/lib/stage'
import type { WeatherData } from '@/lib/weather'
import { suggestKiteSizeM } from '@/lib/equipment'
import { PencilIcon, LightbulbIcon } from '@/components/nav-icons'

type ActivityRef = {
  id: string
  name: string
  default_price: number
  default_duration_min: number
}

type Checkin = {
  id: string
  student_name: string
  student_nationality: string | null
  student_email: string | null
  student_whatsapp: string | null
  document_number: string | null
  document_type: string | null
  health_condition: string | null
  emergency_name: string | null
  emergency_phone: string | null
  birthdate: string | null
  weight_kg: number | null
  checkin_at: string
  activity_id: string | null
  instructor_id: string | null
  is_minor: boolean | null
  guardian_name: string | null
  source: string | null
  partner_id: string | null
  stage: Stage | null
  checked_in: boolean
  waiver_signed_at: string | null
  equipment_notes: string | null
  activities: ActivityRef | null
  instructor: { id: string; name: string } | { id: string; name: string }[] | null
  partner: { id: string; name: string; type: string } | { id: string; name: string; type: string }[] | null
  scheduled_lesson: {
    id: string
    scheduled_at: string
    duration_min: number | null
    level: string | null
    activities: ActivityRef | null
    instructor: { id: string; name: string } | { id: string; name: string }[] | null
  } | null
}

type Instructor = {
  id: string
  name: string
  commission_pct: number | null
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza',
  })
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function unwrapInstructor(raw: Checkin['instructor']): { id: string; name: string } | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function fmtMinutes(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

function fmtRelative(iso: string, t: Record<string, string>) {
  const minutesAgo = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutesAgo < 1) return t.just_now_label
  if (minutesAgo < 60) return `${minutesAgo}${t.minutes_ago_suffix}`
  const hoursAgo = Math.floor(minutesAgo / 60)
  return `${hoursAgo}${t.hours_ago_suffix}`
}

function fmtBirthdate(iso: string | null) {
  if (!iso) return null
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Free-text equipment notes (kite size, board, harness, etc.) inside "Ver
 *  ficha" — the only editable field in an otherwise read-only modal.
 *  Deliberately its own component (not inline state in PendingLessons
 *  itself) so `key={fichaModal.id}` on its usage resets the draft cleanly
 *  when a different student's ficha opens. */
function EquipmentNotesField({ checkin, windKn }: { checkin: Checkin; windKn: number | null }) {
  const [draft, setDraft] = useState(checkin.equipment_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const dirty = draft !== (checkin.equipment_notes ?? '')

  // Rough starting point only — weight x current spot wind, generic
  // school-agnostic matrix (see lib/equipment.ts). Never writes into
  // equipment_notes itself; the operator still types the real gear below.
  const suggestion = (checkin.weight_kg != null && windKn != null)
    ? suggestKiteSizeM(checkin.weight_kg, windKn)
    : null

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/owner/checkin-stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkin.id, equipment_notes: draft }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '6px' }}>
        Notas de equipamento
      </div>
      {suggestion && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 10px', marginBottom: '8px',
          background: 'var(--color-pb-glacial-light)', color: 'var(--color-pb-glacial-dark)',
          borderRadius: 'var(--radius-md)', fontSize: '12px',
        }}>
          <LightbulbIcon size={14} />
          <span>
            Sugestão ({windKn!.toFixed(0)}kn · {checkin.weight_kg}kg): kite {suggestion.min}m – {suggestion.max}m
          </span>
        </div>
      )}
      <textarea
        value={draft}
        onChange={e => { setDraft(e.target.value); setSaved(false) }}
        placeholder="Ex: kite 9m, prancha 138cm, trapézio M"
        style={{
          width: '100%', padding: '10px 12px', border: '0.5px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--slate)',
          fontFamily: 'var(--font-sans)', outline: 'none', minHeight: '56px',
          resize: 'vertical' as const, boxSizing: 'border-box' as const,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        {saved && !dirty && <span style={{ fontSize: '11px', color: 'var(--color-pb-glacial-dark)' }}>Salvo</span>}
        <button
          onClick={save}
          disabled={saving || !dirty}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-md)', border: 'none',
            background: dirty && !saving ? 'var(--glacial)' : 'var(--border)',
            color: dirty && !saving ? '#fff' : 'var(--mist)',
            fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font-sans)',
            cursor: dirty && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

const fichaLabelStyle: CSSProperties = {
  fontSize: '10px', fontWeight: '500', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '3px',
}
const fichaInputStyle: CSSProperties = {
  width: '100%', padding: '8px 10px', border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--slate)',
  fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' as const,
}

/** The Ficha modal's header actions + info body — pulled out of the .map
 *  loop's parent so the pencil-edit toggle (top-right, next to the close
 *  ×) can sit above both the read-only rows list and its edit-mode
 *  replacement without threading state through PendingLessons itself.
 *  Editable fields are the same allowlist the API accepts
 *  (EDITABLE_TEXT_FIELDS in checkin-stage/route.ts) plus weight_kg —
 *  health_condition is encrypted server-side and stays read-only here,
 *  a fuller edit flow if that's ever needed shouldn't ride this quick form. */
function FichaModalContent({
  checkin, onClose, onSaved, t,
}: {
  checkin: Checkin
  onClose: () => void
  onSaved: (patch: Partial<Checkin>) => void
  t: Record<string, string>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({
    student_name:        checkin.student_name,
    student_whatsapp:    checkin.student_whatsapp ?? '',
    student_email:       checkin.student_email ?? '',
    student_nationality: checkin.student_nationality ?? '',
    document_number:     checkin.document_number ?? '',
    emergency_name:      checkin.emergency_name ?? '',
    emergency_phone:     checkin.emergency_phone ?? '',
    weight_kg:           checkin.weight_kg != null ? String(checkin.weight_kg) : '',
  })

  async function save() {
    setSaving(true)
    const patch: Partial<Checkin> = {
      student_name:        draft.student_name.trim() || checkin.student_name,
      student_whatsapp:    draft.student_whatsapp.trim() || null,
      student_email:       draft.student_email.trim() || null,
      student_nationality: draft.student_nationality.trim() || null,
      document_number:     draft.document_number.trim() || null,
      emergency_name:      draft.emergency_name.trim() || null,
      emergency_phone:     draft.emergency_phone.trim() || null,
      weight_kg:           draft.weight_kg.trim() ? Number(draft.weight_kg) : null,
    }
    try {
      await fetch('/api/owner/checkin-stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkin.id, ...patch }),
      })
      onSaved(patch)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '2px' }}>
            {checkin.student_name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
            Check-in {fmtTime(checkin.checkin_at)} · {fmtRelative(checkin.checkin_at, t)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => setEditing(v => !v)}
            title="Editar"
            style={{
              background: editing ? 'var(--color-pb-glacial-light)' : 'var(--powder)', border: 'none', borderRadius: '99px',
              width: '30px', height: '30px', cursor: 'pointer',
              color: editing ? 'var(--color-pb-glacial-dark)' : 'var(--mist)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <PencilIcon size={14} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'var(--powder)', border: 'none', borderRadius: '99px',
              width: '30px', height: '30px', cursor: 'pointer',
              fontSize: '14px', color: 'var(--mist)', flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '11px', fontWeight: '500',
          color: checkin.waiver_signed_at ? 'var(--color-pb-glacial-dark)' : 'var(--signal-dark)',
          background: checkin.waiver_signed_at ? 'var(--color-pb-glacial-light)' : 'var(--signal-light)',
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
        }}>
          {checkin.waiver_signed_at ? '✓ Termo de Responsabilidade Assinado' : 'Termo de Responsabilidade Pendente'}
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={fichaLabelStyle}>Nome</label>
            <input style={fichaInputStyle} value={draft.student_name}
              onChange={e => setDraft(d => ({ ...d, student_name: e.target.value }))} />
          </div>
          <div>
            <label style={fichaLabelStyle}>WhatsApp</label>
            <input style={fichaInputStyle} value={draft.student_whatsapp}
              onChange={e => setDraft(d => ({ ...d, student_whatsapp: e.target.value }))} />
          </div>
          <div>
            <label style={fichaLabelStyle}>Email</label>
            <input style={fichaInputStyle} value={draft.student_email}
              onChange={e => setDraft(d => ({ ...d, student_email: e.target.value }))} />
          </div>
          <div>
            <label style={fichaLabelStyle}>Peso (kg)</label>
            <input style={fichaInputStyle} type="number" min={1} max={300} value={draft.weight_kg}
              onChange={e => setDraft(d => ({ ...d, weight_kg: e.target.value }))} />
          </div>
          <div>
            <label style={fichaLabelStyle}>Nacionalidade</label>
            <input style={fichaInputStyle} value={draft.student_nationality}
              onChange={e => setDraft(d => ({ ...d, student_nationality: e.target.value }))} />
          </div>
          <div>
            <label style={fichaLabelStyle}>Documento</label>
            <input style={fichaInputStyle} value={draft.document_number}
              onChange={e => setDraft(d => ({ ...d, document_number: e.target.value }))} />
          </div>
          <div>
            <label style={fichaLabelStyle}>Contato de emergência</label>
            <input style={fichaInputStyle} value={draft.emergency_name}
              onChange={e => setDraft(d => ({ ...d, emergency_name: e.target.value }))} />
          </div>
          <div>
            <label style={fichaLabelStyle}>Telefone de emergência</label>
            <input style={fichaInputStyle} value={draft.emergency_phone}
              onChange={e => setDraft(d => ({ ...d, emergency_phone: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)',
                background: '#fff', color: 'var(--mist)', fontSize: '12px', fontWeight: '500',
                fontFamily: 'var(--font-sans)', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-md)', border: 'none',
                background: saving ? 'var(--border)' : 'var(--glacial)',
                color: saving ? 'var(--mist)' : '#fff',
                fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font-sans)',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'WhatsApp', value: checkin.student_whatsapp },
            { label: 'Email', value: checkin.student_email },
            { label: 'Contato de emergência', value: checkin.emergency_name },
            { label: 'Telefone de emergência', value: checkin.emergency_phone },
            { label: 'Condições de saúde', value: checkin.health_condition },
            { label: 'Peso', value: checkin.weight_kg != null ? `${checkin.weight_kg} kg` : null },
            { label: 'Nacionalidade', value: checkin.student_nationality },
            {
              label: checkin.document_type === 'cpf' ? 'CPF' : checkin.document_type === 'passport' ? 'Passaporte' : 'Documento',
              value: checkin.document_number,
            },
            { label: 'Data de nascimento', value: fmtBirthdate(checkin.birthdate) },
            { label: 'Responsável (menor de idade)', value: checkin.is_minor ? (checkin.guardian_name ?? '—') : null },
            { label: 'Origem', value: checkin.source },
          ].filter(row => row.value).map(row => (
            <div key={row.label}>
              <div style={fichaLabelStyle}>{row.label}</div>
              <div style={{ fontSize: '13px', color: 'var(--slate)' }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function PendingLessons({
  checkins: initialCheckins,
  instructors,
  activities = [],
  packageBalances = {},
  packageTypes = [],
  schoolSlug,
  schoolName,
  hoursMap,
  t,
  lang = 'pt',
  weather = null,
}: {
  checkins: Checkin[]
  instructors: Instructor[]
  activities?: ActivityRef[]
  packageBalances?: Record<string, { minutesRemaining: number; minutesPurchased?: number; hasPackage: boolean; packageSaleId?: string; packageSport?: string | null }>
  packageTypes?: PackageOption[]
  schoolSlug: string
  schoolName: string
  hoursMap?: Map<string, number>
  t: Record<string, string>
  lang?: 'en' | 'pt'
  weather?: WeatherData | null
}) {
  const router = useRouter()
  const [checkins, setCheckins]         = useState(initialCheckins)

  // checkins starts as a copy of the server prop (list rows get removed
  // locally as each gets confirmed, without waiting on a full refresh).
  // A background AutoRefresh (router.refresh()) delivers fresh
  // initialCheckins as a new prop, but that copy-once pattern means
  // nothing re-reads it unless told to — this keeps the list honest.
  useEffect(() => { setCheckins(initialCheckins) }, [initialCheckins])
  const [historyModal, setHistoryModal] = useState<{ studentName: string; packageSaleId: string } | null>(null)
  const [fichaModal, setFichaModal]     = useState<Checkin | null>(null)
  const [sellModal, setSellModal]       = useState<Checkin | null>(null)
  const [scheduleModal, setScheduleModal] = useState<Checkin | null>(null)

  // ChameleonButton's onCheckIn — desk confirms this student is physically
  // present, independent of stage/hasCredit (see checkedIn gate added to
  // ChameleonButton).
  async function checkIn(checkin: Checkin) {
    setCheckins(prev => prev.map(c => c.id === checkin.id ? { ...c, checked_in: true } : c))
    try {
      await fetch('/api/owner/checkin-stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkin.id, checked_in: true }),
      })
    } catch {}
  }

  // Removes the checkin row outright — for clearing duplicates/no-shows
  // out of Aguardando Vento, not a stage transition. Confirms first since
  // this is destructive and, unlike the other actions here, can't be
  // undone from the UI.
  async function removeCheckin(checkin: Checkin) {
    if (!window.confirm(`Remover o check-in de ${checkin.student_name}? Essa ação não pode ser desfeita.`)) return
    setCheckins(prev => prev.filter(c => c.id !== checkin.id))
    try {
      await fetch(`/api/owner/checkin-stage?id=${checkin.id}`, { method: 'DELETE' })
    } catch {}
  }

  // Keeps the compact card (checkins) and the open Ficha modal (its own
  // separate snapshot, set once via setFichaModal) in sync after a quick
  // edit — otherwise the modal would show stale values until the next
  // AutoRefresh-driven prop update.
  function updateFichaFields(id: string, patch: Partial<Checkin>) {
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    setFichaModal(prev => prev && prev.id === id ? { ...prev, ...patch } : prev)
  }

  return (
    <>
      <div style={{ marginBottom: '28px' }}>

        {/* Header (and its QR button) always renders, even with an empty
            Aguardando Vento — that's exactly when reception hands a new
            arrival the QR code, so it can't be gated behind checkins.length. */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {t.waiting_room_title}
            <span style={{
              background: 'var(--signal)',
              color: '#fff',
              fontSize: '10px', fontWeight: '600',
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0',
              textTransform: 'none',
            }}>
              {checkins.length}
            </span>
          </div>
        </div>

        {checkins.length === 0 ? (
          <div style={{
            background: '#fff',
            border: '0.5px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'center',
            fontSize: '13px', color: 'var(--mist)',
          }}>
            {t.no_checkins_waiting}
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {checkins.map(checkin => {
            const instructor = unwrapInstructor(checkin.instructor)
            const balanceKey = normalizeStudentName(checkin.student_name)
            const balance    = packageBalances[balanceKey]
            const exhausted  = balance?.hasPackage && balance.minutesRemaining <= 0
            const lastLesson = balance?.hasPackage && balance.minutesRemaining > 0 && balance.minutesRemaining <= 60

            // Fallback when this checkin's own activity_id is null but the
            // student has an active package for a specific sport — mainly
            // covers checkins already broken before ensureActiveCheckinFor
            // Today started backfilling activity_id at creation time (see
            // scheduledLessonRepository.ts). Same normalize+startsWith
            // match as lib/modality.ts.
            const fallbackActivityId = (!checkin.activity_id && balance?.packageSport)
              ? activities.find(a => {
                  const n = a.name.toLowerCase().replace(/[^a-z]/g, '')
                  const s = balance.packageSport!.toLowerCase().replace(/[^a-z]/g, '')
                  return n.startsWith(s)
                })?.id ?? null
              : null
            // Raw/untranslated either way (checkin.activities.name or the
            // package's sport key) — translateModalityName is applied once
            // at each render site below, same as before this fallback existed.
            const displayActivityName = checkin.activities?.name ?? balance?.packageSport ?? null

            // Card layout follows picobase_design_system_dossie.md Fase 4's
            // Aguardando Vento spec. Per
            // fix_checkin_removido_e_estagio_errado.md, the button row
            // (ChameleonButton + Agendar aula + Ver ficha) sits below the
            // badge row, full card width — NOT in the avatar row's
            // top-right corner (that placement hid Check-in and read as
            // "Iniciar Velejo" in the wrong spot).
            const hasCredit = !!balance?.hasPackage && !exhausted
            const creditBadgeText = lastLesson
              ? `${t.package_last_lesson_badge} · ${fmtMinutes(balance?.minutesRemaining ?? 0)} ${t.package_remaining_singular}`
              : `${fmtMinutes(balance?.minutesRemaining ?? 0)} ${t.package_remaining_badge}`

            return (
              <div
                key={checkin.id}
                style={{
                  background: '#fff',
                  // #E4E2DB (pb-border), not --border (#E6E5E2) — exact hex
                  // from the approved mockup, a subtly different gray.
                  border: checkin.health_condition ? '0.5px solid var(--signal)' : '0.5px solid var(--color-pb-border)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                {/* Avatar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: 'var(--radius-full)',
                    // Avatar color reflects health-condition alert first,
                    // then hasCredit — a student with no active package
                    // gets the neutral powder/slate pair, not the
                    // "termo assinado" green (that color means status, not
                    // decoration, per the approved mockup).
                    background: checkin.health_condition ? 'var(--signal-light)' : hasCredit ? 'var(--color-pb-glacial-light)' : 'var(--color-pb-powder)',
                    color: checkin.health_condition ? 'var(--signal-dark)' : hasCredit ? 'var(--color-pb-glacial-dark)' : 'var(--color-pb-slate)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '500',
                    flexShrink: 0,
                  }}
                    title={checkin.student_nationality ?? undefined}
                  >
                    {getInitials(checkin.student_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: '500',
                      // pb-slate (#1A1C22), not the older --slate (#0D0F14)
                      // — exact hex from the approved mockup.
                      color: 'var(--color-pb-slate)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {checkin.student_name}
                      </span>
                      {checkin.is_minor && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '1px 6px', borderRadius: 'var(--radius-md)',
                          background: '#FFFBEB', color: '#B45309',
                          fontSize: '10px', fontWeight: '600', flexShrink: 0,
                        }}>
                          {t.minor_badge}
                        </span>
                      )}
                      {checkin.health_condition && (
                        <span style={{
                          fontSize: '9px', fontWeight: '500',
                          color: 'var(--signal-dark)', background: 'var(--signal-light)',
                          padding: '1px 6px', borderRadius: 'var(--radius-full)', flexShrink: 0,
                        }}>
                          {t.health_label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-pb-mist)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayActivityName ? translateModalityName(displayActivityName, lang) : t.no_activity_label}
                      {' · '}
                      {instructor?.name ?? t.no_instructor_label}
                      {' · '}
                      <span title={fmtTime(checkin.checkin_at)}>{fmtRelative(checkin.checkin_at, t)}</span>
                    </div>
                  </div>
                  {/* All card actions live here now, top-right, next to
                      the avatar/name — not a separate full-width bar
                      below the badges. ChameleonButton's own compact
                      Check-in state was retired (see ChameleonButton.tsx)
                      since it duplicated this row's own Check-in chip once
                      that chip was promoted out of Ver ficha; the chip now
                      does both jobs (open the QR AND mark checked_in). */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <ChameleonButton
                      stage={checkin.stage ?? 'sala_de_espera'}
                      checkedIn={checkin.checked_in}
                      hasCredit={hasCredit}
                      slug={schoolSlug}
                      schoolName={schoolName}
                      studentName={checkin.student_name}
                      activityName={displayActivityName}
                      onCheckIn={() => checkIn(checkin)}
                      onSellPackage={() => setSellModal(checkin)}
                      className=""
                    />
                    {/* Byte-for-byte the same recipe as Reagendar
                        (MissedLessons.tsx) — var(--glacial-light)/
                        var(--glacial-dark), not an approximated zinc-*
                        Tailwind class. */}
                    <button
                      onClick={() => setScheduleModal({ ...checkin, activity_id: checkin.activity_id ?? fallbackActivityId })}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--glacial-light)',
                        color: 'var(--glacial-dark)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '10px', fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        transition: 'background-color 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--glacial)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--glacial-light)'; e.currentTarget.style.color = 'var(--glacial-dark)' }}
                    >
                      {t.schedule_lesson_btn}
                    </button>
                    {/* Always-available "show QR again" trigger — also
                        the only Check-in trigger now (see comment above);
                        onOpen still marks checked_in the same way
                        ChameleonButton's retired compact state used to. */}
                    <CheckinQRButton
                      slug={schoolSlug}
                      schoolName={schoolName}
                      studentName={checkin.student_name}
                      activityName={displayActivityName}
                      onOpen={() => checkIn(checkin)}
                      chip
                    />
                    <button
                      onClick={() => setFichaModal(checkin)}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--glacial-light)',
                        color: 'var(--glacial-dark)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '10px', fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        transition: 'background-color 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--glacial)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--glacial-light)'; e.currentTarget.style.color = 'var(--glacial-dark)' }}
                    >
                      {t.view_ficha_full_btn}
                    </button>
                    {/* Removes the checkin outright — for clearing
                        duplicates/no-shows, not a stage transition like
                        everything else in this row. */}
                    <button
                      onClick={() => removeCheckin(checkin)}
                      title="Remover check-in"
                      aria-label="Remover check-in"
                      className="text-zinc-400 hover:text-red-600 transition-colors p-1 rounded-md bg-transparent border-0 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {checkin.waiver_signed_at ? (
                    <Badge variant="success">✓ {t.waiver_signed_badge}</Badge>
                  ) : (
                    <Badge variant="danger">{t.waiver_pending_badge}</Badge>
                  )}
                  {hasCredit ? (
                    balance?.packageSaleId ? (
                      <button
                        type="button"
                        onClick={() => setHistoryModal({
                          studentName: checkin.student_name,
                          packageSaleId: balance.packageSaleId!,
                        })}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'opacity 0.15s', lineHeight: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                        title={t.view_package_history_title}
                      >
                        <Badge variant="neutral">{creditBadgeText}</Badge>
                      </button>
                    ) : (
                      <Badge variant="neutral">{creditBadgeText}</Badge>
                    )
                  ) : (
                    <Badge variant="danger">{t.no_credits_badge}</Badge>
                  )}
                </div>

                {/* Graphical complement to the "Xh restantes" badge above —
                    the text stays as the precise reading, this just adds an
                    at-a-glance visual for hours consumed vs. total. */}
                {hasCredit && balance?.minutesPurchased ? (
                  <div style={{ marginBottom: '4px' }}>
                    <PackageProgressBar
                      pctUsed={((balance.minutesPurchased - balance.minutesRemaining) / balance.minutesPurchased) * 100}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        )}
      </div>

      {historyModal && (
        <StudentPackageHistoryModal
          studentName={historyModal.studentName}
          packageSaleId={historyModal.packageSaleId}
          onClose={() => setHistoryModal(null)}
        />
      )}

      {sellModal && (
        <SellPackageFlowModal
          packageTypes={packageTypes}
          initialStudentName={sellModal.student_name}
          onClose={() => setSellModal(null)}
          onSold={() => { setSellModal(null); router.refresh() }}
        />
      )}

      {scheduleModal && (
        <ScheduleFromCheckinModal
          checkinId={scheduleModal.id}
          studentName={scheduleModal.student_name}
          activities={activities}
          instructors={instructors}
          initialActivityId={scheduleModal.activity_id}
          initialInstructorId={scheduleModal.instructor_id}
          lang={lang}
          onClose={() => setScheduleModal(null)}
          onScheduled={() => { setScheduleModal(null); router.refresh() }}
        />
      )}

      {fichaModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setFichaModal(null) }}
        >
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '440px',
            padding: '28px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* key={fichaModal.id} resets the header's editing state (and
                edit-form drafts) if a different student's ficha is ever
                opened without a full unmount in between. The QR/"show
                check-in link again" trigger that used to live in this
                header moved to the always-visible chip on the card itself
                (see the .map loop above) — showing it here too was
                redundant once that promotion happened. */}
            <FichaModalContent
              key={fichaModal.id}
              checkin={fichaModal}
              onClose={() => setFichaModal(null)}
              onSaved={patch => updateFichaFields(fichaModal.id, patch)}
              t={t}
            />

            {/* key={fichaModal.id} forces a fresh mount (and fresh draft
                state) whenever a different student's ficha opens — this
                component's own useState wouldn't otherwise reset. */}
            <EquipmentNotesField key={fichaModal.id} checkin={fichaModal} windKn={weather?.windSpeedKn ?? null} />

            <button
              onClick={() => setFichaModal(null)}
              style={{
                width: '100%', marginTop: '24px', padding: '11px',
                background: '#fff', color: 'var(--mist)',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
