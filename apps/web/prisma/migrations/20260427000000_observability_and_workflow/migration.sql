-- Phase 2: User profile fields (for iyzico buyer defaults)
ALTER TABLE "User"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "identityNumber" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "registrationAddress" TEXT;

-- Phase 4: Design review workflow fields
ALTER TABLE "Design"
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT;

ALTER TABLE "Design"
  ADD CONSTRAINT "Design_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Phase 3: CreditLedger idempotency — prevent double refunds for same source.
-- PostgreSQL treats NULLs as distinct in UNIQUE indexes by default, so multiple
-- rows with refId=NULL (e.g. ADMIN_GRANT) remain allowed. Same (refId, reason)
-- pair with non-null refId is rejected — that's our refund/purchase guard.
CREATE UNIQUE INDEX "uniq_ledger_ref_reason"
  ON "CreditLedger" ("refId", "reason");

-- Phase 5: Observability — events + error logs
CREATE TYPE "EventLevel" AS ENUM ('DEBUG', 'INFO', 'WARN');
CREATE TYPE "ErrorSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "EventLevel" NOT NULL DEFAULT 'INFO',
    "userId" TEXT,
    "sessionId" TEXT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_name_occurredAt_idx" ON "AnalyticsEvent"("name", "occurredAt");
CREATE INDEX "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");
CREATE INDEX "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt");

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "severity" "ErrorSeverity" NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL,
    "userId" TEXT,
    "requestPath" TEXT,
    "requestMethod" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ErrorLog_severity_resolved_occurredAt_idx" ON "ErrorLog"("severity", "resolved", "occurredAt");
CREATE INDEX "ErrorLog_source_occurredAt_idx" ON "ErrorLog"("source", "occurredAt");
CREATE INDEX "ErrorLog_resolved_occurredAt_idx" ON "ErrorLog"("resolved", "occurredAt");

ALTER TABLE "ErrorLog"
  ADD CONSTRAINT "ErrorLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
