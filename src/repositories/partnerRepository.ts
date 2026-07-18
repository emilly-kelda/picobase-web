import { createServiceClient } from '@/lib/supabase-server'

export type Partner = {
  id: string
  name: string
  type: string | null
  commission_pct: number | null
  discount_pct: number | null
  referral_code: string | null
  finance_email: string | null
  active: boolean
}

export async function getPartners(schoolId: string): Promise<Partner[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, type, commission_pct, discount_pct, referral_code, finance_email, active')
    .eq('school_id', schoolId)
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

/** Resolves a ?ref= code to the partner it belongs to — used server-side by
 *  /book/[school] and /checkin/[school] to attribute a visit, never trusts a
 *  client-supplied partner_id directly. */
export async function getPartnerByReferralCode(code: string, schoolId: string): Promise<Partner | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('partners')
    .select('id, name, type, commission_pct, discount_pct, referral_code, finance_email, active')
    .eq('referral_code', code)
    .eq('school_id', schoolId)
    .eq('active', true)
    .maybeSingle()
  return data ?? null
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function createPartner(payload: {
  schoolId: string
  name: string
  type: string | null
  commissionPct: number
  discountPct: number | null
  financeEmail: string | null
  referralCode?: string | null
}) {
  const supabase = createServiceClient()

  const code = payload.referralCode?.trim() || slugify(payload.name)
  const { data: existing } = await supabase
    .from('partners')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle()
  const finalCode = existing ? `${code}-${Math.random().toString(36).slice(2, 6)}` : code

  const { error } = await supabase
    .from('partners')
    .insert({
      school_id:      payload.schoolId,
      name:           payload.name,
      type:           payload.type,
      commission_pct: payload.commissionPct,
      discount_pct:   payload.discountPct,
      finance_email:  payload.financeEmail,
      referral_code:  finalCode,
      active:         true,
    })
  if (error) throw error
  return { ok: true }
}

export async function updatePartner(id: string, schoolId: string, payload: {
  name: string
  type: string | null
  commissionPct: number
  discountPct: number | null
  financeEmail: string | null
}) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('partners')
    .update({
      name:           payload.name,
      type:           payload.type,
      commission_pct: payload.commissionPct,
      discount_pct:   payload.discountPct,
      finance_email:  payload.financeEmail,
    })
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}

/** Soft delete — package_sales/checkins/referrals hold historical partner_id
 *  references, same reasoning as instructors/packages. */
export async function deactivatePartner(id: string, schoolId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('partners')
    .update({ active: false })
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}
