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
  onSendToWater?: () => void
  onSellPackage?: () => void
  className?: string
  // Only gates the "Enviar para a água"/"Send to water" label below — the
  // rest of this component's text is still PT-only, unchanged by this
  // rename (a broader i18n pass wasn't asked for here).
  lang?: 'en' | 'pt'
}

/** Single action per card, driven by `checkedIn` + `stage` + `hasCredit`
 *  (picobase_chameleon_button_dossie.md, Fase 1) — the one thing a
 *  student's row actually needs right now:
 *
 *  - not checked in -> renders nothing. Used to be a full-width primary
 *    "Check-in" trigger (CheckinQRButton, `compact`) here, but
 *    PendingLessons.tsx's button row now has its own always-visible
 *    Check-in chip (promoted out of Ver ficha) that does the exact same
 *    job — opens the QR modal AND marks checked_in via its own onOpen.
 *    Keeping both was showing two "Check-in" triggers on the same card at
 *    once, which is the bug this removal fixes. checkedIn and hasCredit
 *    are independent facts, so selling a package must never skip this.
 *  - checked in, sala_de_espera + no credit -> danger "Vender pacote"
 *    (doesn't advance stage on its own — that happens once the sale
 *    actually completes)
 *  - checked in, sala_de_espera + credit    -> primary "Enviar para a água"
 *    ("Send to water" in en) — per
 *    fix_checkin_removido_e_estagio_errado.md this replaces the earlier
 *    "Iniciar Velejo →" label, same color/format as Check-in (same
 *    component, just a different label once checked in). No icon — the
 *    later no-emoji pass dropped the wave glyph this state briefly had.
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
  onSendToWater,
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
    return (
      <Button variant="primary" size="sm" onClick={onSendToWater} className={className}>
        {lang === 'pt' ? 'Enviar para a água' : 'Send to water'}
      </Button>
    )
  }

  // na_agua
  return <span className={`text-xs text-pb-mist inline-flex items-center ${className}`}>Na água</span>
}
