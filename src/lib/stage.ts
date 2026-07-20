/** Mirrors the `checkins.stage` CHECK constraint added in
 *  supabase/migrations/20260805000000_checkin_stage.sql. Shared between
 *  ChameleonButton, the screens that render it, and the API route that
 *  persists transitions, so there's one definition of the state machine. */
export type Stage = 'sala_de_espera' | 'na_agua' | 'checkout' | 'concluido'
