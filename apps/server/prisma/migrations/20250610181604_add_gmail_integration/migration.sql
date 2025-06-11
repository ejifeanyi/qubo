-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "bcc" TEXT,
ADD COLUMN     "bodyText" TEXT,
ADD COLUMN     "cc" TEXT,
ADD COLUMN     "gmailData" JSONB,
ADD COLUMN     "labels" TEXT[],
ADD COLUMN     "threadId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "historyId" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "syncInProgress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "emails_userId_receivedAt_idx" ON "emails"("userId", "receivedAt");

-- CreateIndex
CREATE INDEX "emails_messageId_idx" ON "emails"("messageId");
