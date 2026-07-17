import { createServiceClient } from '@/lib/supabase-server'

export type FinancialDoc = {
  id: string
  school_id: string
  doc_type: string
  url: string
  note: string | null
  created_at: string
}

export async function getDocsForSchool(schoolId: string): Promise<FinancialDoc[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('school_financial_documents')
    .select('id, school_id, doc_type, url, note, created_at')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createDoc(payload: {
  schoolId: string
  docType: string
  url: string
  note: string | null
  createdBy: string | null
}) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('school_financial_documents')
    .insert({
      school_id:  payload.schoolId,
      doc_type:   payload.docType,
      url:        payload.url,
      note:       payload.note,
      created_by: payload.createdBy,
    })
  if (error) throw error
  return { ok: true }
}
