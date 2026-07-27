'use client'

import { useState } from 'react'
import MaskableValue from '@/components/MaskableValue'
import CheckinQRButton from '@/components/CheckinQRButton'
import { formatCurrency } from '@/lib/currency'

type TodayStats = { students: number; sessions: number; revenue: number; commissions: number }
type MonthComparison = {
  lessonDelta: number | null; thisMonthLessons: number
  revenueDelta: number | null; thisMonthRevenue: number; lastMonthRevenue: number
}

type ModalType = 'students' | 'lessons' | 'revenue' | 'commissions'

type CheckinRow = {
  id: string; student_name: string; checkin_at: string
  waiver_signed_at: string | null; stage: string | null
  activities: { name: string } | { name: string }[] | null
}
type SessionRow = {
  id: string; duration_min: number; price: number
  commission_amount: number | null; payment_method: string | null
  activities: { name: string } | { name: string }[] | null
  users: { name: string } | { name: string }[] | null
  checkins: { student_name: string } | { student_name: string }[] | null
  // Fallback source when checkins is null — group-confirmed lessons (and
  // any individual one confirmed without going through the check-in
  // kiosk) have no checkin at all, see confirm-lesson/route.ts.
  scheduled_lessons: { student_name: string } | { student_name: string }[] | null
}

function sessionStudentName(s: SessionRow): string {
  return one(s.checkins)?.student_name ?? one(s.scheduled_lessons)?.student_name ?? '—'
}
type ScheduledRow = {
  id: string; student_name: string; scheduled_at: string; duration_min: number
  activities: { name: string } | { name: string }[] | null
  instructor: { name: string } | { name: string }[] | null
}
type DetailData = { checkins: CheckinRow[]; sessions: SessionRow[]; scheduledToday: ScheduledRow[] }

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function fmt(n: number | null | undefined) {
  return formatCurrency(n, { decimals: 2 })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' })
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX', dinheiro: 'Dinheiro', cartao: 'Cartão', a_receber: 'A receber', pacote: 'Pacote',
}

const STAGE_LABELS: Record<string, string> = {
  sala_de_espera: 'Sala de Espera', na_agua: 'Na Água', concluido: 'Concluído',
}

const modalTitles: Record<ModalType, string> = {
  students: 'Alunos de hoje',
  lessons: 'Aulas de hoje',
  revenue: 'Receita de hoje',
  commissions: 'Comissões de hoje',
}

/** The Spot's "Hoje" widget — 4 metric cards, each opening a detail view of
 *  the exact numbers behind it (checkins for Alunos; today's realized
 *  sessions for Aulas/Receita/Comissões, same session_date filter
 *  getTodayStats' own figures use, so the modal totals always match the
 *  card numbers; Aulas also shows still-scheduled/unconfirmed lessons as a
 *  secondary section). One shared fetch (getTodayDetail) backs all four —
 *  they're slices of the same day, not independent queries — cached after
 *  the first card click so switching between modals doesn't re-fetch. */
export default function SpotTodayStats({
  today, monthComparison, occupancyPct, studentsInWaterNow, todayLabel,
  slug, schoolName,
}: {
  today: TodayStats
  monthComparison: MonthComparison
  occupancyPct: number | null
  studentsInWaterNow: number
  todayLabel: string
  slug: string
  schoolName: string
}) {
  const [activeModal, setActiveModal] = useState<ModalType | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(false)

  function openModal(type: ModalType) {
    setActiveModal(type)
    if (!detail && !loading) {
      setLoading(true)
      fetch('/api/owner/today-detail')
        .then(r => r.json())
        .then(data => { if (data.ok) setDetail(data) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }

  const cardButtonStyle: React.CSSProperties = {
    background: 'var(--color-pb-powder)', borderRadius: 'var(--radius-md)',
    padding: '10px 12px', width: '100%', textAlign: 'left',
    border: 'none', fontFamily: 'var(--font-sans)', cursor: 'pointer',
  }

  return (
    <div style={{
      position: 'relative',
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      padding: '24px',
    }}>
      {studentsInWaterNow > 0 && (
        <div
          title="Alunos com aula em andamento agora, com base no horário e duração agendados"
          style={{
            position: 'absolute', top: '-8px', right: '12px',
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-pb-live-bg)',
            color: 'var(--color-pb-live)', fontSize: '11px', fontWeight: '600',
            boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap',
          }}
        >
          {studentsInWaterNow} na água agora
        </div>
      )}
      <div style={{
        fontSize: '10px', fontWeight: '600',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--mist)', marginBottom: '14px',
      }}>
        {todayLabel}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button type="button" className="pb-card-interactive" onClick={() => openModal('students')} style={cardButtonStyle}>
          <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
            Alunos
          </div>
          <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {today.students}
          </div>
        </button>

        <button type="button" className="pb-card-interactive" onClick={() => openModal('lessons')} style={cardButtonStyle}>
          <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
            Aulas
          </div>
          <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {today.sessions}
            {monthComparison.lessonDelta !== null && monthComparison.thisMonthLessons > 0 && (
              <span style={{
                fontSize: '11px',
                color: monthComparison.lessonDelta >= 0 ? 'var(--color-pb-glacial-dark)' : '#DC2626',
                marginLeft: '6px',
              }}>
                {monthComparison.lessonDelta >= 0 ? '▲' : '▼'}{Math.abs(monthComparison.lessonDelta).toFixed(0)}%
              </span>
            )}
          </div>
          {monthComparison.thisMonthLessons === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '4px' }}>
              Início do período
            </div>
          )}
        </button>

        <button type="button" className="pb-card-interactive" onClick={() => openModal('revenue')} style={cardButtonStyle}>
          <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
            Receita
          </div>
          <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            <MaskableValue>{fmt(today.revenue ?? 0)}</MaskableValue>
          </div>
          {monthComparison.thisMonthRevenue === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '4px' }}>
              Início do período
            </div>
          ) : monthComparison.revenueDelta !== null ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', marginTop: '4px', flexWrap: 'wrap',
            }}>
              <span style={{
                color: monthComparison.revenueDelta >= 0 ? 'var(--color-pb-glacial-dark)' : '#DC2626',
                fontWeight: '600',
              }}>
                {monthComparison.revenueDelta >= 0 ? '▲' : '▼'} {Math.abs(monthComparison.revenueDelta).toFixed(1)}%
              </span>
              <span style={{ color: 'var(--mist)' }}>
                vs. mês passado
              </span>
            </div>
          ) : monthComparison.lastMonthRevenue === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--mist)', marginTop: '4px' }}>
              Primeiro mês de operação
            </div>
          )}
        </button>

        <button type="button" className="pb-card-interactive" onClick={() => openModal('commissions')} style={cardButtonStyle}>
          <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '4px', fontWeight: '500' }}>
            Comissões
          </div>
          <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            <MaskableValue>{fmt(today.commissions ?? 0)}</MaskableValue>
          </div>
        </button>
      </div>

      <div style={{ height: '1px', background: 'var(--border)', margin: '14px 0 10px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--mist)', fontWeight: '500' }}>
          Ocupação da Equipe
        </span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
          {occupancyPct === null ? '—' : `${occupancyPct}%`}
        </span>
      </div>
      <div style={{ height: '6px', background: 'var(--powder)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${occupancyPct === null ? 0 : Math.min(100, Math.max(0, occupancyPct))}%`,
          background: 'var(--glacial-dark)',
          borderRadius: '99px',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {activeModal && (
        <DetailModal
          type={activeModal}
          detail={detail}
          loading={loading}
          onClose={() => setActiveModal(null)}
          slug={slug}
          schoolName={schoolName}
        />
      )}
    </div>
  )
}

function DetailModal({
  type, detail, loading, onClose, slug, schoolName,
}: {
  type: ModalType
  detail: DetailData | null
  loading: boolean
  onClose: () => void
  slug: string
  schoolName: string
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 250, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '560px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px', borderBottom: '0.5px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)' }}>
            {modalTitles[type]}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--mist)', padding: '4px 8px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '18px 22px' }}>
          {loading || !detail ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
              Carregando...
            </div>
          ) : type === 'students' ? (
            <StudentsList checkins={detail.checkins} slug={slug} schoolName={schoolName} />
          ) : type === 'lessons' ? (
            <LessonsList sessions={detail.sessions} scheduledToday={detail.scheduledToday} />
          ) : type === 'revenue' ? (
            <RevenueList sessions={detail.sessions} />
          ) : (
            <CommissionsList sessions={detail.sessions} />
          )}
        </div>
      </div>
    </div>
  )
}

const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 0', borderBottom: '0.5px solid var(--border)',
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
      {text}
    </div>
  )
}

function StudentsList({ checkins, slug, schoolName }: { checkins: CheckinRow[]; slug: string; schoolName: string }) {
  // Which student's QR is currently requested, plus a per-click nonce —
  // CheckinQRButton (hideTrigger) only reads its defaultOpen prop once at
  // mount, so re-requesting the SAME student after closing needs a fresh
  // key to force a remount, not just the same studentName again.
  const [qrRequest, setQrRequest] = useState<{ student: string; nonce: number } | null>(null)

  if (checkins.length === 0) return <EmptyRow text="Nenhum check-in hoje." />
  return (
    <div>
      {checkins.map(c => (
        <div key={c.id} style={rowStyle}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>{c.student_name}</div>
            <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>
              {one(c.activities)?.name ?? '—'} · {fmtTime(c.checkin_at)}
              {c.stage && ` · ${STAGE_LABELS[c.stage] ?? c.stage}`}
            </div>
          </div>
          {c.waiver_signed_at ? (
            <span style={{
              padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '500',
              background: 'var(--color-pb-glacial-light)', color: 'var(--color-pb-glacial-dark)',
            }}>
              Termo OK
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setQrRequest(prev => ({ student: c.student_name, nonce: (prev?.nonce ?? 0) + 1 }))}
              title={`Abrir QR Code de check-in — ${c.student_name}`}
              style={{
                padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '500',
                background: 'var(--signal-light)', color: 'var(--signal-dark)',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              Termo pendente
            </button>
          )}
        </div>
      ))}

      {qrRequest && (
        <CheckinQRButton
          key={`${qrRequest.student}-${qrRequest.nonce}`}
          hideTrigger
          defaultOpen
          slug={slug}
          schoolName={schoolName}
          studentName={qrRequest.student}
        />
      )}
    </div>
  )
}

function LessonsList({ sessions, scheduledToday }: { sessions: SessionRow[]; scheduledToday: ScheduledRow[] }) {
  if (sessions.length === 0 && scheduledToday.length === 0) return <EmptyRow text="Nenhuma aula hoje." />
  return (
    <div>
      {sessions.length > 0 && (
        <>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '6px' }}>
            Confirmadas
          </div>
          {sessions.map(s => (
            <div key={s.id} style={rowStyle}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                  {sessionStudentName(s)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>
                  {one(s.activities)?.name ?? '—'} · {one(s.users)?.name ?? '—'} · {s.duration_min}min
                </div>
              </div>
              <span style={{
                padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '500',
                background: 'var(--color-pb-glacial-light)', color: 'var(--color-pb-glacial-dark)',
              }}>
                Confirmada
              </span>
            </div>
          ))}
        </>
      )}
      {scheduledToday.length > 0 && (
        <>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mist)', margin: '16px 0 6px' }}>
            Ainda agendadas hoje
          </div>
          {scheduledToday.map(s => (
            <div key={s.id} style={rowStyle}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>{s.student_name}</div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>
                  {one(s.activities)?.name ?? '—'} · {one(s.instructor)?.name ?? '—'} · {fmtTime(s.scheduled_at)}
                </div>
              </div>
              <span style={{
                padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '500',
                background: 'var(--amber-light)', color: 'var(--amber)',
              }}>
                Agendada
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function RevenueList({ sessions }: { sessions: SessionRow[] }) {
  if (sessions.length === 0) return <EmptyRow text="Nenhuma venda confirmada hoje." />
  const total = sessions.reduce((s, r) => s + (r.price ?? 0), 0)
  return (
    <div>
      {sessions.map(s => (
        <div key={s.id} style={rowStyle}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
              {sessionStudentName(s)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>
              {one(s.activities)?.name ?? '—'}
              {s.payment_method && ` · ${PAYMENT_LABELS[s.payment_method] ?? s.payment_method}`}
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(s.price)}
          </span>
        </div>
      ))}
      <div style={{ ...rowStyle, borderBottom: 'none', paddingTop: '14px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Total
        </span>
        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
          {fmt(total)}
        </span>
      </div>
    </div>
  )
}

function CommissionsList({ sessions }: { sessions: SessionRow[] }) {
  const byInstructor = new Map<string, { name: string; total: number; count: number }>()
  for (const s of sessions) {
    const name = one(s.users)?.name ?? '—'
    const row = byInstructor.get(name) ?? { name, total: 0, count: 0 }
    row.total += s.commission_amount ?? 0
    row.count += 1
    byInstructor.set(name, row)
  }
  const rows = [...byInstructor.values()].sort((a, b) => b.total - a.total)
  if (rows.length === 0) return <EmptyRow text="Nenhuma comissão gerada hoje." />
  const total = rows.reduce((s, r) => s + r.total, 0)
  return (
    <div>
      {rows.map(r => (
        <div key={r.name} style={rowStyle}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>{r.name}</span>
            <span style={{ fontSize: '11px', color: 'var(--mist)', marginLeft: '6px' }}>({r.count} aula{r.count !== 1 ? 's' : ''})</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(r.total)}
          </span>
        </div>
      ))}
      <div style={{ ...rowStyle, borderBottom: 'none', paddingTop: '14px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Total
        </span>
        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
          {fmt(total)}
        </span>
      </div>
    </div>
  )
}
