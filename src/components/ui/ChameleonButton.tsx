import Button from '@/components/ui/Button'
import type { Stage } from '@/lib/stage'

type ChameleonButtonProps = {
  stage: Stage
  checkedIn: boolean
  hasCredit: boolean
  // Needed only to build the check-in QR link (school/student context for
  // /api/owner/qr) — unused in every other state.
  slug: string
  schoolName: string
  studentName?: string
  activityName?: string | null
  onCheckIn?: () => void
  onSellPackage?: () => void
  className?: string
  lang?: 'en' | 'pt'
}

/** Single action per card, driven by `checkedIn` + `stage` + `hasCredit`
 *  (picobase_chameleon_button_dossie.md, Fase 1) — the one thing a
 *  student's row actually needs right now:
 *
 *  - not checked in -> renders nothing. PendingLessons.tsx's button row has
 *    its own always-visible Check-in chip (promoted out of Ver ficha) that
 *    covers this job — opens the QR modal AND marks checked_in via its own
 *    onOpen. checkedIn and hasCredit are independent facts, so selling a
 *    package must never skip this.
 *  - checked in, sala_de_espera + no credit -> danger "Vender pacote"
 *    (doesn't advance stage on its own — that happens once the sale
 *    actually completes)
 *  - checked in, sala_de_espera + credit    -> renders nothing. Used to be
 *    a primary "Enviar para a água"/"Send to water" button that advanced
 *    checkins.stage to na_agua — removed entirely per explicit ask, now
 *    that ScheduledLessons.tsx's own "Iniciar Velejo"/"Start Session"
 *    button (on the scheduled_lessons row) is the one place a session
 *    actually starts, instead of two parallel stage-transition mechanisms.
 *  - na_agua                    -> no button, muted "Na água" text.
 *    "Finalizar e cobrar" was removed from this queue entirely per the
 *    approved redesign — closing/charging a session happens only via
 *    Aulas Agendadas' "Confirmar Aula" now. Deliberately no substitute
 *    action here for the moment.
 *  - concluido                  -> no button, just muted "Concluído" text
 *
 *  `flex-1` is the default className (still used when this is the row's
 *  single most prominent element, e.g. the dev preview page), but
 *  PendingLessons.tsx's own button row passes `className=""` — it now
 *  sits alongside 3 other same-size buttons in one compact row rather
 *  than being the one wide element in a mostly-empty row. */
export default function ChameleonButton({
  stage,
  checkedIn,
  hasCredit,
  slug,
  schoolName,
  studentName,
  activityName,
  onCheckIn,
  onSellPackage,
  className = 'flex-1',
  lang = 'pt',
}: ChameleonButtonProps) {
  if (stage === 'concluido') {
    return <span className={`text-xs text-pb-mist inline-flex items-center ${className}`}>Concluído</span>
  }

  if (!checkedIn) {
    return null
  }

  if (stage === 'sala_de_espera') {
    if (!hasCredit) {
      return (
        <Button variant="danger" size="sm" onClick={onSellPackage} className={className}>
          Vender pacote
        </Button>
      )
    }
    return null
  }

  // na_agua
  return <span className={`text-xs text-pb-mist inline-flex items-center ${className}`}>Na água</span>
}
