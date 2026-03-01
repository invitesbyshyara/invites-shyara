import Stripe from "stripe";
import { env } from "../lib/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });

export type StripeCurrency = "usd" | "eur";

export const createStripePaymentIntent = async (params: {
  amountInCents: number;
  currency: StripeCurrency;
  metadata?: Stripe.MetadataParam;
}) =>
  stripe.paymentIntents.create({
    amount: params.amountInCents,
    currency: params.currency,
    metadata: params.metadata,
    automatic_payment_methods: { enabled: true },
  });

export const retrievePaymentIntent = async (paymentIntentId: string) =>
  stripe.paymentIntents.retrieve(paymentIntentId);

export const createStripeRefund = async (paymentIntentId: string, reason?: string) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
  const chargeId =
    typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id;

  if (!chargeId) {
    throw new Error("No charge found for payment intent");
  }

  return stripe.refunds.create({
    charge: chargeId,
    metadata: reason ? { reason } : undefined,
  });
};

export const verifyStripeWebhookSignature = (body: Buffer, signature: string): Stripe.Event =>
  stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
