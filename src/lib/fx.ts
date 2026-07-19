// Live USD/EUR → BRL conversion via AwesomeAPI (free, no key required).
// Commissions and stored session revenue must always be in BRL — this is the
// single source of truth for that conversion, used both server-side
// (confirm-lesson) and via /api/fx for the client-side preview.

export type FxCurrency = 'USD' | 'EUR'
export type FxSource = 'live' | 'stale-cache' | 'fallback'

const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6h — "today's rate" doesn't need to be second-fresh
const FETCH_TIMEOUT_MS = 5000

// Last-resort only — used when AwesomeAPI is unreachable AND there's no
// in-memory cache at all yet (e.g. right after a fresh deploy). Deliberately
// approximate and hand-maintained, not fetched: the alternative is blocking
// every non-BRL lesson confirmation on a third-party API's uptime, which is
// worse than a slightly-stale rate for the rare window this applies to.
// Update these occasionally so they don't drift too far from reality.
const FALLBACK_RATES: Record<FxCurrency, number> = { USD: 5.50, EUR: 6.10 }

let cache: { rates: Record<FxCurrency, number>; fetchedAt: number } | null = null

async function fetchRates(): Promise<Record<FxCurrency, number>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(AWESOME_API_URL, { signal: controller.signal, cache: 'no-store' })
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

/** Current USD/EUR → BRL rates plus where they came from, so callers that
 *  show this to a human (the confirm modal) can be honest about it instead
 *  of presenting a hardcoded fallback as if it were live. Never throws —
 *  degrades live -> stale in-memory cache -> hardcoded FALLBACK_RATES,
 *  since a lesson confirmation being blocked by AwesomeAPI's uptime is a
 *  worse failure mode than using an approximate rate for a few minutes. */
export async function getExchangeRatesWithSource(): Promise<{ rates: Record<FxCurrency, number>; source: FxSource }> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { rates: cache.rates, source: 'live' }
  }
  try {
    const rates = await fetchRates()
    cache = { rates, fetchedAt: Date.now() }
    return { rates, source: 'live' }
  } catch (err) {
    if (cache) {
      console.error('[fx] live rate fetch failed, using stale cache:', err)
      return { rates: cache.rates, source: 'stale-cache' }
    }
    console.error('[fx] live rate fetch failed and no cache exists yet — using hardcoded fallback rates:', err)
    return { rates: FALLBACK_RATES, source: 'fallback' }
  }
}

/** Convenience wrapper for callers that only need the rates, not the
 *  source (convertToBRL below). Kept because it never throws either now —
 *  no behavior change needed at either of its two call sites. */
export async function getExchangeRates(): Promise<Record<FxCurrency, number>> {
  const { rates } = await getExchangeRatesWithSource()
  return rates
}

/** Converts `amount` in `currency` to its BRL equivalent at today's rate.
 *  BRL is a no-op — every caller can pass through unconditionally without
 *  special-casing the common case. */
export async function convertToBRL(amount: number, currency: 'BRL' | FxCurrency): Promise<number> {
  if (currency === 'BRL') return amount
  const rates = await getExchangeRates()
  return amount * rates[currency]
}
