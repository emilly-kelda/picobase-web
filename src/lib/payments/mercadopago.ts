import { MercadoPagoConfig, Payment, Preference, PreApproval } from 'mercadopago'

// Single shared config/client instances — the SDK reads the access token
// once at construction and every client method call reuses it, so there's
// no need to reconstruct these per-request the way a per-call Supabase
// client is (Supabase's client also carries request-scoped cookies; this
// one doesn't need any).
const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export const mpPayment = new Payment(mpConfig)
export const mpPreference = new Preference(mpConfig)
export const mpPreApproval = new PreApproval(mpConfig)
