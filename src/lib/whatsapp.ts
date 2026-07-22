/** wa.me needs the full international number. Several places in this app
 *  save a student's WhatsApp as free text with no format hint, so numbers
 *  are often just DDD+phone (10-11 digits), no country code. This school
 *  operates out of Fortaleza, so 55 (Brazil) is the only safe default to
 *  backfill; anything already long enough to plausibly carry a country
 *  code is left untouched. */
export function whatsappDigitsWithCountryCode(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  return `https://wa.me/${whatsappDigitsWithCountryCode(phone)}?text=${encodeURIComponent(message)}`
}

/** api.whatsapp.com/send variant (not the wa.me short-link above) — same
 *  digits-with-country-code normalization either way. Was previously only
 *  a local copy inside ScheduledLessons.tsx; exported here so new call
 *  sites (e.g. sessions/page.tsx) reuse it instead of duplicating it again. */
export function buildApiWhatsAppUrl(phone: string | null | undefined, message: string): string {
  return `https://api.whatsapp.com/send?phone=${whatsappDigitsWithCountryCode(phone)}&text=${encodeURIComponent(message)}`
}
