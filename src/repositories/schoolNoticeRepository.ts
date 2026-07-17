import { createServiceClient } from '@/lib/supabase-server'

export type SchoolNotice = {
  id: string
  school_id: string
  message: string
  created_at: string
  read_at: string | null
}

/** Most recent unread notice for a school's owner banner — null if none. */
export async function getActiveNoticeForSchool(schoolId: string): Promise<SchoolNotice | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('school_notices')
    .select('id, school_id, message, created_at, read_at')
    .eq('school_id', schoolId)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

/** Full notice history for a school, master-side. */
export async function getNoticesForSchool(schoolId: string): Promise<SchoolNotice[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('school_notices')
    .select('id, school_id, message, created_at, read_at')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createNotice(schoolId: string, message: string, createdBy: string | null) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('school_notices')
    .insert({ school_id: schoolId, message, created_by: createdBy })
  if (error) throw error
  return { ok: true }
}

/** schoolId scopes the update so an owner can only ever dismiss their own
 *  school's notices, never another tenant's by guessing/enumerating ids. */
export async function dismissNotice(id: string, schoolId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('school_notices')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}
