// SERVER-ONLY — never import this file from a Client Component or any
// browser-executed module. SUPABASE_SERVICE_ROLE_KEY is a privileged secret
// that must never be exposed to the browser.
//
// The admin client bypasses all Row Level Security policies and has access to
// the Supabase Auth Admin API (e.g. inviteUserByEmail, deleteUser).
// Import only from server actions, Route Handlers, and server-side utilities.

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
