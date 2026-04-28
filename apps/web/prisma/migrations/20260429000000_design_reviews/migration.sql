-- DesignReview: per-user 1..5 star ratings on a design with optional title/body.
-- Default status = APPROVED so reviews show immediately; admins can flip to HIDDEN.

CREATE TYPE "ReviewStatus" AS ENUM ('APPROVED', 'HIDDEN');

CREATE TABLE "DesignReview" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "verifiedBuyer" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "hiddenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DesignReview_designId_userId_key" ON "DesignReview"("designId", "userId");
CREATE INDEX "DesignReview_designId_status_createdAt_idx" ON "DesignReview"("designId", "status", "createdAt");
CREATE INDEX "DesignReview_userId_idx" ON "DesignReview"("userId");

ALTER TABLE "DesignReview"
  ADD CONSTRAINT "DesignReview_designId_fkey"
  FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DesignReview"
  ADD CONSTRAINT "DesignReview_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
