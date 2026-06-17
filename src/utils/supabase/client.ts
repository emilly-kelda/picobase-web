import { createBrowserClient } from '@supabase/ssr'

// Browser client — for use in Client Components only.
// Session is persisted in cookies that @supabase/ssr sets, making it
// readable by the server client and middleware on subsequent requests.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
