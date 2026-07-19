import { createServiceClient } from '@/lib/supabase-server'

export type InfraStatus = {
  dbSizeBytes: number
  storageBytes: number
  activeConnections: number
  maxConnections: number
  apiOk: boolean
  apiLatencyMs: number
}

/** Backs the /master/status panel. db size / storage / connections come
 *  from the get_infra_status() RPC (pg_catalog + storage.objects, see
 *  20260725000000_infra_status_rpc.sql) — there's no Supabase Management
 *  API token configured in this project, only the service-role key, so
 *  pg_catalog metadata is the only real source for this. "API status" is
 *  the RPC round-trip itself: if it answers, the API is up; the elapsed
 *  time is the latency shown. */
export async function getInfraStatus(): Promise<InfraStatus> {
  const supabase = createServiceClient()

  const start = Date.now()
  const { data, error } = await supabase.rpc('get_infra_status')
  const apiLatencyMs = Date.now() - start

  if (error || !data) {
    return {
      dbSizeBytes: 0, storageBytes: 0,
      activeConnections: 0, maxConnections: 0,
      apiOk: false, apiLatencyMs,
    }
  }

  return {
    dbSizeBytes:       data.db_size_bytes ?? 0,
    storageBytes:      data.storage_bytes ?? 0,
    activeConnections: data.active_connections ?? 0,
    maxConnections:    data.max_connections ?? 0,
    apiOk: true,
    apiLatencyMs,
  }
}
