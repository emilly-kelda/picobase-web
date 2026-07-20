import Button from '@/components/ui/Button'
import type { Stage } from '@/lib/stage'

type ChameleonButtonProps = {
  stage: Stage
  hasCredit: boolean
  onSendToWater?: () => void
  onFinishAndCharge?: () => void
  onSellPackage?: () => void
  className?: string
}

/** Single action per card, driven entirely by `stage` + `hasCredit`
 *  (picobase_chameleon_button_dossie.md, Fase 1) — replaces the old pile of
 *  buttons (Confirmar, Reagendar, WhatsApp, Editar, Check-in, Vender
 *  pacote...) with the one thing a student's row actually needs right now:
 *
 *  - sala_de_espera + credit    -> primary "Enviar para a água"
 *  - sala_de_espera + no credit -> danger "Vender pacote" (doesn't advance
 *    stage on its own — that happens once the sale actually completes)
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
  hasCredit,
  onSendToWater,
  onFinishAndCharge,
  onSellPackage,
  className = 'flex-1',
}: ChameleonButtonProps) {
  if (stage === 'concluido') {
    return <span className={`text-xs text-pb-mist inline-flex items-center ${className}`}>Concluído</span>
  }

  if (stage === 'sala_de_espera') {
    if (!hasCredit) {
      return (
        <Button variant="danger" onClick={onSellPackage} className={className}>
          Vender pacote
        </Button>
      )
    }
    return (
      <Button variant="primary" onClick={onSendToWater} className={className}>
        🌊 Enviar para a água
      </Button>
    )
  }

  // na_agua | checkout
  const closing = stage === 'checkout'
  return (
    <Button variant="dark" onClick={onFinishAndCharge} disabled={closing} className={className}>
      🏁 {closing ? 'Fechando...' : 'Finalizar e cobrar'}
    </Button>
  )
}
