// Live USD/EUR → BRL conversion via AwesomeAPI (free, no key required).
// Commissions and stored session revenue must always be in BRL — this is the
// single source of truth for that conversion, used both server-side
// (confirm-lesson) and via /api/fx for the client-side preview.

export type FxCurrency = 'USD' | 'EUR'

const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6h — "today's rate" doesn't need to be second-fresh
const FETCH_TIMEOUT_MS = 5000

let cache: { rates: Record<FxCurrency, number>; fetchedAt: number } | null = null

async function fetchRates(): Promise<Record<FxCurrency, number>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(AWESOME_API_URL, { signal: controller.signal })
    if (!res.ok) throw new Error(`AwesomeAPI returned ${res.status}`)
    const data = await res.json()
    const usd = Number(data?.USDBRL?.bid)
    const eur = Number(data?.EURBRL?.bid)
    if (!usd || !eur) throw new Error('AwesomeAPI response missing USD/EUR rate')
    return { USD: usd, EUR: eur }
  } finally {
    clearTimeout(timeout)
  }
}

/** Current USD/EUR → BRL rates, cached in-memory for CACHE_TTL_MS so a burst of
 *  lesson confirmations doesn't hammer AwesomeAPI. Falls back to a stale cached
 *  rate if the live fetch fails — only throws when there's no cache at all,
 *  since silently defaulting to a 1:1 rate would reintroduce the bug this
 *  module exists to fix. */
export async function getExchangeRates(): Promise<Record<FxCurrency, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates
  }
  try {
    const rates = await fetchRates()
    cache = { rates, fetchedAt: Date.now() }
    return rates
  } catch (err) {
    if (cache) {
      console.error('[fx] live rate fetch failed, using stale cache:', err)
      return cache.rates
    }
    throw new Error('Não foi possível obter a taxa de câmbio (AwesomeAPI indisponível). Tente novamente em instantes.')
  }
}

/** Converts `amount` in `currency` to its BRL equivalent at today's rate.
 *  BRL is a no-op — every caller can pass through unconditionally without
 *  special-casing the common case. */
export async function convertToBRL(amount: number, currency: 'BRL' | FxCurrency): Promise<number> {
  if (currency === 'BRL') return amount
  const rates = await getExchangeRates()
  return amount * rates[currency]
}
