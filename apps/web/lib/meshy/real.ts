/**
 * Real Meshy AI provider.
 *
 * Activated when MESHY_PROVIDER=real and MESHY_API_KEY is set. Submits a
 * text-to-3D or image-to-3D task, polls until SUCCEEDED/FAILED, downloads
 * the resulting STL into local storage, and updates MeshyJob.
 *
 * Single-stage usage: we use only the "preview" stage of text-to-3D (mesh
 * only, no textures). For 3D printing the texture step adds cost and time
 * without affecting the printed result, so it's skipped.
 *
 * Polling lives in the same Node process via setInterval — fine for low
 * volume. For higher volume, move to a dedicated worker (BullMQ) or use
 * Meshy's webhook callback (configurable per task) to push completion
 * back to us.
 *
 * Docs reference (2025): https://docs.meshy.ai/en/api/text-to-3d ,
 * https://docs.meshy.ai/en/api/image-to-3d , bearer auth via
 * `Authorization: Bearer msy_...`. Endpoints are versioned: text-to-3d
 * is /openapi/v2, image-to-3d is /openapi/v1.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";
import { track, logError, EVENTS } from "@/lib/observability";
import { notify, TEMPLATES } from "@/lib/notifications";
import { markMeshyJobFailed } from "./job-helpers";

const API_BASE = "https://api.meshy.ai";
const API_KEY = process.env.MESHY_API_KEY ?? "";
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./data/uploads";

const POLL_INTERVAL_MS = 8_000; // 8s — well under the per-account rate limit
const POLL_TIMEOUT_MS = 15 * 60 * 1000; // give Meshy 15 min to finish

type TaskStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";

type TaskResponse = {
  id?: string;
  status?: TaskStatus;
  progress?: number;
  thumbnail_url?: string | null;
  task_error?: { message?: string };
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
    stl?: string;
    "3mf"?: string;
  };
};

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra,
  };
}

async function submitTextTo3D(prompt: string): Promise<string> {
  const res = await fetch(`${API_BASE}/openapi/v2/text-to-3d`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      mode: "preview",
      prompt,
      ai_model: "latest",
      target_formats: ["stl", "glb"],
      auto_size: true,
      origin_at: "bottom",
      // Untextured preview is plenty for 3D printing — refine stage adds
      // textures and PBR maps that don't affect the print.
      should_remesh: true,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `meshy text-to-3d submit failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
  const data = (await res.json()) as { result?: string };
  if (!data.result) throw new Error("meshy: missing task id in response");
  return data.result;
}

async function submitImageTo3D(imageDataUri: string): Promise<string> {
  const res = await fetch(`${API_BASE}/openapi/v1/image-to-3d`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      image_url: imageDataUri,
      target_formats: ["stl", "glb"],
      should_texture: false,
      should_remesh: true,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `meshy image-to-3d submit failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
  const data = (await res.json()) as { result?: string };
  if (!data.result) throw new Error("meshy: missing task id in response");
  return data.result;
}

async function fetchTaskStatus(
  externalJobId: string,
  mode: "TEXT" | "IMAGE",
): Promise<TaskResponse> {
  const path =
    mode === "TEXT"
      ? `/openapi/v2/text-to-3d/${externalJobId}`
      : `/openapi/v1/image-to-3d/${externalJobId}`;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(
      `meshy task fetch failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
  return (await res.json()) as TaskResponse;
}

async function downloadModel(
  url: string,
  destKey: string,
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`model download failed: ${res.status}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const fullDest = path.join(UPLOAD_DIR, destKey);
  await mkdir(path.dirname(fullDest), { recursive: true });
  await writeFile(fullDest, bytes);
}

/**
 * Submit + poll a real Meshy job. Background-driven: returns immediately
 * after the initial submit; poll loop runs in the same node process.
 */
export function scheduleRealCompletion(jobId: string): void {
  void run(jobId).catch(async (e) => {
    await logError(e, {
      source: "meshy:real:scheduler",
      severity: "HIGH",
      metadata: { jobId },
    });
    await markMeshyJobFailed(jobId, e);
  });
}

async function run(jobId: string) {
  const job = await prisma.meshyJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { id: true, mode: true, prompt: true, imageKey: true, userId: true },
  });

  // 1. Submit the task to Meshy.
  let externalJobId: string;
  if (job.mode === "TEXT") {
    if (!job.prompt) throw new Error("meshy: TEXT job has no prompt");
    externalJobId = await submitTextTo3D(job.prompt);
  } else {
    if (!job.imageKey) throw new Error("meshy: IMAGE job has no imageKey");
    const bytes = await readStoredFile(job.imageKey);
    const ext = path.extname(job.imageKey).slice(1).toLowerCase() || "png";
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
    const dataUri = `data:${mime};base64,${bytes.toString("base64")}`;
    externalJobId = await submitImageTo3D(dataUri);
  }

  await prisma.meshyJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", externalJobId },
  });
  void track(
    EVENTS.MESHY_TASK_SUBMITTED,
    { jobId, externalJobId, mode: job.mode },
    { userId: job.userId },
  );

  // 2. Poll until SUCCEEDED/FAILED/CANCELED or timeout.
  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const task = await fetchTaskStatus(externalJobId, job.mode);
    if (task.status === "SUCCEEDED") {
      const stlUrl = task.model_urls?.stl;
      if (!stlUrl) {
        throw new Error("meshy: SUCCEEDED but no STL url in model_urls");
      }
      const destKey = `meshy/${randomUUID()}.stl`;
      await downloadModel(stlUrl, destKey);

      const updated = await prisma.meshyJob.update({
        where: { id: jobId },
        data: {
          status: "DONE",
          modelFileKey: destKey,
          thumbnailUrl: task.thumbnail_url ?? undefined,
        },
        select: { userId: true, mode: true, prompt: true, user: { select: { email: true } } },
      });
      void track(
        EVENTS.MESHY_JOB_DONE,
        { jobId, externalJobId, modelFileKey: destKey },
        { userId: updated.userId },
      );
      if (updated.user?.email) {
        void notify({
          to: updated.user.email,
          template: TEMPLATES.MESHY_JOB_DONE,
          data: { jobId, mode: updated.mode, prompt: updated.prompt },
        });
      }
      return;
    }
    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new Error(
        task.task_error?.message ??
          `meshy task ${task.status?.toLowerCase() ?? "ended"}`,
      );
    }
    // PENDING / IN_PROGRESS — keep polling.
  }
  throw new Error(`meshy: poll timeout after ${POLL_TIMEOUT_MS}ms`);
}
