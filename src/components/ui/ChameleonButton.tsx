import Button from '@/components/ui/Button'
import type { Stage } from '@/lib/stage'

type ChameleonButtonProps = {
  stage: Stage
  checkedIn: boolean
  hasCredit: boolean
  onCheckIn?: () => void
  onSendToWater?: () => void
  onFinishAndCharge?: () => void
  onSellPackage?: () => void
  className?: string
}

/** Single action per card, driven by `checkedIn` + `stage` + `hasCredit`
 *  (picobase_chameleon_button_dossie.md, Fase 1; `checkedIn` gate added as
 *  an urgent correction — see 20260806000000_checkin_checked_in.sql) —
 *  replaces the old pile of buttons (Confirmar, Reagendar, WhatsApp,
 *  Editar, Check-in, Vender pacote...) with the one thing a student's row
 *  actually needs right now:
 *
 *  - not checked in              -> primary "Check-in" (this is the
 *    starting state for EVERY student in Sala de Espera, regardless of
 *    credit — checked_in and hasCredit are independent facts, so selling a
 *    package must never skip this)
 *  - checked in, sala_de_espera + no credit -> danger "Vender pacote"
 *    (doesn't advance stage on its own — that happens once the sale
 *    actually completes)
 *  - checked in, sala_de_espera + credit    -> primary "Enviar para a água"
 *  - na_agua                    -> dark (pb-storm) "Finalizar e cobrar",
 *    a color distinct from every other variant so it doesn't read as
 *    "hasn't started yet"
 *  - checkout                   -> same button, disabled, "Fechando..."
 *    (checkout modal is open — guards against a double click)
 *  - concluido                  -> no button, just muted "Concluído" text
 *
 *  Always meant to be the row's single most prominent element — pass
 *  `flex-1` (the default) so it takes the remaining width next to
 *  OverflowMenu. */
export default function ChameleonButton({
  stage,
  checkedIn,
  hasCredit,
  onCheckIn,
  onSendToWater,
  onFinishAndCharge,
  onSellPackage,
  className = 'flex-1',
}: ChameleonButtonProps) {
  if (stage === 'concluido') {
    return <span className={`text-xs text-pb-mist inline-flex items-center ${className}`}>Concluído</span>
  }

  if (!checkedIn) {
    return (
      <Button variant="primary" size="sm" onClick={onCheckIn} className={className}>
        {/* Icon at 15px against 13px body text — exact mockup spec. */}
        <span className="text-[15px]">🔲</span> Check-in
      </Button>
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
        🌊 Enviar para a água
      </Button>
    )
  }

  // na_agua | checkout
  const closing = stage === 'checkout'
  return (
    <Button variant="dark" size="sm" onClick={onFinishAndCharge} disabled={closing} className={className}>
      🏁 {closing ? 'Fechando...' : 'Finalizar e cobrar'}
    </Button>
  )
}
