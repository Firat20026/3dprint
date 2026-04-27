-- Multi-plate + multi-material support, server-rendered thumbnail tracking.

ALTER TABLE "Design"
  ADD COLUMN "thumbnailGeneratedAt" TIMESTAMP(3),
  ADD COLUMN "plateCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "materialGroups" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "SliceJob"
  ADD COLUMN "plateIndex" INTEGER NOT NULL DEFAULT 1;

-- Replace the cache lookup index to include plateIndex (each plate gets its
-- own slice; the same fileHash + material + profile but different plate must
-- not collide with each other in the cache).
DROP INDEX IF EXISTS "SliceJob_fileHash_materialId_profileId_idx";
CREATE INDEX "SliceJob_fileHash_materialId_profileId_plateIndex_idx"
  ON "SliceJob" ("fileHash", "materialId", "profileId", "plateIndex");
