'use client'

import { useRef, useState, useEffect } from 'react'

const LANGS = {
  en: {
    code: 'en', label: 'English', flag: '🇬🇧',
    q_name: "What's your name?",
    q_activity: "What's your activity?",
    q_source: 'How did you find us?',
    name: 'Full name',
    nationality: 'Nationality',
    other: 'Other',
    no_preference: 'No preference',
    skip: 'Skip',
    email: 'Email',
    whatsapp: 'WhatsApp',
    activity: 'Activity',
    instructor: 'Instructor',
    health_q: 'Do you have any medical conditions we should know about?',
    health_placeholder: 'E.g. asthma, heart condition, recent injury...',
    no_conditions: 'No medical conditions',
    has_conditions: 'Yes — I have a condition to declare',
    emergency: 'Emergency contact',
    emergency_name: 'Contact name',
    emergency_phone: 'Contact phone',
    waiver_title: 'Terms and conditions',
    waiver_text: 'I understand that water sports involve inherent risks including injury or death. I voluntarily participate and release the school, instructors, and staff from liability for accidents or injuries during my participation. I confirm that I am physically fit to participate and that all information provided is accurate.',
    sign_below: 'Sign below',
    clear: 'Clear',
    i_agree: 'I have read and agree to the waiver above',
    submit: 'Complete check-in ✓',
    submitting: 'Submitting...',
    success_title: 'Check-in complete!',
    success_sub: 'Time to fly! 🪁',
    next: 'Next',
    back: 'Back',
    dob: 'Date of birth',
    gdpr: 'I consent to my personal data being processed for the purpose of this activity.',
    waiver_points: ['Water sports involve inherent risks', 'Participation is voluntary', 'I am physically fit to participate', 'All information provided is accurate'],
    package_active: 'Active package',
    package_left: 'left',
    package_empty: 'No hours remaining',
    powered_by: 'Powered by',
  },
  pt: {
    code: 'pt', label: 'Português', flag: '🇧🇷',
    q_name: 'Qual é o seu nome?',
    q_activity: 'Qual atividade hoje?',
    q_source: 'Como você chegou até nós?',
    name: 'Nome completo',
    nationality: 'Nacionalidade',
    other: 'Outro',
    no_preference: 'Sem preferência',
    skip: 'Pular',
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    activity: 'Atividade',
    instructor: 'Instrutor',
    health_q: 'Você tem alguma condição médica que devemos saber?',
    health_placeholder: 'Ex: asma, problema cardíaco, lesão recente...',
    no_conditions: 'Nenhuma condição médica',
    has_conditions: 'Sim — tenho uma condição a declarar',
    emergency: 'Contato de emergência',
    emergency_name: 'Nome do contato',
    emergency_phone: 'Telefone do contato',
    waiver_title: 'Termos e condições',
    waiver_text: 'Compreendo que os esportes aquáticos envolvem riscos inerentes, incluindo lesões ou morte. Participo voluntariamente e isento a escola, instrutores e equipe de responsabilidade por acidentes durante minha participação. Confirmo que estou fisicamente apto a participar e que todas as informações fornecidas são verdadeiras.',
    sign_below: 'Assine abaixo',
    clear: 'Limpar',
    i_agree: 'Li e concordo com o termo acima',
    submit: 'Fazer check-in ✓',
    submitting: 'Enviando...',
    success_title: 'Check-in feito!',
    success_sub: 'Bora pro vento! 🪁',
    next: 'Próximo',
    back: 'Voltar',
    dob: 'Data de nascimento',
    gdpr: 'Consinto com o tratamento dos meus dados pessoais para a finalidade desta atividade (LGPD).',
    waiver_points: ['Esportes aquáticos envolvem riscos inerentes', 'Participo voluntariamente', 'Estou fisicamente apto a participar', 'Todas as informações fornecidas são verdadeiras'],
    package_active: 'Pacote ativo',
    package_left: 'restantes',
    package_empty: 'Sem horas restantes',
    powered_by: 'Desenvolvido por',
  },
  fr: {
    code: 'fr', label: 'Français', flag: '🇫🇷',
    q_name: 'Quel est votre nom?',
    q_activity: "Quelle activité aujourd'hui ?",
    q_source: 'Comment nous avez-vous trouvés ?',
    name: 'Nom complet',
    nationality: 'Nationalité',
    other: 'Autre',
    no_preference: 'Aucune préférence',
    skip: 'Passer',
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    activity: 'Activité',
    instructor: 'Instructeur',
    health_q: 'Avez-vous des conditions médicales que nous devrions connaître?',
    health_placeholder: 'Ex: asthme, problème cardiaque, blessure récente...',
    no_conditions: 'Aucune condition médicale',
    has_conditions: 'Oui — j\'ai une condition à déclarer',
    emergency: "Contact d'urgence",
    emergency_name: 'Nom du contact',
    emergency_phone: 'Téléphone du contact',
    waiver_title: 'Conditions générales',
    waiver_text: "Je comprends que les sports nautiques comportent des risques inhérents incluant des blessures ou la mort. Je participe volontairement et décharge l'école, les instructeurs et le personnel de toute responsabilité. Je confirme être physiquement apte à participer et que toutes les informations fournies sont exactes.",
    sign_below: 'Signez ci-dessous',
    clear: 'Effacer',
    i_agree: "J'ai lu et accepte la décharge ci-dessus",
    submit: 'Terminer le check-in ✓',
    submitting: 'Envoi en cours...',
    success_title: 'Check-in terminé!',
    success_sub: "C'est parti! 🪁",
    next: 'Suivant',
    back: 'Retour',
    dob: 'Date de naissance',
    gdpr: 'Je consens au traitement de mes données personnelles aux fins de cette activité (RGPD).',
    waiver_points: ["Les sports nautiques comportent des risques inhérents", "La participation est volontaire", "Je suis physiquement apte à participer", "Toutes les informations fournies sont exactes"],
    package_active: 'Forfait actif',
    package_left: 'restantes',
    package_empty: "Plus d'heures restantes",
    powered_by: 'Propulsé par',
  },
  es: {
    code: 'es', label: 'Español', flag: '🇪🇸',
    q_name: '¿Cuál es tu nombre?',
    q_activity: '¿Qué actividad hoy?',
    q_source: '¿Cómo nos encontraste?',
    name: 'Nombre completo',
    nationality: 'Nacionalidad',
    other: 'Otro',
    no_preference: 'Sin preferencia',
    skip: 'Saltar',
    email: 'Correo electrónico',
    whatsapp: 'WhatsApp',
    activity: 'Actividad',
    instructor: 'Instructor',
    health_q: '¿Tiene alguna condición médica que debamos saber?',
    health_placeholder: 'Ej: asma, problema cardíaco, lesión reciente...',
    no_conditions: 'Sin condiciones médicas',
    has_conditions: 'Sí — tengo una condición a declarar',
    emergency: 'Contacto de emergencia',
    emergency_name: 'Nombre del contacto',
    emergency_phone: 'Teléfono del contacto',
    waiver_title: 'Términos y condiciones',
    waiver_text: 'Entiendo que los deportes acuáticos implican riesgos inherentes incluyendo lesiones o muerte. Participo voluntariamente y eximo a la escuela, instructores y personal de responsabilidad por accidentes. Confirmo que estoy físicamente apto para participar y que toda la información proporcionada es veraz.',
    sign_below: 'Firme abajo',
    clear: 'Borrar',
    i_agree: 'He leído y acepto el descargo anterior',
    submit: 'Completar el check-in ✓',
    submitting: 'Enviando...',
    success_title: '¡Check-in listo!',
    success_sub: '¡A volar! 🪁',
    next: 'Siguiente',
    back: 'Volver',
    dob: 'Fecha de nacimiento',
    gdpr: 'Consiento el tratamiento de mis datos personales para el propósito de esta actividad.',
    waiver_points: ['Los deportes acuáticos implican riesgos inherentes', 'La participación es voluntaria', 'Estoy físicamente apto para participar', 'Toda la información proporcionada es veraz'],
    package_active: 'Paquete activo',
    package_left: 'restantes',
    package_empty: 'Sin horas restantes',
    powered_by: 'Desarrollado por',
  },
}

type LangKey = keyof typeof LANGS

type School = {
  id: string
  name: string
  slug: string
  language: string
  sport_types: string[] | null
  waiver_en: string | null
  waiver_pt: string | null
  waiver_fr: string | null
  waiver_es: string | null
  waiver_type?: string | null
  waiver_file_global_url?: string | null
  waiver_files_by_lang?: Record<string, string> | null
}

type Activity = {
  id: string
  name: string
  default_price: number
  default_duration_min: number
}

type Instructor = {
  id: string
  name: string
}

type Partner = {
  id: string
  name: string
  type: string
}

type ScheduledStudent = {
  id: string
  student_name: string
  activity_id: string | null
  activity_name: string | null
  instructor_id: string | null
  instructor_name: string | null
  scheduled_at: string
}

type PackageBalance = {
  packageName: string
  hoursRemaining: number
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 18px',
  border: '1.5px solid #E4E0D8',
  borderRadius: '14px',
  fontSize: '17px',
  color: '#1A1C22',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '500',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#8A8C98',
  marginBottom: '8px',
  display: 'block',
}

type Source = 'walk_in' | 'whatsapp' | 'instagram' | 'hotel' | 'agencia' | 'outro'

const SOURCE_OPTIONS: Array<{ value: Source; labelPt: string; labelEn: string; icon: string; wide?: boolean }> = [
  { value: 'walk_in',   labelPt: 'Passei por aqui',   labelEn: 'Walked in',     icon: '🚶' },
  { value: 'whatsapp',  labelPt: 'WhatsApp',          labelEn: 'WhatsApp',      icon: '💬' },
  { value: 'instagram', labelPt: 'Instagram',         labelEn: 'Instagram',    icon: '📸' },
  { value: 'outro',     labelPt: 'Outro',             labelEn: 'Other',        icon: '💡' },
  { value: 'hotel',     labelPt: 'Hotel / Pousada',   labelEn: 'Hotel / Lodge', icon: '🏨', wide: true },
  { value: 'agencia',   labelPt: 'Agência de viagem', labelEn: 'Travel agency', icon: '✈',  wide: true },
]

const NATIONALITY_FLAGS: Array<{ code: string; flag: string }> = [
  { code: 'BR', flag: '🇧🇷' },
  { code: 'GB', flag: '🇬🇧' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'DE', flag: '🇩🇪' },
  { code: 'NL', flag: '🇳🇱' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'IT', flag: '🇮🇹' },
  { code: 'OTHER', flag: '+' },
]

function activityIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('kite'))            return '🪁'
  if (n.includes('wing'))            return '🌬️'
  if (n.includes('wind'))            return '🏄'
  if (n.includes('sup') || n.includes('stand')) return '🛶'
  if (n.includes('surf'))            return '🏄'
  return '🌊'
}

function PartnerButton({
  partner,
  active,
  onSelect,
}: {
  partner: { id: string; name: string; type: string }
  active: boolean
  onSelect: () => void
}) {
  const icon = partner.type === 'hotel' ? '🏨'
    : partner.type === 'agency' ? '✈'
    : '🤝'

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        padding: '11px 14px',
        borderRadius: '8px',
        border: `1.5px solid ${active ? '#00A896' : 'transparent'}`,
        background: active ? '#E0F8F5' : 'rgba(255,255,255,0.6)',
        color: active ? '#0B5E75' : '#0B1F2E',
        fontSize: '14px',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <span>{icon}</span>
      <span>{partner.name}</span>
      {active && (
        <span style={{ marginLeft: 'auto', color: '#00A896', fontSize: '14px' }}>✓</span>
      )}
    </button>
  )
}

function ConsentCheckbox({
  checked,
  onChange,
  accent,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  accent: string
  children: React.ReactNode
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer',
        padding: '14px 16px', background: '#fff', borderRadius: '12px',
        border: `1.5px solid ${checked ? accent : '#E4E0D8'}`,
      }}
    >
      <div style={{
        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
        border: `1.5px solid ${checked ? accent : '#D8D2C8'}`,
        background: checked ? accent : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: '1px', transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontSize: '13px', color: '#4A4C58', lineHeight: '1.5' }}>{children}</span>
    </div>
  )
}

function CheckinHeader({
  schoolName,
  schoolSport,
  lang,
  onLangChange,
}: {
  schoolName: string
  schoolSport?: string
  lang: LangKey
  onLangChange: (l: LangKey) => void
}) {
  return (
    <div style={{ background: '#1A1C22', padding: '20px 24px 24px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px',
      }}>
        {/* Pico Base logo */}
        <div style={{ fontSize: '20px', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'inherit' }}>
          <span style={{ fontWeight: 800, fontStyle: 'italic', color: '#E8471A' }}>Pico</span>
          <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}> Base</span>
        </div>

        {/* Language selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['pt', 'en', 'fr', 'es'] as LangKey[]).map(l => (
            <button
              key={l}
              onClick={() => onLangChange(l)}
              style={{
                padding: '4px 8px',
                border: `0.5px solid ${lang === l ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: lang === l ? 700 : 400,
                color: lang === l ? '#fff' : 'rgba(255,255,255,0.35)',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* School name */}
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
        {schoolName}
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
        {schoolSport ?? 'Escola de Esportes Aquáticos'}
      </div>
    </div>
  )
}

function CheckinProgress({
  current,
  total,
  lang,
}: {
  current: number
  total: number
  lang: LangKey
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '14px 24px', background: '#F0EEE9',
      borderBottom: '0.5px solid #E4E0D8',
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          height: '8px', borderRadius: '99px',
          background: i < current - 1 ? '#00A89660' : i === current - 1 ? '#00A896' : '#E4E0D8',
          width: i === current - 1 ? '24px' : '8px',
          transition: 'all 0.2s',
        }} />
      ))}
      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#8A8C98', fontWeight: 500 }}>
        {lang === 'pt' ? `Passo ${current} de ${total}`
          : lang === 'fr' ? `Étape ${current} sur ${total}`
          : lang === 'es' ? `Paso ${current} de ${total}`
          : `Step ${current} of ${total}`}
      </span>
    </div>
  )
}

type Step = 'name' | 'activity' | 'source' | 'waiver'
const STEP_ORDER: Step[] = ['name', 'activity', 'source', 'waiver']

type ReferredPartner = {
  id: string
  name: string
  type: string | null
  discount_pct: number | null
}

export default function CheckinForm({
  school,
  activities,
  instructors,
  partners = [],
  referredPartner = null,
}: {
  school: School
  activities: Activity[]
  instructors: Instructor[]
  partners?: Partner[]
  /** Resolved server-side from the pb_ref cookie (see page.tsx) — when
   *  present, the source/partner step is pre-filled instead of asked. */
  referredPartner?: ReferredPartner | null
}) {
  const defaultLang = (school.language === 'pt' ? 'pt'
    : school.language === 'fr' ? 'fr'
    : school.language === 'es' ? 'es'
    : 'en') as LangKey

  const [lang, setLang]             = useState<LangKey>(defaultLang)
  const [step, setStep]             = useState<Step>('name')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [agreed, setAgreed]         = useState(false)
  const [gdpr, setGdpr]             = useState(false)
  const [hasHealth, setHasHealth]   = useState(false)

  const [form, setForm] = useState({
    student_name:        '',
    student_email:       '',
    student_whatsapp:    '',
    student_nationality: '',
    date_of_birth:       '',
    activity_id:         '',
    instructor_id:       '',
    health_condition:    '',
    emergency_name:      '',
    emergency_phone:     '',
    signature_data:      '',
  })

  // Cookie-attributed referral pre-fills the source/partner step invisibly —
  // still overridable by the manual selection below, for walk-ins who share
  // a device or a link that got forwarded.
  const [source, setSource]       = useState<Source | null>(
    referredPartner ? (referredPartner.type === 'hotel' ? 'hotel' : 'agencia') : null
  )
  const [partnerId, setPartnerId] = useState<string | null>(referredPartner?.id ?? null)
  const [stepError, setStepError] = useState<string | null>(null)

  const [scheduledStudents, setScheduledStudents] = useState<ScheduledStudent[]>([])
  const [showDropdown, setShowDropdown]           = useState(false)
  const [filteredStudents, setFilteredStudents]   = useState<ScheduledStudent[]>([])

  const [packageBalance, setPackageBalance] = useState<PackageBalance | null>(null)
  const [packageChecked, setPackageChecked] = useState(false)

  useEffect(() => {
    fetch(`/api/checkin/scheduled-today?school=${encodeURIComponent(school.slug)}`)
      .then(r => r.json())
      .then(data => setScheduledStudents(data.students ?? []))
      .catch(() => {})
  }, [school.slug])

  const [isMinor,         setIsMinor]         = useState(false)
  const [guardianName,    setGuardianName]    = useState('')
  const [guardianConsent, setGuardianConsent] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing   = useRef(false)
  const t = LANGS[lang]

  async function checkPackageBalance(name: string) {
    if (name.trim().length < 2) {
      setPackageBalance(null)
      setPackageChecked(false)
      return
    }
    try {
      const res = await fetch(
        `/api/checkin/package-balance?school=${encodeURIComponent(school.slug)}&name=${encodeURIComponent(name.trim())}`
      )
      const data = await res.json()
      setPackageBalance(data.found ? { packageName: data.packageName, hoursRemaining: data.hoursRemaining } : null)
    } catch {
      setPackageBalance(null)
    } finally {
      setPackageChecked(true)
    }
  }

  function getPos(e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: (e as React.TouchEvent).touches[0].clientX - rect.left,
        y: (e as React.TouchEvent).touches[0].clientY - rect.top,
      }
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    }
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    drawing.current = true
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1A1C22'
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function stopDraw() {
    drawing.current = false
    const canvas = canvasRef.current
    if (canvas) {
      setForm(f => ({ ...f, signature_data: canvas.toDataURL() }))
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setForm(f => ({ ...f, signature_data: '' }))
  }

  async function submit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          school_id:        school.id,
          partner_id:       (source === 'hotel' || source === 'agencia') ? partnerId : null,
          source:           source ?? null,
          is_minor:         isMinor,
          guardian_name:    isMinor ? guardianName.trim() : null,
          guardian_consent: isMinor ? guardianConsent : false,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setDone(true)
      } else {
        setSubmitError(data.error ?? 'Submission failed. Please try again.')
      }
    } catch (err) {
      console.error('[checkin] fetch error:', err)
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function back() {
    if (step === 'activity') setStep('name')
    if (step === 'source')   setStep('activity')
    if (step === 'waiver')   setStep('source')
  }

  const schoolSport = school.sport_types && school.sport_types.length > 0
    ? school.sport_types.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')
    : undefined

  // Success screen — replaces the entire page, not just the form
  if (done) {
    const selectedActivity   = activities.find(a => a.id === form.activity_id)
    const selectedInstructor = instructors.find(i => i.id === form.instructor_id)
    const selectedPartner    = partners.find(p => p.id === partnerId)

    return (
      <div style={{
        minHeight: '100vh', background: '#F0EEE9',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', fontFamily: 'inherit',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#E0F8F5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', marginBottom: '20px', color: '#00A896',
        }}>
          ✓
        </div>

        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1A1C22', marginBottom: '6px' }}>
          {t.success_title}
        </div>
        <div style={{ fontSize: '15px', color: '#8A8C98', marginBottom: '32px' }}>
          {t.success_sub}
        </div>

        <div style={{
          background: '#fff', border: '0.5px solid #E4E0D8',
          borderRadius: '16px', padding: '20px 24px',
          width: '100%', maxWidth: '320px',
          display: 'flex', flexDirection: 'column', gap: '10px',
          marginBottom: '32px', textAlign: 'left',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1A1C22' }}>
            {form.student_name}
          </div>
          <div style={{ fontSize: '13px', color: '#8A8C98' }}>
            {selectedActivity?.name ?? '—'}
            {selectedInstructor && ` · ${selectedInstructor.name}`}
          </div>
          {selectedPartner && (
            <div style={{ fontSize: '12px', color: '#8A8C98' }}>
              {selectedPartner.name}
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '32px', fontSize: '11px', color: '#B8B4AA' }}>
          <div style={{ marginBottom: '4px' }}>{t.powered_by}</div>
          <div style={{ fontSize: '13px' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 800, color: '#E8471A' }}>Pico</span>
            <span style={{ fontWeight: 500, color: '#1A1C22' }}> Base</span>
          </div>
        </div>
      </div>
    )
  }

  const canSubmitWaiver = agreed && gdpr && form.signature_data !== '' && !submitting
    && (!isMinor || (guardianName.trim().length > 2 && guardianConsent))

  const canAdvanceName = form.student_name.trim().length >= 2 && form.student_nationality !== ''
  const canAdvanceActivity = form.activity_id !== ''

  return (
    <div style={{ minHeight: '100vh', background: '#F0EEE9', fontFamily: 'inherit' }}>

      <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <CheckinHeader
          schoolName={school.name}
          schoolSport={schoolSport}
          lang={lang}
          onLangChange={setLang}
        />
        <CheckinProgress current={STEP_ORDER.indexOf(step) + 1} total={STEP_ORDER.length} lang={lang} />
      </div>

      <div style={{ padding: '24px', paddingBottom: '40px' }}>

        {referredPartner && (
          <div style={{
            fontSize: '12px', color: '#0B5E75', background: '#E0F8F5',
            padding: '8px 12px', borderRadius: '8px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span>🤝</span>
            <span>
              {lang === 'pt'
                ? `Indicado por ${referredPartner.name}`
                : `Referred by ${referredPartner.name}`}
              {referredPartner.discount_pct
                ? (lang === 'pt'
                    ? ` · desconto de parceiro aplicado`
                    : ` · partner discount applied`)
                : ''}
            </span>
          </div>
        )}

        {/* STEP 1 — Name + nationality */}
        {step === 'name' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1C22' }}>{t.q_name}</h2>

            <div>
              {scheduledStudents.length > 0 && (
                <div style={{
                  fontSize: '12px', color: '#0B5E75', background: '#E0F8F5',
                  padding: '6px 12px', borderRadius: '8px', marginBottom: '8px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span>📋</span>
                  <span>
                    {lang === 'pt'
                      ? `${scheduledStudents.length} aluno${scheduledStudents.length !== 1 ? 's' : ''} agendado${scheduledStudents.length !== 1 ? 's' : ''} para hoje`
                      : `${scheduledStudents.length} student${scheduledStudents.length !== 1 ? 's' : ''} scheduled for today`
                    }
                  </span>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={form.student_name}
                  onChange={e => {
                    const val = e.target.value
                    setForm(f => ({ ...f, student_name: val }))
                    const needle = val.toLowerCase()
                    if (needle.length >= 1) {
                      const matches = scheduledStudents.filter(s => s.student_name.toLowerCase().includes(needle))
                      setFilteredStudents(matches)
                      setShowDropdown(matches.length > 0)
                    } else {
                      setFilteredStudents(scheduledStudents)
                      setShowDropdown(scheduledStudents.length > 0)
                    }
                  }}
                  onFocus={() => {
                    if (scheduledStudents.length > 0) {
                      const needle = form.student_name.toLowerCase()
                      const matches = needle
                        ? scheduledStudents.filter(s => s.student_name.toLowerCase().includes(needle))
                        : scheduledStudents
                      setFilteredStudents(matches)
                      setShowDropdown(matches.length > 0)
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowDropdown(false), 200)
                    checkPackageBalance(form.student_name)
                  }}
                  placeholder="João Silva"
                  autoComplete="name"
                  style={inputStyle}
                />

                {showDropdown && filteredStudents.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #00A896', borderRadius: '12px',
                    zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    overflow: 'hidden', maxHeight: '280px', overflowY: 'auto',
                  }}>
                    <div style={{
                      padding: '8px 14px', background: '#E0F8F5', fontSize: '10px',
                      fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: '#0B5E75', borderBottom: '0.5px solid #DDD8CF',
                    }}>
                      {lang === 'pt' ? 'Agendados hoje' : 'Scheduled today'}
                    </div>

                    {filteredStudents.map((student, i) => {
                      const time = new Date(student.scheduled_at)
                        .toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', {
                          hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza',
                        })
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onMouseDown={() => {
                            setForm(f => ({
                              ...f,
                              student_name:  student.student_name,
                              activity_id:   student.activity_id   ?? f.activity_id,
                              instructor_id: student.instructor_id ?? f.instructor_id,
                            }))
                            setShowDropdown(false)
                            checkPackageBalance(student.student_name)
                          }}
                          style={{
                            width: '100%', padding: '12px 14px', background: 'transparent', border: 'none',
                            borderBottom: i < filteredStudents.length - 1 ? '0.5px solid #F0EEE8' : 'none',
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#0B1F2E', marginBottom: '2px' }}>
                              {student.student_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#8A8C98' }}>
                              {student.activity_name ?? '—'}
                              {student.instructor_name && ` · ${student.instructor_name}`}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#00A896', flexShrink: 0 }}>
                            {time}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Package balance banner */}
              {packageChecked && packageBalance && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', borderRadius: '10px', marginTop: '8px',
                  fontSize: '13px', fontWeight: 600,
                  background: packageBalance.hoursRemaining > 0 ? '#E0F8F5' : '#FFF0EE',
                  color: packageBalance.hoursRemaining > 0 ? '#00695C' : '#C0392B',
                }}>
                  {packageBalance.hoursRemaining > 0
                    ? `✓ ${t.package_active} · ${packageBalance.packageName} · ${packageBalance.hoursRemaining}h ${t.package_left}`
                    : `⚠ ${t.package_empty} · ${packageBalance.packageName}`
                  }
                </div>
              )}
            </div>

            {/* Nationality flag grid */}
            <div>
              <label style={labelStyle}>{t.nationality}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {NATIONALITY_FLAGS.map(({ code, flag }) => {
                  const active = form.student_nationality === code
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, student_nationality: code }))}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: `1.5px solid ${active ? '#00A896' : '#E4E0D8'}`,
                        background: active ? '#E0F8F5' : '#fff',
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '24px', lineHeight: 1 }}>{flag}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: active ? '#0B5E75' : '#8A8C98' }}>
                        {code === 'OTHER' ? t.other : code}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t.dob}</label>
              <input
                style={inputStyle}
                type="date"
                value={form.date_of_birth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => {
                  const val = e.target.value
                  setForm(f => ({ ...f, date_of_birth: val }))
                  if (val) {
                    const age = Math.floor((Date.now() - new Date(val).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                    setIsMinor(age < 18)
                  } else {
                    setIsMinor(false)
                  }
                }}
              />
            </div>

            {isMinor && (
              <div style={{ padding: '16px', background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: '12px' }}>
                <div style={{
                  fontSize: '14px', fontWeight: '700', color: '#92400E', marginBottom: '8px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span>⚠</span>
                  <span>
                    {lang === 'pt' ? 'Aluno menor de idade'
                      : lang === 'fr' ? 'Élève mineur'
                      : lang === 'es' ? 'Estudiante menor de edad'
                      : 'Minor student'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#92400E', lineHeight: '1.6' }}>
                  {lang === 'pt'
                    ? 'É necessária a autorização de um responsável legal para que menores de 18 anos participem das atividades.'
                    : lang === 'fr'
                    ? "L'autorisation d'un tuteur légal est requise pour les moins de 18 ans."
                    : lang === 'es'
                    ? 'Se requiere la autorización de un tutor legal para menores de 18 años.'
                    : 'A legal guardian must authorize participation for students under 18 years of age.'
                  }
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>{t.email}</label>
              <input style={inputStyle} type="email" value={form.student_email}
                onChange={e => setForm(f => ({ ...f, student_email: e.target.value }))}
                placeholder="joao@email.com" autoComplete="email" />
            </div>
            <div>
              <label style={labelStyle}>{t.whatsapp}</label>
              <input style={inputStyle} type="tel" value={form.student_whatsapp}
                onChange={e => setForm(f => ({ ...f, student_whatsapp: e.target.value }))}
                placeholder="+55 85 99999-9999" autoComplete="tel" />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => canAdvanceName && setStep('activity')}
                disabled={!canAdvanceName}
                style={{
                  flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
                  fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
                  background: canAdvanceName ? '#E8471A' : '#E4E0D8',
                  color: canAdvanceName ? '#fff' : '#8A8C98',
                  cursor: canAdvanceName ? 'pointer' : 'not-allowed',
                }}
              >
                {t.next} →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Activity + instructor */}
        {step === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1C22' }}>{t.q_activity}</h2>

            <div>
              <label style={labelStyle}>{t.activity}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activities.map(a => {
                  const active = form.activity_id === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, activity_id: a.id }))}
                      style={{
                        padding: '16px 18px', borderRadius: '14px',
                        border: `1.5px solid ${active ? '#00A896' : '#E4E0D8'}`,
                        background: active ? '#E0F8F5' : '#fff',
                        color: active ? '#1B4B5A' : '#1A1C22',
                        fontSize: '15px', fontWeight: active ? 600 : 400,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>{activityIcon(a.name)}</span>
                      <span style={{ flex: 1 }}>{a.name}</span>
                      {active && <span style={{ color: '#00A896', fontSize: '16px' }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t.instructor}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, instructor_id: '' }))}
                  style={{
                    padding: '16px 18px', borderRadius: '14px',
                    border: `1.5px solid ${form.instructor_id === '' ? '#00A896' : '#E4E0D8'}`,
                    background: form.instructor_id === '' ? '#E0F8F5' : '#fff',
                    color: form.instructor_id === '' ? '#1B4B5A' : '#1A1C22',
                    fontSize: '15px', fontWeight: form.instructor_id === '' ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>🤷</span>
                  <span style={{ flex: 1 }}>{t.no_preference}</span>
                  {form.instructor_id === '' && <span style={{ color: '#00A896', fontSize: '16px' }}>✓</span>}
                </button>
                {instructors.map(i => {
                  const active = form.instructor_id === i.id
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, instructor_id: i.id }))}
                      style={{
                        padding: '16px 18px', borderRadius: '14px',
                        border: `1.5px solid ${active ? '#00A896' : '#E4E0D8'}`,
                        background: active ? '#E0F8F5' : '#fff',
                        color: active ? '#1B4B5A' : '#1A1C22',
                        fontSize: '15px', fontWeight: active ? 600 : 400,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>👤</span>
                      <span style={{ flex: 1 }}>{i.name}</span>
                      {active && <span style={{ color: '#00A896', fontSize: '16px' }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={back} style={{
                padding: '16px 20px', background: 'transparent', color: '#8A8C98',
                border: '1.5px solid #E4E0D8', borderRadius: '14px',
                fontSize: '15px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>← {t.back}</button>
              <button
                onClick={() => canAdvanceActivity && setStep('source')}
                disabled={!canAdvanceActivity}
                style={{
                  flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
                  fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
                  background: canAdvanceActivity ? '#E8471A' : '#E4E0D8',
                  color: canAdvanceActivity ? '#fff' : '#8A8C98',
                  cursor: canAdvanceActivity ? 'pointer' : 'not-allowed',
                }}
              >
                {t.next} →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Source */}
        {step === 'source' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1C22' }}>{t.q_source}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {SOURCE_OPTIONS.map(opt => {
                const active = source === opt.value
                const showPartners = active &&
                  (opt.value === 'hotel' || opt.value === 'agencia') && partners.length > 0

                const filteredPartners = partners.filter(p =>
                  opt.value === 'hotel' ? p.type === 'hotel' : p.type === 'agency' || p.type === 'operator'
                )
                const partnersToShow = filteredPartners.length === 0 ? partners : filteredPartners

                return (
                  <div key={opt.value} style={{ gridColumn: opt.wide ? 'span 2' : undefined }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSource(opt.value)
                        setStepError(null)
                        if (opt.value !== 'hotel' && opt.value !== 'agencia') setPartnerId(null)
                      }}
                      style={{
                        width: '100%', padding: '18px 14px',
                        borderRadius: showPartners ? '14px 14px 0 0' : '14px',
                        border: `1.5px solid ${active ? '#00A896' : '#E4E0D8'}`,
                        borderBottom: showPartners ? '0.5px solid #DDD8CF' : `1.5px solid ${active ? '#00A896' : '#E4E0D8'}`,
                        background: active ? '#E0F8F5' : '#fff',
                        color: active ? '#1B4B5A' : '#1A1C22',
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '28px' }}>{opt.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400, textAlign: 'center' }}>
                        {lang === 'pt' ? opt.labelPt : opt.labelEn}
                      </span>
                    </button>

                    {showPartners && (
                      <div style={{
                        border: '1.5px solid #00A896', borderTop: 'none', borderRadius: '0 0 14px 14px',
                        background: '#F8FFFE', padding: '8px',
                        display: 'flex', flexDirection: 'column', gap: '6px',
                      }}>
                        {partnersToShow.map(partner => (
                          <PartnerButton
                            key={partner.id}
                            partner={partner}
                            active={partnerId === partner.id}
                            onSelect={() => { setPartnerId(partner.id); setStepError(null) }}
                          />
                        ))}
                        {!partnerId && (
                          <div style={{ padding: '6px 8px', fontSize: '12px', color: '#D97706' }}>
                            {lang === 'pt' ? 'Selecione o parceiro acima' : 'Select the partner above'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {stepError && (
              <div style={{
                padding: '12px 16px', background: '#FFF0EE', border: '0.5px solid #F4A89A',
                borderRadius: '12px', fontSize: '13px', color: '#C0392B',
              }}>
                {stepError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={back} style={{
                padding: '16px 20px', background: 'transparent', color: '#8A8C98',
                border: '1.5px solid #E4E0D8', borderRadius: '14px',
                fontSize: '15px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>← {t.back}</button>
              <button onClick={() => {
                if ((source === 'hotel' || source === 'agencia') && !partnerId) {
                  setStepError(lang === 'pt'
                    ? 'Por favor selecione o parceiro que te indicou'
                    : 'Please select the partner that referred you')
                  return
                }
                setStepError(null)
                setStep('waiver')
              }} style={{
                flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
                fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
                background: '#E8471A', color: '#fff', cursor: 'pointer',
              }}>
                {source ? `${t.next} →` : `${t.skip} →`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Waiver */}
        {step === 'waiver' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1C22' }}>{t.waiver_title}</h2>

            <div style={{
              background: '#E0F8F5', border: '0.5px solid #A0E8E0', borderRadius: '12px', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {(t.waiver_points as string[]).map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#00A896', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#1A1C22', lineHeight: '1.5' }}>{point}</span>
                </div>
              ))}
            </div>

            {(() => {
              // File mode: the student consults the official document (view
              // only, never signed inside the PDF itself) instead of reading
              // typed text inline. Falls back to the text flow below if the
              // owner switched to file mode but never actually uploaded one.
              const waiverFileUrl = school.waiver_type === 'file'
                ? (school.waiver_files_by_lang?.[lang] ?? school.waiver_file_global_url ?? null)
                : null

              if (waiverFileUrl) {
                return (
                  <a
                    href={waiverFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      background: '#fff', borderRadius: '14px', padding: '18px',
                      border: '1.5px solid #00A896', textDecoration: 'none',
                      fontSize: '15px', fontWeight: 600, color: '#00A896',
                    }}
                  >
                    📄 {lang === 'pt' ? 'Visualizar Termo de Responsabilidade (PDF)'
                      : lang === 'fr' ? 'Consulter les conditions générales (PDF)'
                      : lang === 'es' ? 'Ver términos y condiciones (PDF)'
                      : 'View waiver document (PDF)'}
                  </a>
                )
              }

              const waiverKey = `waiver_${lang}` as keyof typeof school
              const dbWaiver = school[waiverKey] as string | null
              return (
                <div style={{
                  background: '#fff', borderRadius: '14px', padding: '16px',
                  fontSize: '13px', color: '#4A4C58', lineHeight: '1.7',
                  border: '0.5px solid #E4E0D8', maxHeight: '120px', overflowY: 'auto',
                }}>
                  {dbWaiver || t.waiver_text}
                </div>
              )
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
                background: '#fff', borderRadius: '14px', cursor: 'pointer',
                fontSize: '15px', color: '#1A1C22',
                border: `1.5px solid ${!hasHealth ? '#00A896' : '#E4E0D8'}`,
              }}>
                <input type="radio" checked={!hasHealth}
                  onChange={() => { setHasHealth(false); setForm(f => ({ ...f, health_condition: '' })) }}
                  style={{ accentColor: '#00A896', width: '18px', height: '18px' }} />
                {t.no_conditions}
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
                background: '#fff', borderRadius: '14px', cursor: 'pointer',
                fontSize: '15px', color: '#1A1C22',
                border: `1.5px solid ${hasHealth ? '#E8471A' : '#E4E0D8'}`,
              }}>
                <input type="radio" checked={hasHealth} onChange={() => setHasHealth(true)}
                  style={{ accentColor: '#E8471A', width: '18px', height: '18px' }} />
                {t.has_conditions}
              </label>
            </div>

            {hasHealth && (
              <textarea
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', lineHeight: '1.5' }}
                placeholder={t.health_placeholder}
                value={form.health_condition}
                onChange={e => setForm(f => ({ ...f, health_condition: e.target.value }))}
              />
            )}

            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1A1C22', marginBottom: '12px' }}>{t.emergency}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input style={inputStyle} type="text" placeholder={t.emergency_name}
                  value={form.emergency_name}
                  onChange={e => setForm(f => ({ ...f, emergency_name: e.target.value }))} />
                <input style={inputStyle} type="tel" placeholder={t.emergency_phone}
                  value={form.emergency_phone}
                  onChange={e => setForm(f => ({ ...f, emergency_phone: e.target.value }))} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1A1C22', marginBottom: '10px' }}>{t.sign_below}</div>
              <div style={{ background: '#fff', border: '1.5px solid #E4E0D8', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                <canvas
                  ref={canvasRef}
                  width={432}
                  height={160}
                  style={{ width: '100%', height: '160px', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                <button onClick={clearCanvas} style={{
                  position: 'absolute', bottom: '8px', right: '10px',
                  fontSize: '11px', color: '#8A8C98', background: 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px',
                }}>
                  {t.clear}
                </button>
              </div>
            </div>

            {isMinor && (
              <div style={{ padding: '20px', background: '#fff', border: '1.5px solid #F59E0B', borderRadius: '14px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: '700', color: '#0B1F2E',
                  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '16px',
                }}>
                  {lang === 'pt' ? 'Autorização do responsável legal'
                    : lang === 'fr' ? 'Autorisation du tuteur légal'
                    : lang === 'es' ? 'Autorización del tutor legal'
                    : 'Legal guardian authorization'}
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#0B1F2E', marginBottom: '6px' }}>
                    {lang === 'pt' ? 'Nome do responsável *'
                      : lang === 'fr' ? 'Nom du tuteur *'
                      : lang === 'es' ? 'Nombre del tutor *'
                      : 'Guardian full name *'}
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={e => setGuardianName(e.target.value)}
                    placeholder={lang === 'pt' ? 'Nome completo' : 'Full name'}
                    style={inputStyle}
                  />
                </div>

                <ConsentCheckbox checked={guardianConsent} onChange={setGuardianConsent} accent="#F59E0B">
                  {lang === 'pt'
                    ? 'Eu, responsável legal pelo menor acima identificado, autorizo sua participação nas atividades e declaro estar ciente dos riscos envolvidos.'
                    : lang === 'fr'
                    ? "En tant que tuteur légal du mineur identifié ci-dessus, j'autorise sa participation aux activités et reconnais les risques impliqués."
                    : lang === 'es'
                    ? 'Yo, tutor legal del menor identificado arriba, autorizo su participación en las actividades y reconozco los riesgos involucrados.'
                    : 'I, as the legal guardian of the minor identified above, authorize their participation in the activities and acknowledge the risks involved.'
                  }
                </ConsentCheckbox>
              </div>
            )}

            <ConsentCheckbox checked={agreed} onChange={setAgreed} accent="#00A896">
              {t.i_agree}
            </ConsentCheckbox>

            <ConsentCheckbox checked={gdpr} onChange={setGdpr} accent="#00A896">
              {t.gdpr}
            </ConsentCheckbox>

            {submitError && (
              <div style={{
                padding: '12px 16px', background: '#FFF0EE', border: '0.5px solid #F4A89A',
                borderRadius: '12px', fontSize: '13px', color: '#C0392B',
              }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={back} style={{
                padding: '16px 20px', background: 'transparent', color: '#8A8C98',
                border: '1.5px solid #E4E0D8', borderRadius: '14px',
                fontSize: '15px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>← {t.back}</button>
              <button
                onClick={submit}
                disabled={!canSubmitWaiver}
                style={{
                  flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
                  fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
                  background: canSubmitWaiver ? '#E8471A' : '#E4E0D8',
                  color: canSubmitWaiver ? '#fff' : '#8A8C98',
                  cursor: canSubmitWaiver ? 'pointer' : 'not-allowed',
                }}
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
