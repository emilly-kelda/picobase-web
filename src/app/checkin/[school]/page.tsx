'use client'

import React, { useState, useEffect } from 'react'

export default function CheckinPage({
  params
}: {
  params: Promise<{ school: string }>
}) {
  const { school } = React.use(params)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    student_name: '',
    student_email: '',
    student_whatsapp: '',
    student_nationality: '',
    activity_id: '',
    instructor_id: '',
    health_condition: '',
    emergency_name: '',
    emergency_phone: '',
    lgpd_consent: false,
    gdpr_consent: false,
  })

  const [activities, setActivities] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [signature, setSignature] = useState<string>('')
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isSigning, setIsSigning] = useState(false)

  useEffect(() => {
    fetch(`/api/checkin?slug=${school}`)
      .then(r => r.json())
      .then(data => {
        setActivities(data.activities || [])
        setInstructors(data.instructors || [])
      })
  }, [school])

  function update(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function startSign(e: React.MouseEvent | React.TouchEvent) {
    setIsSigning(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function drawSign(e: React.MouseEvent | React.TouchEvent) {
    if (!isSigning) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function endSign() {
    setIsSigning(false)
    const canvas = canvasRef.current
    if (!canvas) return
    setSignature(canvas.toDataURL('image/png'))
  }

  function clearSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature('')
  }

  async function submit() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: school, ...form, signature }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }

      setStep(5)

    } catch (e) {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  // ── STEP 1: Personal info ──
  if (step === 1) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.step}>Step 1 of 4</p>
        <h1 style={styles.title}>Who are you?</h1>

        <label style={styles.label}>Full name *</label>
        <input
          style={styles.input}
          placeholder="Your full name"
          value={form.student_name}
          onChange={e => update('student_name', e.target.value)}
        />

        <label style={styles.label}>Email *</label>
        <input
          style={styles.input}
          type="email"
          placeholder="your@email.com"
          value={form.student_email}
          onChange={e => update('student_email', e.target.value)}
        />

        <label style={styles.label}>WhatsApp (optional)</label>
        <input
          style={styles.input}
          placeholder="+55 88 9 9999-0000"
          value={form.student_whatsapp}
          onChange={e => update('student_whatsapp', e.target.value)}
        />

        <label style={styles.label}>Nationality *</label>
        <select
          style={styles.input}
          value={form.student_nationality}
          onChange={e => update('student_nationality', e.target.value)}
        >
          <option value="">Select country</option>
          <option value="BR">🇧🇷 Brazil</option>
          <option value="US">🇺🇸 United States</option>
          <option value="GB">🇬🇧 United Kingdom</option>
          <option value="FR">🇫🇷 France</option>
          <option value="DE">🇩🇪 Germany</option>
          <option value="AR">🇦🇷 Argentina</option>
          <option value="ES">🇪🇸 Spain</option>
          <option value="IT">🇮🇹 Italy</option>
          <option value="OTHER">🌍 Other</option>
        </select>

        <label style={styles.label}>Activity *</label>
        <select
          style={styles.input}
          value={form.activity_id}
          onChange={e => update('activity_id', e.target.value)}
        >
          <option value="">Select activity</option>
          {activities.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <label style={styles.label}>Instructor *</label>
        <select
          style={styles.input}
          value={form.instructor_id}
          onChange={e => update('instructor_id', e.target.value)}
        >
          <option value="">Select instructor</option>
          {instructors.map(i => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>

        <button
          style={styles.button}
          onClick={() => {
            if (!form.student_name || !form.student_email ||
                !form.student_nationality || !form.activity_id) {
              setError('Please fill in all required fields.')
              return
            }
            setError('')
            setStep(2)
          }}
        >
          Continue →
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )

  // ── STEP 2: Health + emergency ──
  if (step === 2) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.step}>Step 2 of 4</p>
        <h1 style={styles.title}>Health & safety</h1>

        <label style={styles.label}>
          Any health condition we should know about?
        </label>
        <textarea
          style={{ ...styles.input, height: '80px', resize: 'none' }}
          placeholder="Leave blank if none"
          value={form.health_condition}
          onChange={e => update('health_condition', e.target.value)}
        />

        <label style={styles.label}>Emergency contact name *</label>
        <input
          style={styles.input}
          placeholder="Full name"
          value={form.emergency_name}
          onChange={e => update('emergency_name', e.target.value)}
        />

        <label style={styles.label}>Emergency contact phone *</label>
        <input
          style={styles.input}
          placeholder="+55 88 9 9999-0000"
          value={form.emergency_phone}
          onChange={e => update('emergency_phone', e.target.value)}
        />

        <div style={styles.row}>
          <button style={styles.buttonSecondary} onClick={() => setStep(1)}>
            ← Back
          </button>
          <button
            style={styles.button}
            onClick={() => {
              if (!form.emergency_name || !form.emergency_phone) {
                setError('Emergency contact is required.')
                return
              }
              setError('')
              setStep(3)
            }}
          >
            Continue →
          </button>
        </div>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )

  // ── STEP 3: Waiver ──
  if (step === 3) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.step}>Step 3 of 4</p>
        <h1 style={styles.title}>Waiver & consent</h1>

        <div style={styles.waiverBox}>

          {/* English */}
          {!['BR','AR','ES','PT','MX','CO','CL'].includes(form.student_nationality) && (
            <>
              <p style={styles.waiverTitle}>LIABILITY WAIVER AND RELEASE</p>
              <p style={styles.waiverText}>
                I, the undersigned, hereby acknowledge that I have voluntarily chosen to
                participate in water sports and related activities ("Activities") offered
                by the school. I fully understand that these Activities involve inherent
                risks, dangers, and hazards, including but not limited to: drowning,
                collision with equipment or other participants, strong winds and currents,
                physical exhaustion, and serious bodily injury or death.
              </p>
              <p style={styles.waiverText}>
                In consideration of being permitted to participate in the Activities,
                I hereby release, waive, discharge, and hold harmless the school, its
                owners, directors, instructors, employees, and agents from any and all
                claims, demands, losses, damages, or liability arising from my
                participation, including claims arising from negligence.
              </p>
              <p style={styles.waiverText}>
                I confirm that I am in good physical health and have no medical conditions
                that would prevent safe participation, except as disclosed in this form.
                I authorize the school to seek emergency medical treatment on my behalf
                if I am unable to do so, and I accept full financial responsibility for
                any such treatment.
              </p>
              <p style={styles.waiverText}>
                I agree to follow all safety instructions provided by the school and its
                instructors at all times. I acknowledge that failure to do so may result
                in my removal from the activity without refund.
              </p>
              <p style={styles.waiverText}>
                I grant the school permission to use photographs or videos taken during
                my participation for promotional purposes, unless I notify the school
                otherwise in writing.
              </p>
              <p style={styles.waiverText}>
                This waiver shall be binding upon myself, my heirs, executors,
                administrators, and legal representatives. I have read and fully
                understand this document and sign it voluntarily.
              </p>
            </>
          )}

          {/* Portuguese — Brazil */}
          {form.student_nationality === 'BR' && (
            <>
              <p style={styles.waiverTitle}>TERMO DE RESPONSABILIDADE E ISENÇÃO</p>
              <p style={styles.waiverText}>
                Eu, abaixo identificado, declaro que participo voluntariamente das
                atividades aquáticas e esportivas oferecidas pela escola ("Atividades").
                Estou plenamente ciente de que estas Atividades envolvem riscos inerentes,
                incluindo mas não se limitando a: afogamento, colisão com equipamentos ou
                outros participantes, ventos e correntes fortes, exaustão física e lesões
                corporais graves ou morte.
              </p>
              <p style={styles.waiverText}>
                Em contrapartida pela autorização de participação, isento e exonero a
                escola, seus proprietários, diretores, instrutores, funcionários e
                prepostos de quaisquer reclamações, demandas, perdas, danos ou
                responsabilidades decorrentes da minha participação, inclusive por atos
                de negligência, nos termos do artigo 945 do Código Civil Brasileiro.
              </p>
              <p style={styles.waiverText}>
                Declaro que estou em boas condições físicas de saúde e não possuo
                condições médicas que impeçam a participação segura nas atividades,
                exceto as informadas neste formulário. Autorizo a escola a solicitar
                atendimento médico de emergência em meu nome caso eu seja incapaz de
                fazê-lo, responsabilizando-me pelos custos decorrentes.
              </p>
              <p style={styles.waiverText}>
                Comprometo-me a seguir todas as instruções de segurança fornecidas pela
                escola e seus instrutores. Reconheço que o descumprimento poderá resultar
                na minha exclusão da atividade sem direito a reembolso.
              </p>
              <p style={styles.waiverText}>
                Autorizo o uso de fotografias e vídeos registrados durante minha
                participação para fins promocionais, salvo comunicação contrária por
                escrito à escola, conforme a Lei nº 9.610/1998 (Direitos Autorais) e
                a LGPD (Lei nº 13.709/2018).
              </p>
              <p style={styles.waiverText}>
                Declaro ter lido, compreendido e aceito integralmente os termos deste
                documento, assinando-o de forma livre e espontânea.
              </p>
            </>
          )}

          {/* Spanish — Argentina + other Spanish-speaking */}
          {['AR','ES','MX','CO','CL','UY','PE','EC','VE','BO','PY'].includes(form.student_nationality) && (
            <>
              <p style={styles.waiverTitle}>TÉRMINO DE RESPONSABILIDAD Y EXENCIÓN</p>
              <p style={styles.waiverText}>
                Yo, el abajo firmante, declaro que participo voluntariamente en las
                actividades acuáticas y deportivas ofrecidas por la escuela
                ("Actividades"). Soy plenamente consciente de que estas Actividades
                conllevan riesgos inherentes, incluyendo pero no limitándose a:
                ahogamiento, colisión con equipos u otros participantes, vientos y
                corrientes fuertes, agotamiento físico y lesiones corporales graves
                o muerte.
              </p>
              <p style={styles.waiverText}>
                A cambio de la autorización para participar, eximo y libero a la escuela,
                sus propietarios, directores, instructores, empleados y representantes de
                cualquier reclamación, demanda, pérdida, daño o responsabilidad derivada
                de mi participación, incluyendo actos de negligencia.
              </p>
              <p style={styles.waiverText}>
                Declaro que me encuentro en buenas condiciones físicas de salud y no
                poseo condiciones médicas que impidan la participación segura en las
                actividades, excepto las informadas en este formulario. Autorizo a la
                escuela a solicitar atención médica de emergencia en mi nombre si no
                puedo hacerlo yo mismo, aceptando la responsabilidad financiera por
                dicha atención.
              </p>
              <p style={styles.waiverText}>
                Me comprometo a seguir todas las instrucciones de seguridad
                proporcionadas por la escuela y sus instructores en todo momento.
                Reconozco que el incumplimiento podrá resultar en mi exclusión de la
                actividad sin derecho a reembolso.
              </p>
              <p style={styles.waiverText}>
                Autorizo el uso de fotografías o videos tomados durante mi participación
                con fines promocionales, salvo notificación contraria por escrito a la
                escuela.
              </p>
              <p style={styles.waiverText}>
                Declaro haber leído, comprendido y aceptado íntegramente los términos
                de este documento, firmándolo de forma libre y voluntaria.
              </p>
            </>
          )}

        </div>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.lgpd_consent}
            onChange={e => update('lgpd_consent', e.target.checked)}
            style={{ marginRight: '10px', width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '13px' }}>
            I consent to my personal data being processed in accordance 
            with LGPD (Lei nº 13.709/2018) and applicable privacy laws. *
          </span>
        </label>

        {['FR','DE','IT','ES','GB','NL','BE','AT','PT'].includes(form.student_nationality) && (
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.gdpr_consent || false}
              onChange={e => update('gdpr_consent', e.target.checked)}
              style={{ marginRight: '10px', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '13px' }}>
              I consent to GDPR data processing (EU Regulation 2016/679). *
            </span>
          </label>
        )}

        <div style={{ marginTop: '16px', marginBottom: '8px' }}>
          <div style={styles.signLabel}>Sign below *</div>
          <div style={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              width={340}
              height={120}
              style={styles.canvas}
              onMouseDown={startSign}
              onMouseMove={drawSign}
              onMouseUp={endSign}
              onMouseLeave={endSign}
              onTouchStart={startSign}
              onTouchMove={drawSign}
              onTouchEnd={endSign}
            />
            {!signature && (
              <div style={styles.canvasPlaceholder}>
                Sign here with your finger or mouse
              </div>
            )}
          </div>
          {signature && (
            <button style={styles.clearBtn} onClick={clearSignature}>
              ✕ Clear signature
            </button>
          )}
        </div>

        <div style={styles.row}>
          <button style={styles.buttonSecondary} onClick={() => setStep(2)}>
            ← Back
          </button>
          <button
            style={styles.button}
            onClick={() => {
              if (!form.lgpd_consent) {
                setError('You must accept the consent to proceed.')
                return
              }
              if (!signature) {
                setError('Please sign the waiver before continuing.')
                return
              }
              setError('')
              setStep(4)
            }}
          >
            Continue →
          </button>
        </div>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )

  // ── STEP 4: Review + submit ──
  if (step === 4) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.step}>Step 4 of 4</p>
        <h1 style={styles.title}>Confirm & check in</h1>

        <div style={styles.reviewBox}>
          <div style={styles.reviewRow}>
            <span style={styles.reviewLabel}>Name</span>
            <span style={styles.reviewValue}>{form.student_name}</span>
          </div>
          <div style={styles.reviewRow}>
            <span style={styles.reviewLabel}>Email</span>
            <span style={styles.reviewValue}>{form.student_email}</span>
          </div>
          <div style={styles.reviewRow}>
            <span style={styles.reviewLabel}>Nationality</span>
            <span style={styles.reviewValue}>{form.student_nationality}</span>
          </div>
          <div style={styles.reviewRow}>
            <span style={styles.reviewLabel}>Emergency contact</span>
            <span style={styles.reviewValue}>{form.emergency_name}</span>
          </div>
          {form.health_condition && (
            <div style={{ ...styles.reviewRow, background: '#fff3cd', borderRadius: '6px', padding: '8px' }}>
              <span style={styles.reviewLabel}>⚠️ Health</span>
              <span style={styles.reviewValue}>{form.health_condition}</span>
            </div>
          )}
        </div>

        <button
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : '✓ Confirm check-in'}
        </button>

        <button style={styles.buttonSecondary} onClick={() => setStep(3)}>
          ← Back
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )

  // ── STEP 5: Success ──
  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h1 style={styles.title}>You're checked in!</h1>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Your waiver has been recorded. Have a great session!
        </p>
        <p style={{ color: '#888', fontSize: '12px', marginTop: '24px' }}>
          Check your email for a confirmation.
        </p>
      </div>
    </div>
  )
}

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f7f4ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px 24px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  step: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#555',
    marginBottom: '6px',
    marginTop: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    background: '#fafafa',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '13px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '20px',
  },
  buttonSecondary: {
    padding: '10px 16px',
    background: 'none',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '12px',
  },
  row: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginTop: '8px',
  },
  error: {
    color: '#c53030',
    fontSize: '13px',
    marginTop: '10px',
  },
  waiverBox: {
    background: '#f8f8f8',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '16px',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  waiverTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '10px',
  },
  waiverText: {
    fontSize: '12px',
    color: '#555',
    lineHeight: '1.6',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    cursor: 'pointer',
  },
  signLabel: {
    fontSize: '13px',
    color: '#555',
    marginBottom: '8px',
  },
  canvasWrap: {
    position: 'relative' as const,
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fafafa',
    overflow: 'hidden',
    touchAction: 'none',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '120px',
    cursor: 'crosshair',
  },
  canvasPlaceholder: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '12px',
    color: '#bbb',
    pointerEvents: 'none' as const,
    textAlign: 'center' as const,
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: 'system-ui, sans-serif',
  },
  reviewBox: {
    background: '#f8f8f8',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  reviewLabel: {
    color: '#888',
  },
  reviewValue: {
    color: '#1a1a1a',
    fontWeight: 500,
    textAlign: 'right',
    maxWidth: '60%',
  },
}