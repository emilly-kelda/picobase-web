import { getPayments, getPartnerCommissions, closeMonth } from '@/repositories/crewRepository'
import { getInstructors } from '@/repositories/studentRepository'
import PaymentsClient from './PaymentsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; instructor?: string }>
}) {
  const { period, instructor } = await searchParams
  const activePeriod = period ?? new Date().toISOString().slice(0, 7)

  // Auto-recalculate before reading: `payments` is a snapshot table that
  // only updates when someone clicks "Recalcular período", so it silently
  // drifts from the live `sessions` table whenever a lesson is confirmed,
  // edited, or removed afterward. This was the real cause of the
  // Aulas-vs-Pagamentos divergence — not currency/payout-model exclusion,
  // since close_month's SUM(s.price)/SUM(s.commission_amount) already
  // include foreign-currency (BRL-converted at confirm time) and
  // fixed-payout-model sessions correctly. Swallow errors so a transient
  // RPC hiccup doesn't crash the page — the manual button stays as a
  // fallback.
  try {
    await closeMonth(SCHOOL_ID, activePeriod)
  } catch {}

  const [{ payments, period: resolvedPeriod, summary }, partnerCommissions, instructors] = await Promise.all([
    getPayments(SCHOOL_ID, period, instructor),
    getPartnerCommissions(SCHOOL_ID, activePeriod),
    getInstructors(SCHOOL_ID),
  ])

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  const normalizedPayments = payments.map(p => ({
    ...p,
    users: Array.isArray(p.users) ? (p.users[0] ?? null) : (p.users ?? null),
  }))

  return (
    <PaymentsClient
      payments={normalizedPayments as any}
      period={resolvedPeriod}
      summary={summary}
      monthOptions={monthOptions}
      partnerCommissions={partnerCommissions}
      instructors={instructors}
      activeInstructor={instructor ?? ''}
    />
  )
}
