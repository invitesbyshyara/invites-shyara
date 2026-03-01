/*
  Warnings:

  - You are about to drop the column `razorpayOrderId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPaymentId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_razorpayOrderId_idx";

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "priceEur" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "priceUsd" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "razorpayOrderId",
DROP COLUMN "razorpayPaymentId",
ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- CreateIndex
CREATE INDEX "Transaction_stripePaymentIntentId_idx" ON "Transaction"("stripePaymentIntentId");
