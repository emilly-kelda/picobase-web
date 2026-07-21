import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { Stage } from '@/lib/stage'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

// 'checkout' is deliberately not settable here — it's local UI state (the
// checkout modal being open for a given row, see ChameleonButton's caller
// in ScheduledLessons.tsx / PendingLessons.tsx), not a persisted fact.
// Nothing writes a checkin to 'checkout' in the database; it goes straight
// from 'na_agua' to 'concluido' via confirm-lesson/route.ts once the modal
// is actually confirmed.
const VALID_STAGES: Stage[] = ['sala_de_espera', 'na_agua', 'concluido']

/** picobase_chameleon_button_dossie.md Fase 3 — the only stage transition
 *  that needs a dedicated endpoint: ChameleonButton's "Iniciar Velejo"
 *  (sala_de_espera -> na_agua). The other two transitions ride existing
 *  routes instead of duplicating them: onSellPackage opens the pre-existing
 *  SellPackageFlowModal (no new backend needed — hasCredit is derived from
 *  package balances the caller already refetches), and onFinishAndCharge's
 *  na_agua -> concluido happens inside confirm-lesson/route.ts, alongside
 *  the checkins.status update it was already making.
 *
 *  Also carries ChameleonButton's "Check-in" action (checked_in: true) —
 *  added alongside `stage` here rather than as a separate route, since it's
 *  the same "PATCH one field on a checkin row" shape. `stage` and
 *  `checked_in` are independent facts (see 20260806000000_checkin_checked_
 *  in.sql), so either can be sent alone.
 *
 *  equipment_notes rides the same shape for the same reason — free-text
 *  edit from "Ver ficha", nothing else about the row changes when it's
 *  saved. */
export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, stage, checked_in, equipment_notes } = body

  if (!id) {
    return NextResponse.json({ error: 'id e obrigatorio' }, { status: 400 })
  }
  if (stage !== undefined && !VALID_STAGES.includes(stage as Stage)) {
    return NextResponse.json({ error: 'stage invalido' }, { status: 400 })
  }
  if (checked_in !== undefined && typeof checked_in !== 'boolean') {
    return NextResponse.json({ error: 'checked_in deve ser boolean' }, { status: 400 })
  }
  if (equipment_notes !== undefined && typeof equipment_notes !== 'string') {
    return NextResponse.json({ error: 'equipment_notes deve ser string' }, { status: 400 })
  }
  if (stage === undefined && checked_in === undefined && equipment_notes === undefined) {
    return NextResponse.json({ error: 'stage, checked_in ou equipment_notes e obrigatorio' }, { status: 400 })
  }

  const update: { stage?: Stage; checked_in?: boolean; equipment_notes?: string } = {}
  if (stage !== undefined) update.stage = stage as Stage
  if (checked_in !== undefined) update.checked_in = checked_in
  if (equipment_notes !== undefined) update.equipment_notes = equipment_notes

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('checkins')
    .update(update)
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
