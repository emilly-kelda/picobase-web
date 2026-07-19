/** Shared BRL currency formatter — single source of truth so pages stop
 *  each declaring their own Intl.NumberFormat call. `decimals` defaults to
 *  2 (the standard for money); pass 0 for whole-reais overview figures —
 *  several pages in this app intentionally render large aggregate numbers
 *  that way (Custos, Master dashboard, etc.) and this isn't meant to
 *  silently change that existing, deliberate convention. */
export function formatCurrency(
  amount: number | null | undefined,
  options: { decimals?: number; currency?: 'BRL' | 'USD' | 'EUR' } = {}
): string {
  if (amount == null) return '—'
  const { decimals = 2, currency = 'BRL' } = options
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency,
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(amount)
}
