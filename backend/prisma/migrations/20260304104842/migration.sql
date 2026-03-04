/*
  Warnings:

  - You are about to drop the column `stripeChargeId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Transaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[razorpayOrderId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Transaction_stripePaymentIntentId_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "stripeChargeId",
DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_razorpayOrderId_key" ON "Transaction"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "Transaction_razorpayOrderId_idx" ON "Transaction"("razorpayOrderId");
