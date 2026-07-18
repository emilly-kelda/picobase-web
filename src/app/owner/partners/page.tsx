import { getPartners } from '@/repositories/partnerRepository'
import { getSchoolSlug } from '@/repositories/bookingRepository'
import PartnersClient from './PartnersClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function PartnersPage() {
  const [partners, schoolSlug] = await Promise.all([
    getPartners(SCHOOL_ID),
    getSchoolSlug(SCHOOL_ID),
  ])

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
      />
    </div>
  )
}
