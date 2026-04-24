import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client for the worker process. Long-lived, single connection pool.
 */
export const prisma = new PrismaClient({
  log: process.env.PRISMA_LOG === "1" ? ["query", "error", "warn"] : ["error"],
});

export type { Prisma } from "@prisma/client";
