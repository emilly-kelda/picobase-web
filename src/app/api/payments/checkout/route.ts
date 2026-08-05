import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'
import { createServiceClient } from '@/lib/supabase-server'
import { mpPayment, mpPreference, mpPreApproval } from '@/lib/payments/mercadopago'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

/** Starts a checkout for the calling school to pay for a plan. schoolId
 *  always comes from getSchoolContext() (the caller's real session — an
 *  owner's own school, or master's currently-impersonated one), never from
 *  the request body — same rule every /api/owner/* route already follows;
 *  a payment-scoping id is exactly the kind of value that must never be
 *  client-supplied.
 *
 *  billing_type shapes what actually gets charged here:
 *  - 'commission' plans have no fixed recurring fee (revenue is a
 *    percentage, collected via a separate settlement mechanism this route
 *    doesn't implement) — this route only ever collects the one-time
 *    setup_fee_cents for them.
 *  - 'fixed_recurring' plans charge price_monthly_cents. Pix has no native
 *    recurring capability in Mercado Pago, so a Pix checkout only ever
 *    covers the current cycle — true auto-recurring billing needs
 *    credit_card (PreApproval). */
export async function POST(request: Request) {
  const school = await getSchoolContext()
  if (!school.ok) return school.response

  const { planId, paymentMethod } = await request.json().catch(() => ({}))
  if (!planId) {
    return NextResponse.json({ error: 'planId é obrigatório' }, { status: 400 })
  }
  if (paymentMethod !== 'pix' && paymentMethod !== 'credit_card') {
    return NextResponse.json({ error: "paymentMethod deve ser 'pix' ou 'credit_card'" }, { status: 400 })
  }

  const supabase = createServiceClient()
  const [{ data: plan }, { data: owner }] = await Promise.all([
    supabase.from('plans').select('*').eq('id', planId).eq('is_active', true).single(),
    supabase
      .from('users')
      .select('email, name')
      .eq('school_id', school.ctx.schoolId)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle(),
  ])

  if (!plan) return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 })
  if (!owner?.email) return NextResponse.json({ error: 'Escola sem responsável com email cadastrado' }, { status: 400 })

  const backUrl = `${BASE_URL}/owner/settings`

  try {
    // Records which plan this checkout is for — the webhook only knows
    // school_id (via external_reference), not planId, so this is the only
    // point in the flow where the selection actually gets persisted.
    // subscription_status is deliberately left untouched here — the
    // webhook is what flips it to 'active', once payment is confirmed.
    await supabase.from('schools').update({ plan_id: planId }).eq('id', school.ctx.schoolId)

    if (plan.billing_type === 'commission') {
      const amount = (plan.setup_fee_cents ?? 0) / 100
      if (amount <= 0) {
        return NextResponse.json({ error: 'Plano sem taxa de implantação configurada' }, { status: 400 })
      }

      if (paymentMethod === 'pix') {
        const payment = await mpPayment.create({
          body: {
            transaction_amount: amount,
            payment_method_id: 'pix',
            payer: { email: owner.email },
            description: `${plan.name} — taxa de implantação`,
            external_reference: school.ctx.schoolId,
          },
        })
        return NextResponse.json({
          ok: true,
          type: 'pix',
          payment_id: payment.id,
          qr_code: payment.point_of_interaction?.transaction_data?.qr_code ?? null,
          qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
        })
      }

      const preference = await mpPreference.create({
        body: {
          items: [{
            id: plan.id,
            title: `${plan.name} — taxa de implantação`,
            quantity: 1,
            currency_id: plan.currency,
            unit_price: amount,
          }],
          payer: { email: owner.email },
          external_reference: school.ctx.schoolId,
          back_urls: { success: backUrl, failure: backUrl, pending: backUrl },
        },
      })
      return NextResponse.json({
        ok: true,
        type: 'credit_card',
        init_point: preference.init_point ?? null,
        preference_id: preference.id ?? null,
      })
    }

    // fixed_recurring
    const monthly = (plan.price_monthly_cents ?? 0) / 100
    if (monthly <= 0) {
      return NextResponse.json({ error: 'Plano sem preço mensal configurado' }, { status: 400 })
    }

    if (paymentMethod === 'pix') {
      const payment = await mpPayment.create({
        body: {
          transaction_amount: monthly,
          payment_method_id: 'pix',
          payer: { email: owner.email },
          description: `${plan.name} — mensalidade`,
          external_reference: school.ctx.schoolId,
        },
      })
      return NextResponse.json({
        ok: true,
        type: 'pix',
        payment_id: payment.id,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code ?? null,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      })
    }

    const preapproval = await mpPreApproval.create({
      body: {
        reason: plan.name,
        external_reference: school.ctx.schoolId,
        payer_email: owner.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: monthly,
          currency_id: plan.currency,
        },
        back_url: backUrl,
        status: 'pending',
      },
    })
    return NextResponse.json({
      ok: true,
      type: 'credit_card',
      init_point: preapproval.init_point ?? null,
      preapproval_id: preapproval.id ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao processar pagamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
