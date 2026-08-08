import { MercadoPagoConfig, Payment, Preference, PreApproval, OAuth } from 'mercadopago'

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

// The OAuth client's own methods (create/refresh/getAuthorizationURL) take
// the target app's client_id/client_secret directly in their call — this
// platform-account config is just what the SDK's constructor requires, it's
// not actually the credential used for the marketplace OAuth flow itself.
// See src/app/api/auth/mercadopago/connect and mercadopago-tenant.ts.
export const mpOAuth = new OAuth(mpConfig)
