import Button from '@/components/ui/Button'
import CheckinQRButton from '@/components/CheckinQRButton'
import type { Stage } from '@/lib/stage'

type ChameleonButtonProps = {
  stage: Stage
  checkedIn: boolean
  hasCredit: boolean
  // Needed only to build the restored check-in QR link (school/student
  // context for /api/owner/qr) — unused in every other state.
  slug: string
  schoolName: string
  studentName?: string
  activityName?: string | null
  onCheckIn?: () => void
  onSendToWater?: () => void
  onSellPackage?: () => void
  className?: string
  // Only gates the "Iniciar Velejo"/"Start Session" label below — the
  // rest of this component's text is still PT-only, unchanged by this
  // rename (a broader i18n pass wasn't asked for here).
  lang?: 'en' | 'pt'
}

/** Single action per card, driven by `checkedIn` + `stage` + `hasCredit`
 *  (picobase_chameleon_button_dossie.md, Fase 1; `checkedIn` gate added as
 *  an urgent correction — see 20260806000000_checkin_checked_in.sql) —
 *  replaces the old pile of buttons (Confirmar, Reagendar, WhatsApp,
 *  Editar, Check-in, Vender pacote...) with the one thing a student's row
 *  actually needs right now:
 *
 *  - not checked in              -> compact QR trigger (CheckinQRButton,
 *    iconOnly) restoring the check-in QR/link modal that used to be the
 *    primary action here, instead of a plain button. Clicking it both
 *    opens the modal (onOpen) and marks checked_in via onCheckIn — this is
 *    the starting state for EVERY student in Aguardando Vento, regardless
 *    of credit; checked_in and hasCredit are independent facts, so
 *    selling a package must never skip this.
 *  - checked in, sala_de_espera + no credit -> danger "Vender pacote"
 *    (doesn't advance stage on its own — that happens once the sale
 *    actually completes)
 *  - checked in, sala_de_espera + credit    -> primary "Iniciar Velejo →"
 *    ("Start Session →" in en) — renamed from "Enviar para a água"
 *  - na_agua                    -> no button, muted "Na água" text.
 *    "Finalizar e cobrar" was removed from this queue entirely per the
 *    approved redesign — closing/charging a session happens only via
 *    Aulas Agendadas' "Confirmar Aula" now. Deliberately no substitute
 *    action here for the moment.
 *  - concluido                  -> no button, just muted "Concluído" text
 *
 *  Always meant to be the row's single most prominent element — pass
 *  `flex-1` (the default) so it takes the remaining width. The compact
 *  QR trigger ignores `className` on purpose: it's meant to stay small,
 *  never stretch full-width like the other states. */
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
    return (
      <CheckinQRButton
        slug={slug}
        schoolName={schoolName}
        studentName={studentName}
        activityName={activityName}
        iconOnly
        onOpen={onCheckIn}
      />
    )
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
        {lang === 'pt' ? 'Iniciar Velejo →' : 'Start Session →'}
      </Button>
    )
  }

  // na_agua
  return <span className={`text-xs text-pb-mist inline-flex items-center ${className}`}>🌊 Na água</span>
}
