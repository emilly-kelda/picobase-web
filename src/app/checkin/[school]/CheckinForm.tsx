'use client'

import { useRef, useState, useEffect } from 'react'

const LANGS = {
  en: {
    code: 'en', label: 'English', flag: '🇬🇧',
    welcome: 'Welcome',
    subtitle: 'Complete your check-in',
    step_info: 'Personal info',
    step_activity: 'Activity',
    step_health: 'Health',
    step_waiver: 'Waiver',
    name: 'Full name',
    nationality: 'Nationality',
    email: 'Email',
    whatsapp: 'WhatsApp',
    activity: 'Activity',
    instructor: 'Instructor',
    select_activity: 'Select activity',
    select_instructor: 'Select instructor',
    health_q: 'Do you have any medical conditions we should know about?',
    health_placeholder: 'E.g. asthma, heart condition, recent injury...',
    no_conditions: 'No medical conditions',
    emergency: 'Emergency contact',
    emergency_name: 'Contact name',
    emergency_phone: 'Contact phone',
    waiver_title: 'Liability Waiver',
    waiver_text: 'I understand that water sports involve inherent risks including injury or death. I voluntarily participate and release the school, instructors, and staff from liability for accidents or injuries during my participation. I confirm that I am physically fit to participate and that all information provided is accurate.',
    sign_below: 'Sign below',
    clear: 'Clear',
    i_agree: 'I have read and agree to the waiver above',
    submit: 'Complete check-in',
    submitting: 'Submitting...',
    success_title: "You're checked in!",
    success_sub: 'Your instructor will be with you shortly.',
    next: 'Next',
    back: 'Back',
    dob: 'Date of birth',
    gdpr: 'I consent to my personal data being processed for the purpose of this activity.',
    waiver_points: ['Water sports involve inherent risks', 'Participation is voluntary', 'I am physically fit to participate', 'All information provided is accurate'],
  },
  pt: {
    code: 'pt', label: 'Português', flag: '🇧🇷',
    welcome: 'Bem-vindo',
    subtitle: 'Complete seu check-in',
    step_info: 'Informações',
    step_activity: 'Atividade',
    step_health: 'Saúde',
    step_waiver: 'Termo',
    name: 'Nome completo',
    nationality: 'Nacionalidade',
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    activity: 'Atividade',
    instructor: 'Instrutor',
    select_activity: 'Selecionar atividade',
    select_instructor: 'Selecionar instrutor',
    health_q: 'Você tem alguma condição médica que devemos saber?',
    health_placeholder: 'Ex: asma, problema cardíaco, lesão recente...',
    no_conditions: 'Nenhuma condição médica',
    emergency: 'Contato de emergência',
    emergency_name: 'Nome do contato',
    emergency_phone: 'Telefone do contato',
    waiver_title: 'Termo de Responsabilidade',
    waiver_text: 'Compreendo que os esportes aquáticos envolvem riscos inerentes, incluindo lesões ou morte. Participo voluntariamente e isento a escola, instrutores e equipe de responsabilidade por acidentes durante minha participação. Confirmo que estou fisicamente apto a participar e que todas as informações fornecidas são verdadeiras.',
    sign_below: 'Assine abaixo',
    clear: 'Limpar',
    i_agree: 'Li e concordo com o termo acima',
    submit: 'Finalizar check-in',
    submitting: 'Enviando...',
    success_title: 'Check-in realizado!',
    success_sub: 'Seu instrutor estará com você em breve.',
    next: 'Próximo',
    back: 'Voltar',
    dob: 'Data de nascimento',
    gdpr: 'Consinto com o tratamento dos meus dados pessoais para a finalidade desta atividade (LGPD).',
    waiver_points: ['Esportes aquáticos envolvem riscos inerentes', 'Participo voluntariamente', 'Estou fisicamente apto a participar', 'Todas as informações fornecidas são verdadeiras'],
  },
  fr: {
    code: 'fr', label: 'Français', flag: '🇫🇷',
    welcome: 'Bienvenue',
    subtitle: 'Complétez votre enregistrement',
    step_info: 'Informations',
    step_activity: 'Activité',
    step_health: 'Santé',
    step_waiver: 'Décharge',
    name: 'Nom complet',
    nationality: 'Nationalité',
    email: 'E-mail',
    whatsapp: 'WhatsApp',
    activity: 'Activité',
    instructor: 'Instructeur',
    select_activity: "Sélectionner l'activité",
    select_instructor: "Sélectionner l'instructeur",
    health_q: 'Avez-vous des conditions médicales que nous devrions connaître?',
    health_placeholder: 'Ex: asthme, problème cardiaque, blessure récente...',
    no_conditions: 'Aucune condition médicale',
    emergency: "Contact d'urgence",
    emergency_name: 'Nom du contact',
    emergency_phone: 'Téléphone du contact',
    waiver_title: 'Décharge de responsabilité',
    waiver_text: "Je comprends que les sports nautiques comportent des risques inhérents incluant des blessures ou la mort. Je participe volontairement et décharge l'école, les instructeurs et le personnel de toute responsabilité. Je confirme être physiquement apte à participer et que toutes les informations fournies sont exactes.",
    sign_below: 'Signez ci-dessous',
    clear: 'Effacer',
    i_agree: "J'ai lu et accepte la décharge ci-dessus",
    submit: "Finaliser l'enregistrement",
    submitting: 'Envoi en cours...',
    success_title: 'Enregistrement effectué!',
    success_sub: 'Votre instructeur sera avec vous sous peu.',
    next: 'Suivant',
    back: 'Retour',
    dob: 'Date de naissance',
    gdpr: 'Je consens au traitement de mes données personnelles aux fins de cette activité (RGPD).',
    waiver_points: ["Les sports nautiques comportent des risques inhérents", "La participation est volontaire", "Je suis physiquement apte à participer", "Toutes les informations fournies sont exactes"],
  },
  es: {
    code: 'es', label: 'Español', flag: '🇪🇸',
    welcome: 'Bienvenido',
    subtitle: 'Completa tu registro',
    step_info: 'Información',
    step_activity: 'Actividad',
    step_health: 'Salud',
    step_waiver: 'Descargo',
    name: 'Nombre completo',
    nationality: 'Nacionalidad',
    email: 'Correo electrónico',
    whatsapp: 'WhatsApp',
    activity: 'Actividad',
    instructor: 'Instructor',
    select_activity: 'Seleccionar actividad',
    select_instructor: 'Seleccionar instructor',
    health_q: '¿Tiene alguna condición médica que debamos saber?',
    health_placeholder: 'Ej: asma, problema cardíaco, lesión reciente...',
    no_conditions: 'Sin condiciones médicas',
    emergency: 'Contacto de emergencia',
    emergency_name: 'Nombre del contacto',
    emergency_phone: 'Teléfono del contacto',
    waiver_title: 'Descargo de responsabilidad',
    waiver_text: 'Entiendo que los deportes acuáticos implican riesgos inherentes incluyendo lesiones o muerte. Participo voluntariamente y eximo a la escuela, instructores y personal de responsabilidad por accidentes. Confirmo que estoy físicamente apto para participar y que toda la información proporcionada es veraz.',
    sign_below: 'Firme abajo',
    clear: 'Borrar',
    i_agree: 'He leído y acepto el descargo anterior',
    submit: 'Completar registro',
    submitting: 'Enviando...',
    success_title: '¡Registro completado!',
    success_sub: 'Su instructor estará con usted en breve.',
    next: 'Siguiente',
    back: 'Volver',
    dob: 'Fecha de nacimiento',
    gdpr: 'Consiento el tratamiento de mis datos personales para el propósito de esta actividad.',
    waiver_points: ['Los deportes acuáticos implican riesgos inherentes', 'La participación es voluntaria', 'Estoy físicamente apto para participar', 'Toda la información proporcionada es veraz'],
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  border: '0.5px solid #D8D2C8',
  borderRadius: '12px',
  fontSize: '16px',
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

const SOURCE_OPTIONS: Array<{ value: Source; labelPt: string; labelEn: string; icon: string }> = [
  { value: 'walk_in',   labelPt: 'Passei por aqui',   labelEn: 'Walked in',     icon: '🚶' },
  { value: 'whatsapp',  labelPt: 'WhatsApp',          labelEn: 'WhatsApp',      icon: '💬' },
  { value: 'instagram', labelPt: 'Instagram',         labelEn: 'Instagram',    icon: '📸' },
  { value: 'hotel',     labelPt: 'Hotel / Pousada',   labelEn: 'Hotel / Lodge', icon: '🏨' },
  { value: 'agencia',   labelPt: 'Agência de viagem', labelEn: 'Travel agency', icon: '✈' },
  { value: 'outro',     labelPt: 'Outro',             labelEn: 'Other',        icon: '💡' },
]

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
        border: `1.5px solid ${active ? '#2EC4B6' : 'transparent'}`,
        background: active ? '#E8F8F7' : 'rgba(255,255,255,0.6)',
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
        <span style={{
          marginLeft: 'auto',
          color: '#2EC4B6',
          fontSize: '14px',
        }}>✓</span>
      )}
    </button>
  )
}

export default function CheckinForm({
  school,
  activities,
  instructors,
  partners = [],
}: {
  school: School
  activities: Activity[]
  instructors: Instructor[]
  partners?: Partner[]
}) {
  const defaultLang = (school.language === 'pt' ? 'pt'
    : school.language === 'fr' ? 'fr'
    : school.language === 'es' ? 'es'
    : 'en') as LangKey

  void defaultLang

  const [lang, setLang]             = useState<LangKey | null>(null)
  const [step, setStep]             = useState(1)
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

  const [source, setSource]       = useState<Source | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)

  const [scheduledStudents, setScheduledStudents] = useState<ScheduledStudent[]>([])
  const [showDropdown, setShowDropdown]           = useState(false)
  const [filteredStudents, setFilteredStudents]   = useState<ScheduledStudent[]>([])

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
  const t = lang ? LANGS[lang] : null

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
    console.log('[checkin] submitting with partner_id:', partnerId)
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
      console.log('[checkin] response:', data)
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

  const TOTAL_STEPS = 4

  // Language picker
  if (!lang) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F0EEE9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          fontSize: '13px', fontWeight: '600',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#1B4B5A', marginBottom: '8px',
        }}>
          {school.name}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '600', color: '#1A1C22', marginBottom: '8px', textAlign: 'center' }}>
          Check-in
        </div>
        <div style={{ fontSize: '14px', color: '#8A8C98', marginBottom: '40px', textAlign: 'center' }}>
          Select your language
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '320px' }}>
          {(Object.keys(LANGS) as LangKey[]).map(key => (
            <button
              key={key}
              onClick={() => setLang(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px 20px', background: '#fff',
                border: '0.5px solid #E4E0D8', borderRadius: '14px',
                fontSize: '16px', fontWeight: '500', color: '#1A1C22',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: '24px' }}>{LANGS[key].flag}</span>
              {LANGS[key].label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Success screen
  if (done) {
    const selectedActivity   = activities.find(a => a.id === form.activity_id)
    const selectedInstructor = instructors.find(i => i.id === form.instructor_id)
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    return (
      <div style={{
        minHeight: '100vh', background: '#F0EEE9',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#E0F8F5', border: '2px solid #00A896',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', marginBottom: '20px', color: '#00A896',
        }}>
          ✓
        </div>

        <div style={{ fontSize: '24px', fontWeight: '600', color: '#1A1C22', marginBottom: '6px' }}>
          {t!.success_title}
        </div>
        <div style={{ fontSize: '14px', color: '#8A8C98', marginBottom: '32px' }}>
          {t!.success_sub}
        </div>

        <div style={{
          background: '#fff', border: '0.5px solid #E4E0D8',
          borderRadius: '16px', padding: '20px 24px',
          width: '100%', maxWidth: '320px',
          display: 'flex', flexDirection: 'column', gap: '14px',
          marginBottom: '24px',
        }}>
          {[
            { label: 'Student',    value: form.student_name },
            { label: 'Activity',   value: selectedActivity?.name ?? '—' },
            { label: 'Instructor', value: selectedInstructor?.name ?? '—' },
            { label: 'Duration',   value: selectedActivity
              ? selectedActivity.default_duration_min >= 60
                ? `${Math.floor(selectedActivity.default_duration_min / 60)}h${selectedActivity.default_duration_min % 60 > 0 ? ` ${selectedActivity.default_duration_min % 60}min` : ''}`
                : `${selectedActivity.default_duration_min}min`
              : '—'
            },
            { label: 'Time', value: now },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '12px', color: '#8A8C98',
                fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {item.label}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#1A1C22' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          padding: '12px 20px', background: '#E0F8F5',
          borderRadius: '10px', fontSize: '13px',
          color: '#007868', fontWeight: '500',
        }}>
          Please wait near the launch area 🪁
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#C8C6C0' }}>
          {school.name}
        </div>
      </div>
    )
  }

  const canSubmit = agreed && gdpr && form.signature_data !== '' && !submitting
    && (!isMinor || (guardianName.trim().length > 2 && guardianConsent))

  return (
    <div style={{ minHeight: '100vh', background: '#F0EEE9', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>

      {/* Top bar */}
      <div style={{
        background: '#fff', padding: '16px 24px',
        borderBottom: '0.5px solid #E4E0D8',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1B4B5A' }}>{school.name}</div>
          <div style={{ fontSize: '11px', color: '#8A8C98', marginTop: '1px' }}>
            {step === 1 ? t!.step_info : step === 2 ? t!.step_activity : step === 3 ? t!.step_health : t!.step_waiver}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} style={{
              width: '24px', height: '3px', borderRadius: '2px',
              background: i < step ? '#00A896' : '#E4E0D8',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }}>

        {/* STEP 1 — Personal info */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1A1C22', marginBottom: '4px' }}>{t!.welcome}</h2>
              <p style={{ fontSize: '14px', color: '#8A8C98' }}>{t!.subtitle}</p>
            </div>

            <div>
              <label style={labelStyle}>{t!.name} *</label>

              {scheduledStudents.length > 0 && (
                <div style={{
                  fontSize: '12px',
                  color: '#0B5E75',
                  background: '#E8F8F7',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
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
                      const matches = scheduledStudents.filter(s =>
                        s.student_name.toLowerCase().includes(needle)
                      )
                      setFilteredStudents(matches)
                      setShowDropdown(matches.length > 0)
                    } else {
                      // show all scheduled when field is empty
                      setFilteredStudents(scheduledStudents)
                      setShowDropdown(scheduledStudents.length > 0)
                    }
                  }}
                  onFocus={() => {
                    if (scheduledStudents.length > 0) {
                      const needle = form.student_name.toLowerCase()
                      const matches = needle
                        ? scheduledStudents.filter(s =>
                            s.student_name.toLowerCase().includes(needle)
                          )
                        : scheduledStudents
                      setFilteredStudents(matches)
                      setShowDropdown(matches.length > 0)
                    }
                  }}
                  onBlur={() => {
                    // delay so click on dropdown item registers
                    setTimeout(() => setShowDropdown(false), 200)
                  }}
                  placeholder="João Silva"
                  autoComplete="name"
                  style={inputStyle}
                />

                {/* Dropdown */}
                {showDropdown && filteredStudents.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0, right: 0,
                    background: '#fff',
                    border: '1.5px solid #2EC4B6',
                    borderRadius: '12px',
                    zIndex: 50,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}>
                    <div style={{
                      padding: '8px 14px',
                      background: '#E8F8F7',
                      fontSize: '10px',
                      fontWeight: '600',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#0B5E75',
                      borderBottom: '0.5px solid #DDD8CF',
                    }}>
                      {lang === 'pt' ? 'Agendados hoje' : 'Scheduled today'}
                    </div>

                    {filteredStudents.map((student, i) => {
                      const time = new Date(student.scheduled_at)
                        .toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', {
                          hour: '2-digit', minute: '2-digit',
                        })
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onMouseDown={() => {
                            // use onMouseDown so it fires before onBlur
                            setForm(f => ({
                              ...f,
                              student_name:  student.student_name,
                              activity_id:   student.activity_id   ?? f.activity_id,
                              instructor_id: student.instructor_id ?? f.instructor_id,
                            }))
                            setShowDropdown(false)
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: i < filteredStudents.length - 1
                              ? '0.5px solid #F0EEE8' : 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#0B1F2E',
                              marginBottom: '2px',
                            }}>
                              {student.student_name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#8A8C98',
                            }}>
                              {student.activity_name ?? '—'}
                              {student.instructor_name && ` · ${student.instructor_name}`}
                            </div>
                          </div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#2EC4B6',
                            flexShrink: 0,
                          }}>
                            {time}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t!.nationality}</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.student_nationality}
                onChange={e => setForm(f => ({ ...f, student_nationality: e.target.value }))}
              >
                <option value="">—</option>
                {[
                  ['BR', '🇧🇷 Brazil'],
                  ['FR', '🇫🇷 France'],
                  ['DE', '🇩🇪 Germany'],
                  ['GB', '🇬🇧 United Kingdom'],
                  ['US', '🇺🇸 United States'],
                  ['AR', '🇦🇷 Argentina'],
                  ['CL', '🇨🇱 Chile'],
                  ['UY', '🇺🇾 Uruguay'],
                  ['ES', '🇪🇸 Spain'],
                  ['PT', '🇵🇹 Portugal'],
                  ['IT', '🇮🇹 Italy'],
                  ['NL', '🇳🇱 Netherlands'],
                  ['BE', '🇧🇪 Belgium'],
                  ['CH', '🇨🇭 Switzerland'],
                  ['AU', '🇦🇺 Australia'],
                  ['NZ', '🇳🇿 New Zealand'],
                  ['ZA', '🇿🇦 South Africa'],
                  ['MA', '🇲🇦 Morocco'],
                  ['MX', '🇲🇽 Mexico'],
                  ['CO', '🇨🇴 Colombia'],
                  ['OTHER', 'Other'],
                ].map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t!.dob}</label>
              <input
                style={inputStyle}
                type="date"
                value={form.date_of_birth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => {
                  const val = e.target.value
                  setForm(f => ({ ...f, date_of_birth: val }))
                  if (val) {
                    const age = Math.floor(
                      (Date.now() - new Date(val).getTime())
                      / (1000 * 60 * 60 * 24 * 365.25)
                    )
                    setIsMinor(age < 18)
                  } else {
                    setIsMinor(false)
                  }
                }}
              />
            </div>

            {isMinor && (
              <div style={{
                padding: '16px',
                background: '#FEF3C7',
                border: '1.5px solid #F59E0B',
                borderRadius: '12px',
              }}>
                <div style={{
                  fontSize: '14px', fontWeight: '700',
                  color: '#92400E', marginBottom: '8px',
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
                <div style={{
                  fontSize: '13px', color: '#92400E',
                  lineHeight: '1.6',
                }}>
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
              <label style={labelStyle}>{t!.email}</label>
              <input style={inputStyle} type="email" value={form.student_email}
                onChange={e => setForm(f => ({ ...f, student_email: e.target.value }))}
                placeholder="joao@email.com" autoComplete="email" />
            </div>
            <div>
              <label style={labelStyle}>{t!.whatsapp}</label>
              <input style={inputStyle} type="tel" value={form.student_whatsapp}
                onChange={e => setForm(f => ({ ...f, student_whatsapp: e.target.value }))}
                placeholder="+55 85 99999-9999" autoComplete="tel" />
            </div>

            <button
              onClick={() => { if (form.student_name.trim()) setStep(2) }}
              disabled={!form.student_name.trim()}
              style={{
                width: '100%', padding: '16px', marginTop: '8px',
                background: form.student_name.trim() ? '#1A1C22' : '#E4E0D8',
                color: form.student_name.trim() ? '#fff' : '#8A8C98',
                border: 'none', borderRadius: '14px', fontSize: '16px',
                fontWeight: '500', cursor: form.student_name.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              {t!.next} →
            </button>
          </div>
        )}

        {/* STEP 2 — Activity + instructor */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1A1C22', marginBottom: '4px' }}>{t!.step_activity}</h2>
            </div>

            <div>
              <label style={labelStyle}>{t!.activity}</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.activity_id}
                onChange={e => setForm(f => ({ ...f, activity_id: e.target.value }))}
              >
                <option value="">{t!.select_activity}</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '15px',
                fontWeight: '500',
                color: '#0B1F2E',
                marginBottom: '14px',
              }}>
                {lang === 'pt'
                  ? 'Como você chegou até nós?'
                  : 'How did you find us?'
                }
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {SOURCE_OPTIONS.map(opt => {
                  const active = source === opt.value
                  const showPartners = active &&
                    (opt.value === 'hotel' || opt.value === 'agencia') &&
                    partners.length > 0

                  const filteredPartners = partners.filter(p =>
                    opt.value === 'hotel'
                      ? p.type === 'hotel'
                      : p.type === 'agency' || p.type === 'operator'
                  )
                  const partnersToShow = filteredPartners.length === 0 ? partners : filteredPartners

                  return (
                    <div key={opt.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setSource(opt.value)
                          setStepError(null)
                          // clear partner if switching away from hotel/agency
                          if (opt.value !== 'hotel' && opt.value !== 'agencia') {
                            setPartnerId(null)
                          }
                        }}
                        style={{
                          padding: '13px 16px',
                          borderRadius: showPartners ? '12px 12px 0 0' : '12px',
                          border: `1.5px solid ${active ? '#2EC4B6' : '#DDD8CF'}`,
                          borderBottom: showPartners
                            ? '0.5px solid #DDD8CF'
                            : `1.5px solid ${active ? '#2EC4B6' : '#DDD8CF'}`,
                          background: active ? '#E8F8F7' : '#fff',
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
                        <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                        <span>{lang === 'pt' ? opt.labelPt : opt.labelEn}</span>
                        {active && !showPartners && (
                          <span style={{
                            marginLeft: 'auto',
                            color: '#2EC4B6',
                            fontSize: '16px',
                          }}>✓</span>
                        )}
                        {(opt.value === 'hotel' || opt.value === 'agencia') && (
                          <span style={{
                            marginLeft: 'auto',
                            color: active ? '#2EC4B6' : '#DDD8CF',
                            fontSize: '12px',
                          }}>
                            {active ? '▲' : '▼'}
                          </span>
                        )}
                      </button>

                      {/* Partner list — expands below hotel/agency */}
                      {showPartners && (
                        <div style={{
                          border: '1.5px solid #2EC4B6',
                          borderTop: 'none',
                          borderRadius: '0 0 12px 12px',
                          background: '#F8FFFE',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}>
                          {partnersToShow.map(partner => (
                            <PartnerButton
                              key={partner.id}
                              partner={partner}
                              active={partnerId === partner.id}
                              onSelect={() => { setPartnerId(partner.id); setStepError(null) }}
                            />
                          ))}

                          {/* Nudge if no partner selected */}
                          {!partnerId && (
                            <div style={{
                              padding: '6px 8px',
                              fontSize: '12px',
                              color: '#D97706',
                            }}>
                              {lang === 'pt'
                                ? 'Selecione o parceiro acima'
                                : 'Select the partner above'
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t!.instructor}</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.instructor_id}
                onChange={e => setForm(f => ({ ...f, instructor_id: e.target.value }))}>
                <option value="">{t!.select_instructor}</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            {stepError && (
              <div style={{
                padding: '12px 16px',
                background: '#FFF0EE',
                border: '0.5px solid #F4A89A',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#C0392B',
              }}>
                {stepError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '16px', background: '#fff', color: '#1A1C22',
                border: '0.5px solid #D8D2C8', borderRadius: '14px',
                fontSize: '16px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
              }}>← {t!.back}</button>
              <button onClick={() => {
                if (!source) {
                  setStepError(lang === 'pt'
                    ? 'Por favor selecione como você chegou até nós'
                    : 'Please select how you found us')
                  return
                }
                if ((source === 'hotel' || source === 'agencia') && !partnerId) {
                  setStepError(lang === 'pt'
                    ? 'Por favor selecione o parceiro que te indicou'
                    : 'Please select the partner that referred you')
                  return
                }
                setStepError(null)
                setStep(3)
              }} style={{
                flex: 2, padding: '16px', background: '#1A1C22', color: '#fff',
                border: 'none', borderRadius: '14px', fontSize: '16px',
                fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
              }}>{t!.next} →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Health + emergency */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1A1C22', marginBottom: '4px' }}>{t!.step_health}</h2>
              <p style={{ fontSize: '14px', color: '#8A8C98' }}>{t!.health_q}</p>
            </div>

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
                {t!.no_conditions}
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
                background: '#fff', borderRadius: '14px', cursor: 'pointer',
                fontSize: '15px', color: '#1A1C22',
                border: `1.5px solid ${hasHealth ? '#E8471A' : '#E4E0D8'}`,
              }}>
                <input type="radio" checked={hasHealth} onChange={() => setHasHealth(true)}
                  style={{ accentColor: '#E8471A', width: '18px', height: '18px' }} />
                Yes — I have a condition to declare
              </label>
            </div>

            {hasHealth && (
              <textarea
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', lineHeight: '1.5' }}
                placeholder={t!.health_placeholder}
                value={form.health_condition}
                onChange={e => setForm(f => ({ ...f, health_condition: e.target.value }))}
              />
            )}

            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1A1C22', marginBottom: '12px' }}>{t!.emergency}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input style={inputStyle} type="text" placeholder={t!.emergency_name}
                  value={form.emergency_name}
                  onChange={e => setForm(f => ({ ...f, emergency_name: e.target.value }))} />
                <input style={inputStyle} type="tel" placeholder={t!.emergency_phone}
                  value={form.emergency_phone}
                  onChange={e => setForm(f => ({ ...f, emergency_phone: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, padding: '16px', background: '#fff', color: '#1A1C22',
                border: '0.5px solid #D8D2C8', borderRadius: '14px',
                fontSize: '16px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
              }}>← {t!.back}</button>
              <button onClick={() => setStep(4)} style={{
                flex: 2, padding: '16px', background: '#1A1C22', color: '#fff',
                border: 'none', borderRadius: '14px', fontSize: '16px',
                fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
              }}>{t!.next} →</button>
            </div>
          </div>
        )}

        {/* STEP 4 — Waiver + signature */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ marginBottom: '4px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1A1C22', marginBottom: '4px' }}>{t!.waiver_title}</h2>
            </div>

            <div style={{
              background: '#E0F8F5',
              border: '0.5px solid #A0E8E0',
              borderRadius: '12px', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {(t!.waiver_points as string[]).map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#00A896', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#1A1C22', lineHeight: '1.5' }}>{point}</span>
                </div>
              ))}
            </div>

            <div style={{
              background: '#fff', borderRadius: '14px', padding: '16px',
              fontSize: '13px', color: '#4A4C58', lineHeight: '1.7',
              border: '0.5px solid #E4E0D8',
            }}>
              {(() => {
                const waiverKey = `waiver_${lang}` as keyof typeof school
                const dbWaiver = school[waiverKey] as string | null
                return dbWaiver || t!.waiver_text
              })()}
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1A1C22', marginBottom: '10px' }}>{t!.sign_below}</div>
              <div style={{
                background: '#fff', border: '0.5px solid #D8D2C8',
                borderRadius: '14px', overflow: 'hidden', position: 'relative',
              }}>
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
                  {t!.clear}
                </button>
              </div>
            </div>

            {isMinor && (
              <div style={{
                padding: '20px',
                background: '#fff',
                border: '1.5px solid #F59E0B',
                borderRadius: '14px',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: '700',
                  color: '#0B1F2E',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  marginBottom: '16px',
                }}>
                  {lang === 'pt' ? 'Autorização do responsável legal'
                    : lang === 'fr' ? 'Autorisation du tuteur légal'
                    : lang === 'es' ? 'Autorización del tutor legal'
                    : 'Legal guardian authorization'}
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block', fontSize: '13px',
                    fontWeight: '500', color: '#0B1F2E',
                    marginBottom: '6px',
                  }}>
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
                    style={{
                      ...inputStyle,
                      border: '1px solid #DDD8CF',
                    }}
                  />
                </div>

                <label style={{
                  display: 'flex', alignItems: 'flex-start',
                  gap: '12px', cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={guardianConsent}
                    onChange={e => setGuardianConsent(e.target.checked)}
                    style={{
                      width: '20px', height: '20px',
                      marginTop: '2px', flexShrink: 0,
                      accentColor: '#F59E0B', cursor: 'pointer',
                    }}
                  />
                  <span style={{
                    fontSize: '13px', color: '#0B1F2E',
                    lineHeight: '1.6',
                  }}>
                    {lang === 'pt'
                      ? 'Eu, responsável legal pelo menor acima identificado, autorizo sua participação nas atividades e declaro estar ciente dos riscos envolvidos.'
                      : lang === 'fr'
                      ? "En tant que tuteur légal du mineur identifié ci-dessus, j'autorise sa participation aux activités et reconnais les risques impliqués."
                      : lang === 'es'
                      ? 'Yo, tutor legal del menor identificado arriba, autorizo su participación en las actividades y reconozco los riesgos involucrados.'
                      : 'I, as the legal guardian of the minor identified above, authorize their participation in the activities and acknowledge the risks involved.'
                    }
                  </span>
                </label>
              </div>
            )}

            <label style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer',
              padding: '14px 16px', background: '#fff', borderRadius: '12px',
              border: `1.5px solid ${agreed ? '#00A896' : '#E4E0D8'}`,
            }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ accentColor: '#00A896', marginTop: '2px', width: '18px', height: '18px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#4A4C58', lineHeight: '1.5' }}>{t!.i_agree}</span>
            </label>

            <label style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer',
              padding: '14px 16px', background: '#fff', borderRadius: '12px',
              border: `1.5px solid ${gdpr ? '#00A896' : '#E4E0D8'}`,
            }}>
              <input type="checkbox" checked={gdpr} onChange={e => setGdpr(e.target.checked)}
                style={{ accentColor: '#00A896', marginTop: '2px', width: '18px', height: '18px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#4A4C58', lineHeight: '1.5' }}>{t!.gdpr}</span>
            </label>

            {submitError && (
              <div style={{
                padding: '12px 16px',
                background: '#FFF0EE',
                border: '0.5px solid #F4A89A',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#C0392B',
                marginTop: '4px',
              }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={() => setStep(3)} style={{
                flex: 1, padding: '16px', background: '#fff', color: '#1A1C22',
                border: '0.5px solid #D8D2C8', borderRadius: '14px',
                fontSize: '16px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
              }}>← {t!.back}</button>
              <button
                onClick={submit}
                disabled={!canSubmit}
                style={{
                  flex: 2, padding: '16px', border: 'none', borderRadius: '14px',
                  fontSize: '16px', fontWeight: '500', fontFamily: 'inherit',
                  background: canSubmit ? '#00A896' : '#E4E0D8',
                  color: canSubmit ? '#fff' : '#8A8C98',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {submitting ? t!.submitting : t!.submit}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
