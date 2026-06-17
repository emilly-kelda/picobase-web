import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server client — for use in Server Components, Route Handlers, and Server Actions.
// Reads and writes cookies so the session is visible to middleware and the browser client.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Throws when called from a Server Component (read-only context).
            // Safe to ignore — middleware will refresh the session cookie instead.
          }
        },
      },
    }
  )
}
