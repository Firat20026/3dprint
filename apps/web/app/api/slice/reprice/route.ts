/**
 * POST /api/slice/reprice
 *
 * Body: { fileHash, sourceFileKey, materialId, profileId }
 *
 * Reprices an already-uploaded file for a new material/profile combo.
 * Returns existing DONE job if cached, else enqueues a new one.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueueSlice } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "json body required" }, { status: 400 });
  }
  const { fileHash, sourceFileKey, materialId, profileId } = body as Record<string, unknown>;
  if (
    typeof fileHash !== "string" ||
    typeof sourceFileKey !== "string" ||
    typeof materialId !== "string" ||
    typeof profileId !== "string"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
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

  // Verify the referenced file actually belongs to an existing SliceJob row with
  // the same hash AND check ownership BEFORE doing cache lookup — otherwise an
  // attacker could submit someone else's (fileHash, materialId, profileId) and
  // receive cached pricing without ever proving they own the source.
  const sourceOk = await prisma.sliceJob.findFirst({
    where: { fileHash, sourceFileKey },
    select: { id: true, userId: true },
  });
  if (!sourceOk) {
    return NextResponse.json({ error: "source file not recognized" }, { status: 400 });
  }

  if (sourceOk.userId) {
    const isOwner = session?.user?.id === sourceOk.userId;
    const isAdmin = session?.user?.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "source file not recognized" }, { status: 400 });
    }
  }

  // Cache lookup AFTER auth check.
  const cached = await prisma.sliceJob.findFirst({
    where: { fileHash, materialId, profileId, status: "DONE" },
    orderBy: { createdAt: "desc" },
  });
  if (cached) {
    return NextResponse.json({ jobId: cached.id, cached: true });
  }

  const job = await prisma.sliceJob.create({
    data: {
      userId: session?.user?.id ?? null,
      sourceFileKey,
      fileHash,
      materialId,
      profileId,
      status: "QUEUED",
    },
  });
  await enqueueSlice(job.id);

  return NextResponse.json({ jobId: job.id, cached: false });
}
