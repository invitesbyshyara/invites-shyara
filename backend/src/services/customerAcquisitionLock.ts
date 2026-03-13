import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { env } from "../lib/env";
import { createRazorpayRefund } from "./payment";
import { AppError } from "../utils/http";

const REFUND_CLAIM_SENTINEL = "__customer_acquisition_lock_refund_pending__";

export const CUSTOMER_ACQUISITION_LOCK_MESSAGE =
  "New customer signups and purchases are temporarily paused while we complete platform verification.";
export const CUSTOMER_ACQUISITION_PAYMENT_LOCK_MESSAGE =
  "Purchases are temporarily unavailable while we complete platform verification.";
export const CUSTOMER_ACQUISITION_REFUND_MESSAGE =
  "Purchases are temporarily unavailable while we complete platform verification. If your payment was captured, it will be refunded automatically.";
const CUSTOMER_ACQUISITION_REFUND_REASON =
  "Auto-refunded while platform verification was in progress.";

export const isCustomerAcquisitionLocked = () => env.CUSTOMER_ACQUISITION_LOCK_ENABLED;

export const assertCustomerAcquisitionOpen = (message = CUSTOMER_ACQUISITION_LOCK_MESSAGE) => {
  if (isCustomerAcquisitionLocked()) {
    throw new AppError(message, 503);
  }
};

export const getCustomerAcquisitionStatus = () => ({
  customerAcquisitionLocked: env.CUSTOMER_ACQUISITION_LOCK_ENABLED,
  notice: env.CUSTOMER_ACQUISITION_LOCK_ENABLED ? CUSTOMER_ACQUISITION_LOCK_MESSAGE : null,
});

export const refundPendingCapturedPaymentForLock = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
) => {
  const transaction = await prisma.transaction.findFirst({
    where: { razorpayOrderId },
  });

  if (!transaction) {
    return "not_found" as const;
  }

  if (transaction.status === "success") {
    return "already_completed" as const;
  }

  if (transaction.status === "refunded") {
    return "already_refunded" as const;
  }

  if (transaction.status !== "pending") {
    return "already_handled" as const;
  }

  const claimed = await prisma.transaction.updateMany({
    where: {
      id: transaction.id,
      status: "pending",
      refundReason: null,
    },
    data: {
      refundReason: REFUND_CLAIM_SENTINEL,
      razorpayPaymentId,
    },
  });

  if (claimed.count === 0) {
    const latest = await prisma.transaction.findUnique({
      where: { id: transaction.id },
    });

    if (latest?.status === "refunded") {
      return "already_refunded" as const;
    }

    if (latest?.refundReason === REFUND_CLAIM_SENTINEL) {
      return "refund_in_progress" as const;
    }

    return "already_handled" as const;
  }

  try {
    await createRazorpayRefund(razorpayPaymentId);
  } catch (error) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        refundReason: null,
        razorpayPaymentId,
      },
    }).catch(() => undefined);

    logger.error("Customer acquisition lock refund failed", {
      error,
      razorpayOrderId,
      razorpayPaymentId,
      transactionId: transaction.id,
    });
    throw error;
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: "refunded",
      refundedAt: new Date(),
      refundReason: CUSTOMER_ACQUISITION_REFUND_REASON,
      razorpayPaymentId,
    },
  });

  logger.warn("Captured payment refunded because customer acquisition lock is enabled", {
    razorpayOrderId,
    razorpayPaymentId,
    transactionId: transaction.id,
  });

  return "refunded" as const;
};
