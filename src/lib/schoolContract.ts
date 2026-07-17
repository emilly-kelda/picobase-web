// Shared between the school-creation form, the contract-edit modal, and the
// master schools API route, so the allowed values never drift apart.

export const CONTRACT_STATUSES = [
  { value: 'trial',     label: 'Trial' },
  { value: 'active',    label: 'Ativa' },
  { value: 'past_due',  label: 'Inadimplente' },
] as const

export const PAYMENT_METHODS = [
  { value: 'cartao',  label: 'Cartão' },
  { value: 'pix',     label: 'PIX' },
  { value: 'boleto',  label: 'Boleto' },
] as const

export const PAYMENT_TERMS = [
  { value: 'mensal',     label: 'Mensal' },
  { value: 'semestral',  label: 'Semestral' },
  { value: 'anual',      label: 'Anual' },
] as const
