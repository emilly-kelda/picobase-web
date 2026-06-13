import { getPayments } from '@/repositories/crewRepository'
import PaymentsClient from './PaymentsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period } = await searchParams
  const { payments, period: activePeriod } = await getPayments(SCHOOL_ID, period)

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  return (
    <PaymentsClient
      payments={payments}
      period={activePeriod}
      monthOptions={monthOptions}
    />
  )
}


