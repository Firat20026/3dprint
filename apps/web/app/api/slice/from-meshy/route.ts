/**
 * POST /api/slice/from-meshy
 *
 * Body: { meshyJobId, materialId, profileId }
 *
 * MeshyJob sonucundan doğrudan bir SliceJob başlatır. File upload gerekmez —
 * model zaten storage'da. Sonraki material/profile değişikliklerinde reprice
 * endpoint'i çalışır (ilk slice kaydı "source file"ı validate edebilir).
 */
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";
import { enqueueSlice } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    meshyJobId?: string;
    materialId?: string;
    profileId?: string;
  } | null;
  if (!body?.meshyJobId || !body.materialId || !body.profileId) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const meshy = await prisma.meshyJob.findUnique({
    where: { id: body.meshyJobId },
  });
  if (!meshy || meshy.userId !== session.user.id) {
    return NextResponse.json({ error: "meshy job not found" }, { status: 404 });
  }
  if (meshy.status !== "DONE" || !meshy.modelFileKey) {
    return NextResponse.json(
      { error: "meshy job not ready" },
      { status: 400 },
    );
  }

  const [material, profile] = await Promise.all([
    prisma.material.findUnique({ where: { id: body.materialId } }),
    prisma.printProfile.findUnique({ where: { id: body.profileId } }),
  ]);
  if (!material || !material.isActive) {
    return NextResponse.json({ error: "material not available" }, { status: 400 });
  }
  if (!profile) {
    return NextResponse.json({ error: "profile not found" }, { status: 400 });
  }

  // Hash'i dosyadan hesapla (meshy job'ta tutulmuyor).
  const bytes = await readStoredFile(meshy.modelFileKey);
  const fileHash = createHash("sha256").update(bytes).digest("hex");

  // Cache lookup
  const cached = await prisma.sliceJob.findFirst({
    where: {
      fileHash,
      materialId: body.materialId,
      profileId: body.profileId,
      status: "DONE",
    },
    orderBy: { createdAt: "desc" },
  });
  if (cached) {
    return NextResponse.json({
      jobId: cached.id,
      cached: true,
      fileHash,
      sourceFileKey: meshy.modelFileKey,
    });
  }

  const job = await prisma.sliceJob.create({
    data: {
      userId: session.user.id,
      sourceFileKey: meshy.modelFileKey,
      fileHash,
      materialId: body.materialId,
      profileId: body.profileId,
      status: "QUEUED",
    },
  });
  await enqueueSlice(job.id);

  return NextResponse.json({
    jobId: job.id,
    cached: false,
    fileHash,
    sourceFileKey: meshy.modelFileKey,
  });
}
