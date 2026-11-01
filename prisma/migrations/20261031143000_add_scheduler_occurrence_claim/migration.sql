CREATE TABLE "scheduler_occurrence" (
    "nodeId" TEXT NOT NULL,
    "scheduledAt" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "scheduler_occurrence_nodeId_scheduledAt_key"
ON "scheduler_occurrence"("nodeId", "scheduledAt");
