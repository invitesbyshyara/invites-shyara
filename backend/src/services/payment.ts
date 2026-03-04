import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../lib/env";

const rz = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export type RazorpayCurrency = "USD" | "EUR";

export const createRazorpayOrder = async (params: {
  amountInCents: number;
  currency: RazorpayCurrency;
  receipt: string;
  notes?: Record<string, string>;
}) =>
  rz.orders.create({
    amount: params.amountInCents,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  });

export const verifyRazorpayPayment = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === razorpaySignature;
};

export const verifyRazorpayWebhook = (rawBody: Buffer, signature: string): Record<string, any> => {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("Invalid webhook signature");
  }

  return JSON.parse(rawBody.toString("utf8"));
};

export const fetchRazorpayPayment = async (razorpayPaymentId: string) =>
  rz.payments.fetch(razorpayPaymentId);

export const createRazorpayRefund = async (razorpayPaymentId: string, amountInCents?: number) =>
  rz.payments.refund(razorpayPaymentId, {
    ...(amountInCents !== undefined ? { amount: amountInCents } : {}),
  });
