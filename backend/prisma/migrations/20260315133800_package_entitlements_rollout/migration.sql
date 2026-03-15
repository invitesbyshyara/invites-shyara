-- CreateEnum
CREATE TYPE "PackageCode" AS ENUM ('package_a', 'package_b');

-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('initial_purchase', 'event_management_addon', 'renewal');

-- AlterTable
ALTER TABLE "Template"
ADD COLUMN "packageCode" "PackageCode" NOT NULL DEFAULT 'package_a';

-- AlterTable
ALTER TABLE "Invite"
ADD COLUMN "packageCode" "PackageCode" NOT NULL DEFAULT 'package_a',
ADD COLUMN "eventManagementEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "validUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Transaction"
ADD COLUMN "packageCode" "PackageCode" NOT NULL DEFAULT 'package_a',
ADD COLUMN "kind" "TransactionKind" NOT NULL DEFAULT 'initial_purchase',
ADD COLUMN "inviteId" TEXT;

-- Backfill existing templates and transactions into Package A.
UPDATE "Template"
SET "packageCode" = 'package_a'
WHERE "packageCode" IS DISTINCT FROM 'package_a';

UPDATE "Transaction"
SET
  "packageCode" = 'package_a',
  "kind" = 'initial_purchase'
WHERE
  "packageCode" IS DISTINCT FROM 'package_a'
  OR "kind" IS DISTINCT FROM 'initial_purchase';

-- Existing invites receive a fresh 3 month window, Package A entitlements,
-- and previously expired invites are restored to a live state.
UPDATE "Invite"
SET
  "packageCode" = 'package_a',
  "eventManagementEnabled" = true,
  "validUntil" = NOW() + INTERVAL '3 months',
  "expiryDate" = COALESCE("expiryDate", NOW() + INTERVAL '3 months'),
  "status" = CASE
    WHEN "status" = 'expired' THEN 'published'
    ELSE "status"
  END;

ALTER TABLE "Invite"
ALTER COLUMN "validUntil" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_inviteId_fkey"
FOREIGN KEY ("inviteId") REFERENCES "Invite"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Invite_packageCode_idx" ON "Invite"("packageCode");

-- CreateIndex
CREATE INDEX "Invite_validUntil_idx" ON "Invite"("validUntil");

-- CreateIndex
CREATE INDEX "Transaction_inviteId_idx" ON "Transaction"("inviteId");

-- CreateIndex
CREATE INDEX "Transaction_packageCode_idx" ON "Transaction"("packageCode");

-- CreateIndex
CREATE INDEX "Transaction_kind_idx" ON "Transaction"("kind");
