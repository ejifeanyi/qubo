-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gmailHistoryId" TEXT;

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailId" TEXT NOT NULL,
    "subject" TEXT,
    "from" TEXT,
    "senderEmail" TEXT,
    "senderName" TEXT,
    "to" TEXT,
    "toEmails" TEXT[],
    "cc" TEXT,
    "ccEmails" TEXT[],
    "bcc" TEXT,
    "bccEmails" TEXT[],
    "replyTo" TEXT,
    "date" TIMESTAMP(3),
    "body" TEXT,
    "textBody" TEXT,
    "htmlBody" TEXT,
    "snippet" TEXT,
    "threadId" TEXT,
    "messageId" TEXT,
    "labelIds" TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "sizeEstimate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emails_gmailId_key" ON "emails"("gmailId");

-- CreateIndex
CREATE INDEX "emails_userId_idx" ON "emails"("userId");

-- CreateIndex
CREATE INDEX "emails_date_idx" ON "emails"("date");

-- CreateIndex
CREATE INDEX "emails_threadId_idx" ON "emails"("threadId");

-- CreateIndex
CREATE INDEX "emails_senderEmail_idx" ON "emails"("senderEmail");

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
