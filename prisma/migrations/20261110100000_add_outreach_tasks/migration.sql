CREATE TABLE "outreach_task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'contact_found',
    "gmailMessageId" TEXT,
    "replyStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "outreach_task_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "outreach_task_workflowId_jobId_contactEmail_key" ON "outreach_task"("workflowId", "jobId", "contactEmail");
CREATE INDEX "outreach_task_userId_createdAt_idx" ON "outreach_task"("userId", "createdAt");
CREATE INDEX "outreach_task_workflowId_status_idx" ON "outreach_task"("workflowId", "status");
ALTER TABLE "outreach_task" ADD CONSTRAINT "outreach_task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "outreach_task" ADD CONSTRAINT "outreach_task_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
