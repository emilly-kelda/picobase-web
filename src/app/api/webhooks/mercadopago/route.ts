import { NextResponse } from 'next/server'
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago'
import { mpPayment, mpPreApproval } from '@/lib/payments/mercadopago'
import { createServiceClient } from '@/lib/supabase-server'

// Mercado Pago's own PreApproval status strings (British "cancelled") don't
// match this app's subscription_status enum (American "canceled") — see
// 20260817000001_plans_and_subscriptions.sql. 'pending' has no mapping on
// purpose: a subscription just created but not yet authorized shouldn't
// change whatever status the school already has.
const PREAPPROVAL_STATUS_MAP: Record<string, string> = {
  authorized: 'active',
  paused: 'paused',
  cancelled: 'canceled',
}

/** Mercado Pago IPN/webhook receiver. No session/role auth here — the
 *  caller is Mercado Pago's own servers, not a logged-in user. The
 *  signature check below (SDK's own WebhookSignatureValidator, not a
 *  hand-rolled HMAC comparison) is the entire trust boundary: it proves
 *  the request actually came from Mercado Pago and wasn't forged, using
 *  the same secret configured in Tus Integraciones. */
export async function POST(request: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const url = new URL(request.url)
  const body = await request.json().catch(() => null)

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get('x-signature'),
      xRequestId: request.headers.get('x-request-id'),
      dataId: url.searchParams.get('data.id'),
      secret,
      toleranceSeconds: 300,
    })
  } catch (err) {
    const reason = err instanceof InvalidWebhookSignatureError ? err.reason : 'unknown'
    console.error('Mercado Pago webhook: assinatura inválida —', reason)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const type = body?.type as string | undefined
  const resourceId = body?.data?.id as string | undefined
  if (!type || !resourceId) {
    // Nothing actionable in this notification (MP sends several event
    // types this integration doesn't handle) — ack with 200 so MP doesn't
    // keep retrying it.
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceClient()

  if (type === 'payment') {
    const payment = await mpPayment.get({ id: resourceId })
    const schoolId = payment.external_reference ?? null

    // Only 'approved' flips the school active — a Pix payment is a
    // one-time charge covering the current cycle (see checkout route's own
    // comment on why Pix has no auto-recurring path).
    if (schoolId && payment.status === 'approved') {
      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)
      await supabase
        .from('schools')
        .update({ subscription_status: 'active', current_period_end: periodEnd.toISOString() })
        .eq('id', schoolId)
    }

    await supabase.from('payment_transactions').insert({
      school_id: schoolId,
      event_type: 'payment',
      mp_payment_id: String(payment.id ?? resourceId),
      status: payment.status ?? 'unknown',
      amount_cents: payment.transaction_amount != null ? Math.round(payment.transaction_amount * 100) : null,
      raw_payload: payment,
    })
  } else if (type === 'subscription_preapproval') {
    const preapproval = await mpPreApproval.get({ id: resourceId })
    const schoolId = preapproval.external_reference ?? null
    const mappedStatus = preapproval.status ? PREAPPROVAL_STATUS_MAP[preapproval.status] : undefined

    if (schoolId && mappedStatus) {
      const update: Record<string, unknown> = { subscription_status: mappedStatus }
      if (mappedStatus === 'active' && preapproval.next_payment_date) {
        update.current_period_end = preapproval.next_payment_date
      }
      await supabase.from('schools').update(update).eq('id', schoolId)
    }

    await supabase.from('payment_transactions').insert({
      school_id: schoolId,
      event_type: 'subscription_preapproval',
      mp_preapproval_id: String(preapproval.id ?? resourceId),
      status: preapproval.status ?? 'unknown',
      amount_cents: preapproval.auto_recurring?.transaction_amount != null
        ? Math.round(preapproval.auto_recurring.transaction_amount * 100)
        : null,
      raw_payload: preapproval,
    })
  }

  return NextResponse.json({ ok: true })
}
