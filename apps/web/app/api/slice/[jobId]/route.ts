/**
 * GET /api/slice/[jobId] — status polling.
 *
 * Authorization: owner-or-anonymous. If the job has `userId` set (authenticated
 * upload), only that user or an admin can read it. Anonymous jobs (userId null)
 * are readable by anyone holding the jobId — that's acceptable because the
 * uploader is the only party who has it.
 *
 * Response:
 *   { status: "QUEUED"|"RUNNING"|"DONE"|"FAILED",
 *     filamentGrams?, printSeconds?, unitPriceTRY?, errorText? }
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = await prisma.sliceJob.findUnique({
    where: { id: jobId },
    include: { material: true, profile: true },
  });
  if (!job) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Ownership check: if job has an owner, requester must be that user (or admin).
  // Anonymous jobs (job.userId === null) remain readable to whoever has the jobId.
  if (job.userId) {
    const session = await auth();
    const isOwner = session?.user?.id === job.userId;
    const isAdmin = session?.user?.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    filamentGrams: job.filamentGrams,
    filamentMeters: job.filamentMeters,
    printSeconds: job.printSeconds,
    unitPriceTRY: job.unitPriceTRY ? Number(job.unitPriceTRY) : null,
    errorText: job.errorText,
    material: { id: job.material.id, name: job.material.name, colorHex: job.material.colorHex },
    profile: {
      id: job.profile.id,
      name: job.profile.name,
      layerHeightMm: job.profile.layerHeightMm,
      infillPercent: job.profile.infillPercent,
    },
    sourceFileKey: job.sourceFileKey,
    fileHash: job.fileHash,
  });
}
