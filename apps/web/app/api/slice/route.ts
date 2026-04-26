/**
 * POST /api/slice — multipart upload + enqueue
 *
 * Body (multipart/form-data):
 *   file       — STL/3MF (required, ≤100MB)
 *   materialId — string
 *   profileId  — string
 *
 * Flow:
 *   1. Validate + save bytes (key = designs/<uuid>.stl, fileHash = sha256)
 *   2. Cache lookup: DONE SliceJob with same (fileHash, materialId, profileId)?
 *      → return that one's id (no re-slice).
 *   3. Otherwise create QUEUED SliceJob, enqueue, return id.
 *
 * Response: { jobId, cached: boolean }
 */
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/storage";
import { enqueueSlice } from "@/lib/queue";
import { validateModelFile, type ValidExt } from "@/lib/file-validators";
import { track, EVENTS } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED = new Set(["stl", "3mf"]);

export async function POST(req: Request) {
  const session = await auth();

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "multipart body required" }, { status: 400 });
  }

  const file = form.get("file");
  const materialId = form.get("materialId");
  const profileId = form.get("profileId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }
  if (typeof materialId !== "string" || typeof profileId !== "string") {
    return NextResponse.json({ error: "materialId and profileId required" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "file size out of bounds" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.has(ext)) {
    return NextResponse.json({ error: "only .stl or .3mf" }, { status: 400 });
  }

  const [material, profile] = await Promise.all([
    prisma.material.findUnique({ where: { id: materialId } }),
    prisma.printProfile.findUnique({ where: { id: profileId } }),
  ]);
  if (!material || !material.isActive) {
    return NextResponse.json({ error: "material not available" }, { status: 400 });
  }
  if (!profile) {
    return NextResponse.json({ error: "profile not found" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Magic-byte validation. Extension alone is bypassable; here we sniff the
  // first bytes to ensure the upload actually matches the format we accept.
  const validation = validateModelFile(bytes, ("." + ext) as ValidExt);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const fileHash = createHash("sha256").update(bytes).digest("hex");

  // Cache lookup — same bytes + same print settings = same result.
  const cached = await prisma.sliceJob.findFirst({
    where: {
      fileHash,
      materialId,
      profileId,
      status: "DONE",
    },
    orderBy: { createdAt: "desc" },
  });
  if (cached) {
    void track(
      EVENTS.SLICE_CACHE_HIT,
      { sliceJobId: cached.id, fileHash, materialId, profileId },
      { userId: session?.user?.id ?? null },
    );
    return NextResponse.json({ jobId: cached.id, cached: true });
  }

  const { key } = await saveUpload("design", file.name, bytes);

  const job = await prisma.sliceJob.create({
    data: {
      userId: session?.user?.id ?? null,
      sourceFileKey: key,
      fileHash,
      materialId,
      profileId,
      status: "QUEUED",
    },
  });

  await enqueueSlice(job.id);

  void track(
    EVENTS.SLICE_QUEUED,
    {
      sliceJobId: job.id,
      fileHash,
      materialId,
      profileId,
      bytes: bytes.length,
    },
    { userId: session?.user?.id ?? null },
  );

  return NextResponse.json({ jobId: job.id, cached: false });
}
