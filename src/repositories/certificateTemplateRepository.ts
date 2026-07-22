import { createServiceClient } from '@/lib/supabase-server'

export type CertificateTemplate = {
  id: string
  sport_key: string | null
  theme_key: string
  background_image_url: string | null
  signature_type: 'upload' | 'fictitious' | 'text'
  signature_data: string | null
  font_family: string | null
}

const DEFAULT_TEMPLATE: Omit<CertificateTemplate, 'id' | 'sport_key'> = {
  theme_key: 'oceano',
  background_image_url: null,
  signature_type: 'text',
  signature_data: null,
  font_family: null,
}

export async function getCertificateTemplates(schoolId: string): Promise<CertificateTemplate[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('id, sport_key, theme_key, background_image_url, signature_type, signature_data, font_family')
    .eq('school_id', schoolId)
    .order('sport_key', { ascending: true, nullsFirst: true })
  if (error) throw error
  return data ?? []
}

/** Resolves which template a certificate should use: the sport-specific
 *  override if one exists, else the school's generic template, else the
 *  hardcoded defaults (today's look — navy/teal, text signature, no logo)
 *  so schools that never touch this settings section see no regression. */
export async function resolveCertificateTemplate(
  schoolId: string,
  sportKey: string | null
): Promise<Omit<CertificateTemplate, 'id' | 'sport_key'>> {
  const supabase = createServiceClient()

  if (sportKey) {
    const { data: bySport } = await supabase
      .from('certificate_templates')
      .select('theme_key, background_image_url, signature_type, signature_data, font_family')
      .eq('school_id', schoolId)
      .eq('sport_key', sportKey)
      .maybeSingle()
    if (bySport) return bySport
  }

  const { data: generic } = await supabase
    .from('certificate_templates')
    .select('theme_key, background_image_url, signature_type, signature_data, font_family')
    .eq('school_id', schoolId)
    .is('sport_key', null)
    .maybeSingle()
  return generic ?? DEFAULT_TEMPLATE
}

/** Not a plain `.upsert()` — the "one generic template per school" rule is
 *  enforced by a partial unique index (`WHERE sport_key IS NULL`), and
 *  Supabase's upsert conflict target can't express that partial predicate.
 *  Select-then-insert/update instead. */
export async function upsertCertificateTemplate(
  schoolId: string,
  fields: {
    sportKey: string | null
    themeKey: string
    backgroundImageUrl: string | null
    signatureType: 'upload' | 'fictitious' | 'text'
    signatureData: string | null
    fontFamily: string | null
  }
) {
  const supabase = createServiceClient()

  let existingQuery = supabase
    .from('certificate_templates')
    .select('id')
    .eq('school_id', schoolId)
  existingQuery = fields.sportKey
    ? existingQuery.eq('sport_key', fields.sportKey)
    : existingQuery.is('sport_key', null)
  const { data: existing } = await existingQuery.maybeSingle()

  const row = {
    school_id: schoolId,
    sport_key: fields.sportKey,
    theme_key: fields.themeKey,
    background_image_url: fields.backgroundImageUrl,
    signature_type: fields.signatureType,
    signature_data: fields.signatureData,
    font_family: fields.fontFamily,
    updated_at: new Date().toISOString(),
  }

  const { error } = existing
    ? await supabase.from('certificate_templates').update(row).eq('id', existing.id)
    : await supabase.from('certificate_templates').insert(row)
  if (error) throw error
  return { ok: true }
}

export async function deleteCertificateTemplate(schoolId: string, id: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('certificate_templates')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}
