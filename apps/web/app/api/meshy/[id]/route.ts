/**
 * GET /api/meshy/[id]
 *
 * MeshyJob status polling endpoint. Yalnızca job sahibi erişebilir.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUrlFor } from "@/lib/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const job = await prisma.meshyJob.findUnique({ where: { id } });
  if (!job || job.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    mode: job.mode,
    status: job.status,
    prompt: job.prompt,
    modelFileKey: job.modelFileKey,
    modelUrl: job.modelFileKey ? publicUrlFor(job.modelFileKey) : null,
    thumbnailUrl: job.thumbnailUrl,
    errorText: job.errorText,
    creditsCharged: job.creditsCharged,
    createdAt: job.createdAt,
  });
}
