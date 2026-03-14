-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "InviteAccessRequest" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requesterCollaboratorId" TEXT NOT NULL,
    "requestedPermissions" TEXT[],
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'pending',
    "decidedByUserId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InviteAccessRequest_inviteId_idx" ON "InviteAccessRequest"("inviteId");

-- CreateIndex
CREATE INDEX "InviteAccessRequest_requesterUserId_idx" ON "InviteAccessRequest"("requesterUserId");

-- CreateIndex
CREATE INDEX "InviteAccessRequest_requesterCollaboratorId_idx" ON "InviteAccessRequest"("requesterCollaboratorId");

-- CreateIndex
CREATE INDEX "InviteAccessRequest_status_idx" ON "InviteAccessRequest"("status");

-- AddForeignKey
ALTER TABLE "InviteAccessRequest" ADD CONSTRAINT "InviteAccessRequest_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteAccessRequest" ADD CONSTRAINT "InviteAccessRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteAccessRequest" ADD CONSTRAINT "InviteAccessRequest_requesterCollaboratorId_fkey" FOREIGN KEY ("requesterCollaboratorId") REFERENCES "InviteCollaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteAccessRequest" ADD CONSTRAINT "InviteAccessRequest_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
