/**
 * Lightweight extractor for request context (IP, UA) inside server actions or
 * route handlers. Never throws; always returns a partial. Reading headers
 * outside of a request scope returns empty strings.
 */
import { headers } from "next/headers";
import type { TrackContext } from "./types";

export async function readRequestContext(): Promise<Partial<TrackContext>> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    const ua = h.get("user-agent") ?? null;
    return { ipAddress: ip, userAgent: ua };
  } catch {
    return {};
  }
}
