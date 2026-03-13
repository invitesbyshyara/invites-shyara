-- CreateEnum
CREATE TYPE "GuestInvitationStatus" AS ENUM ('invited', 'confirmed', 'waitlisted', 'cancelled');

-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('pending', 'active', 'revoked');

-- CreateEnum
CREATE TYPE "BroadcastType" AS ENUM ('venue_change', 'timing_update', 'rsvp_reminder', 'dress_code_reminder', 'weather_advisory', 'parking_update', 'photos_uploaded', 'post_event_thank_you', 'custom');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('draft', 'sent', 'partial');

-- CreateEnum
CREATE TYPE "BroadcastRecipientStatus" AS ENUM ('pending', 'sent', 'opened', 'bounced');

-- AlterTable
ALTER TABLE "Rsvp"
ADD COLUMN     "adultCount" INTEGER,
ADD COLUMN     "childCount" INTEGER,
ADD COLUMN     "customAnswers" JSONB,
ADD COLUMN     "dietaryRestrictions" TEXT,
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "mealChoice" TEXT,
ADD COLUMN     "roomRequirement" TEXT,
ADD COLUMN     "stayNeeded" BOOLEAN,
ADD COLUMN     "transportMode" TEXT,
ADD COLUMN     "transportNeeded" BOOLEAN;

-- CreateTable
CREATE TABLE "InviteGuest" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "household" TEXT,
    "audienceSegment" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "language" TEXT NOT NULL DEFAULT 'en',
    "invitationStatus" "GuestInvitationStatus" NOT NULL DEFAULT 'invited',
    "response" "RsvpResponse",
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "adultCount" INTEGER,
    "childCount" INTEGER,
    "message" TEXT,
    "mealChoice" TEXT,
    "dietaryRestrictions" TEXT,
    "customAnswers" JSONB,
    "stayNeeded" BOOLEAN NOT NULL DEFAULT false,
    "lodgingStatus" TEXT,
    "hotelName" TEXT,
    "roomType" TEXT,
    "roomCount" INTEGER NOT NULL DEFAULT 0,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "shuttleRequired" BOOLEAN NOT NULL DEFAULT false,
    "transportMode" TEXT,
    "arrivalDetails" TEXT,
    "departureDetails" TEXT,
    "parkingRequired" BOOLEAN NOT NULL DEFAULT false,
    "supportNotes" TEXT,
    "inviteSentAt" TIMESTAMP(3),
    "lastBroadcastAt" TIMESTAMP(3),
    "rsvpSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteCollaborator" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "roleLabel" TEXT NOT NULL DEFAULT 'collaborator',
    "permissions" TEXT[],
    "status" "CollaboratorStatus" NOT NULL DEFAULT 'pending',
    "invitedByUserId" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteBroadcast" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "type" "BroadcastType" NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "audience" JSONB NOT NULL,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "guestId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "BroadcastRecipientStatus" NOT NULL DEFAULT 'pending',
    "openToken" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "inviteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteGuest_token_key" ON "InviteGuest"("token");

-- CreateIndex
CREATE INDEX "InviteGuest_inviteId_idx" ON "InviteGuest"("inviteId");

-- CreateIndex
CREATE INDEX "InviteGuest_email_idx" ON "InviteGuest"("email");

-- CreateIndex
CREATE INDEX "InviteGuest_response_idx" ON "InviteGuest"("response");

-- CreateIndex
CREATE INDEX "InviteGuest_audienceSegment_idx" ON "InviteGuest"("audienceSegment");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCollaborator_inviteToken_key" ON "InviteCollaborator"("inviteToken");

-- CreateIndex
CREATE INDEX "InviteCollaborator_inviteId_idx" ON "InviteCollaborator"("inviteId");

-- CreateIndex
CREATE INDEX "InviteCollaborator_email_idx" ON "InviteCollaborator"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCollaborator_inviteId_email_key" ON "InviteCollaborator"("inviteId", "email");

-- CreateIndex
CREATE INDEX "InviteBroadcast_inviteId_idx" ON "InviteBroadcast"("inviteId");

-- CreateIndex
CREATE INDEX "InviteBroadcast_sentAt_idx" ON "InviteBroadcast"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastRecipient_openToken_key" ON "BroadcastRecipient"("openToken");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_broadcastId_idx" ON "BroadcastRecipient"("broadcastId");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_guestId_idx" ON "BroadcastRecipient"("guestId");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_status_idx" ON "BroadcastRecipient"("status");

-- CreateIndex
CREATE INDEX "Rsvp_guestId_idx" ON "Rsvp"("guestId");

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "InviteGuest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteGuest" ADD CONSTRAINT "InviteGuest_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCollaborator" ADD CONSTRAINT "InviteCollaborator_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCollaborator" ADD CONSTRAINT "InviteCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteBroadcast" ADD CONSTRAINT "InviteBroadcast_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "InviteBroadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "InviteGuest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
