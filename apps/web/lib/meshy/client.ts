/**
 * Meshy provider router.
 *
 * Selects mock vs real based on env:
 *   MESHY_PROVIDER=real + MESHY_API_KEY set → real Meshy API
 *   otherwise                              → bundled-sample mock
 *
 * Both providers expose the same fire-and-forget shape:
 *   scheduleCompletion(jobId)  // returns void; updates MeshyJob in the
 *                              // background, calls markMeshyJobFailed()
 *                              // on error which triggers credit refund.
 */
import "server-only";
import { scheduleMockCompletion } from "./mock";
import { scheduleRealCompletion } from "./real";

const PROVIDER = (process.env.MESHY_PROVIDER ?? "mock").toLowerCase();
const HAS_KEY = Boolean(process.env.MESHY_API_KEY);

export function isRealMeshyEnabled(): boolean {
  return PROVIDER === "real" && HAS_KEY;
}

export function scheduleCompletion(jobId: string): void {
  if (isRealMeshyEnabled()) {
    scheduleRealCompletion(jobId);
  } else {
    scheduleMockCompletion(jobId);
  }
}
