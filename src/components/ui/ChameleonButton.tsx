import Button from '@/components/ui/Button'
import CheckinQRButton from '@/components/CheckinQRButton'
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
 *  - not checked in              -> full-width primary "Check-in"
 *    (CheckinQRButton, `compact` — icon + label, not the icon-only
 *    square) — clicking opens the QR/link modal and marks checked_in via
 *    onCheckIn. This is the starting state for EVERY student in
 *    Aguardando Vento, regardless of credit; checked_in and hasCredit are
 *    independent facts, so selling a package must never skip this.
 *  - checked in, sala_de_espera + no credit -> danger "Vender pacote"
 *    (doesn't advance stage on its own — that happens once the sale
 *    actually completes)
 *  - checked in, sala_de_espera + credit    -> primary "Enviar para a água"
 *    ("Send to water" in en), wave icon — per
 *    fix_checkin_removido_e_estagio_errado.md this replaces the earlier
 *    "Iniciar Velejo →" label, same color/format as Check-in (same
 *    component, just a different label/icon once checked in).
 *  - na_agua                    -> no button, muted "Na água" text.
 *    "Finalizar e cobrar" was removed from this queue entirely per the
 *    approved redesign — closing/charging a session happens only via
 *    Aulas Agendadas' "Confirmar Aula" now. Deliberately no substitute
 *    action here for the moment.
 *  - concluido                  -> no button, just muted "Concluído" text
 *
 *  Always meant to be the row's single most prominent element — pass
 *  `flex-1` (the default) so it takes the remaining width. */
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
        compact
        onOpen={onCheckIn}
        className={className}
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
        <span className="text-[15px]">🌊</span> {lang === 'pt' ? 'Enviar para a água' : 'Send to water'}
      </Button>
    )
  }

  // na_agua
  return <span className={`text-xs text-pb-mist inline-flex items-center ${className}`}>🌊 Na água</span>
}
