import { getPartners } from '@/repositories/partnerRepository'
import { getSchoolSlug } from '@/repositories/bookingRepository'
import { getPartnerCommissions } from '@/repositories/crewRepository'
import PartnersClient from './PartnersClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function PartnersPage() {
  const currentPeriod = new Date().toISOString().slice(0, 7)
  const [partners, schoolSlug, partnerCommissions] = await Promise.all([
    getPartners(SCHOOL_ID),
    getSchoolSlug(SCHOOL_ID),
    getPartnerCommissions(SCHOOL_ID, currentPeriod),
  ])

  // sessions here means "referrals recorded this month" — referrals has no
  // student-identity column (partner-referrals/route.ts's own breakdown
  // hardcodes student_name: '—'), so this is the closest real number to
  // "indicações", not a literal distinct-student count.
  const metricsByPartner = new Map(
    partnerCommissions.map(pc => [pc.partner.id as string, { revenue: pc.revenue, referrals: pc.sessions }])
  )

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://picobase.com.br'

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Parceiros
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Links rastreáveis e QR codes para hotéis, agências e outros indicadores
        </p>
      </div>

      <PartnersClient
        partners={partners}
        baseUrl={baseUrl}
        schoolSlug={schoolSlug ?? 'escola'}
        metricsByPartner={metricsByPartner}
      />
    </div>
  )
}
