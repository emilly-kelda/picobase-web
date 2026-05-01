import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getSessionsByInstructor(instructorId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("instructor_id", instructorId)

  if (error) {
    console.error("Error fetching sessions:", error)
    return []
  }

  return data || []
}