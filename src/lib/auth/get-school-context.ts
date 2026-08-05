import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'

export type SchoolContext = { schoolId: string; role: 'owner'; userId: string }

/** Shared guard for every /api/owner/* route — same independent-of-the-page-
 *  guard reasoning as requireMaster() (src/lib/masterAuth.ts): API routes are
 *  directly addressable and must enforce their own session/tenant boundary
 *  regardless of what UI called them. Replaces the hardcoded
 *  SCHOOL_ID = '00000000-...' constant every one of these routes used to
 *  carry — that constant meant these routes had no real session check at
 *  all and always operated on the same one school no matter who was
 *  logged in. */
export async function getSchoolContext(): Promise<
  | { ok: true; ctx: SchoolContext }
  | { ok: false; response: NextResponse }
> {
  const auth = await getAuthContext()
  if (!auth) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (auth.isMaster) {
    // No active operational school unless master is currently impersonating
    // one (see src/app/api/master/impersonate/route.ts) — reject rather than
    // silently falling back to a hardcoded school, which would just
    // reintroduce the bug this helper replaced.
    if (!auth.impersonatingSchoolId) {
      return { ok: false, response: NextResponse.json({ error: 'Master session has no active school context' }, { status: 403 }) }
    }
    return { ok: true, ctx: { schoolId: auth.impersonatingSchoolId, role: 'owner', userId: auth.userId } }
  }
  return { ok: true, ctx: { schoolId: auth.schoolId, role: 'owner', userId: auth.userId } }
}
