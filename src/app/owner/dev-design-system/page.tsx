import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ChameleonButtonPreview from './ChameleonButtonPreview'
import OverflowMenu from '@/components/ui/OverflowMenu'

/** Isolated preview of the shared design-system components
 *  (picobase_design_system_dossie.md) — not linked from the sidebar,
 *  visit directly at /owner/dev-design-system. Satisfies each fase's
 *  "render the variants side by side" acceptance check without a
 *  Storybook setup. Safe to delete once the dossiê is fully applied to
 *  real screens and this stops being useful as a reference. */
export default function DesignSystemPreviewPage() {
  return (
    <div className="p-8 space-y-10 max-w-2xl">
      <h1 className="text-lg font-semibold text-pb-slate">Design system preview</h1>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-pb-mist">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>Primary (disabled)</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-pb-mist">Badge</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Termo assinado</Badge>
          <Badge variant="danger">Sem créditos</Badge>
          <Badge variant="neutral">Agendada</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-pb-mist">ChameleonButton</h2>
        <ChameleonButtonPreview />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-pb-mist">OverflowMenu</h2>
        <div className="flex max-w-xs items-center gap-2 rounded-[8px] border border-pb-border p-2">
          <span className="flex-1 text-sm text-pb-slate">Nome do aluno</span>
          <OverflowMenu items={[
            { label: 'Ver ficha', onClick: () => {} },
            { label: 'Enviar WhatsApp', onClick: () => {} },
            { label: 'Editar', onClick: () => {} },
            { label: 'Remover', onClick: () => {}, danger: true },
          ]} />
        </div>
      </section>
    </div>
  )
}
