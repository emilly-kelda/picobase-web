'use client'

import { useState } from 'react'
import ChameleonButton from '@/components/ui/ChameleonButton'
import type { Stage } from '@/lib/stage'

const STAGES: Stage[] = ['sala_de_espera', 'na_agua', 'checkout', 'concluido']

/** Lets a reviewer flip through all 5 stage/hasCredit combinations by hand
 *  — the Fase 1 acceptance check ("trocar manualmente o stage de um aluno
 *  de teste faz o botão mudar de aparência e função corretamente, nas 5
 *  combinações possíveis") without needing a real checkin row. */
export default function ChameleonButtonPreview() {
  const [stage, setStage] = useState<Stage>('sala_de_espera')
  const [checkedIn, setCheckedIn] = useState(false)
  const [hasCredit, setHasCredit] = useState(true)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <select
          value={stage}
          onChange={e => setStage(e.target.value as Stage)}
          className="rounded-[6px] border border-pb-border px-2 py-1"
        >
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={checkedIn} onChange={e => setCheckedIn(e.target.checked)} />
          checkedIn
        </label>
        {stage === 'sala_de_espera' && (
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={hasCredit} onChange={e => setHasCredit(e.target.checked)} />
            hasCredit
          </label>
        )}
      </div>
      <div className="flex max-w-xs items-center gap-2">
        <ChameleonButton
          stage={stage}
          checkedIn={checkedIn}
          hasCredit={hasCredit}
          slug="preview"
          schoolName="Pico Base"
          studentName="Aluno de teste"
          onCheckIn={() => setCheckedIn(true)}
          onSellPackage={() => setHasCredit(true)}
        />
      </div>
    </div>
  )
}
