import { getPayments, getPartnerCommissions } from '@/repositories/crewRepository'
import PaymentsClient from './PaymentsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period } = await searchParams
  const activePeriod = period ?? new Date().toISOString().slice(0, 7)

  const [{ payments, period: resolvedPeriod, summary }, partnerCommissions] = await Promise.all([
    getPayments(SCHOOL_ID, period),
    getPartnerCommissions(SCHOOL_ID, activePeriod),
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
    />
  )
}
