-- Public designer profile: short bio + optional portfolio URL.

ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "websiteUrl" TEXT;
