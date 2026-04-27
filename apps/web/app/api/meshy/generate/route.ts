/**
 * POST /api/meshy/generate
 *
 * multipart/form-data:
 *   mode: "TEXT" | "IMAGE"
 *   prompt?: string      (TEXT için zorunlu)
 *   image?: File         (IMAGE için zorunlu)
 *
 * Atomic: kredi düş (CreditLedger + User.credits) + MeshyJob yarat. Yetersiz
 * krediyse 402 döner. Başarılıysa mock completion scheduler tetiklenir.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { saveUpload } from "@/lib/storage";
import { scheduleCompletion } from "@/lib/meshy/client";
import { track, EVENTS } from "@/lib/observability";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT_LENGTH = 1000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }
  const userId = session.user.id;

  // 20 generations / 5 min per user — credits already gate this but a
  // tight loop could otherwise burn the user's wallet in seconds.
  const rl = await rateLimit({
    key: `meshy:${clientKey(req, userId)}`,
    limit: 20,
    windowSec: 300,
  });
  if (!rl.allowed) return tooManyRequests(rl.resetSec);

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid form" }, { status: 400 });
  }

  const modeRaw = form.get("mode");
  const mode = modeRaw === "TEXT" || modeRaw === "IMAGE" ? modeRaw : null;
  if (!mode) {
    return NextResponse.json({ error: "mode required" }, { status: 400 });
  }

  const prompt = typeof form.get("prompt") === "string"
    ? (form.get("prompt") as string).trim()
    : "";
  const image = form.get("image");

  if (mode === "TEXT" && prompt.length < 3) {
    return NextResponse.json({ error: "prompt en az 3 karakter" }, { status: 400 });
  }
  if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `prompt en fazla ${MAX_PROMPT_LENGTH} karakter olabilir` },
      { status: 400 },
    );
  }
  if (mode === "IMAGE" && !(image instanceof File)) {
    return NextResponse.json({ error: "image dosyası gerekli" }, { status: 400 });
  }

  const settings = await getSettings();
  const cost = mode === "TEXT" ? settings.meshyTextCost : settings.meshyImageCost;

  // Görsel yüklemeyi transaction öncesi (dosya I/O) — başarısız olursa kredi düşülmemiş olur.
  let imageKey: string | null = null;
  if (mode === "IMAGE" && image instanceof File) {
    const bytes = Buffer.from(await image.arrayBuffer());
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "görsel 10MB üstünde" }, { status: 400 });
    }
    const saved = await saveUpload("meshyInput", image.name || "image.png", bytes);
    imageKey = saved.key;
  }

  // Atomic: bakiye kontrolü + düşüm + job kaydı
  let job;
  try {
    job = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });
      if (!user) throw new Error("user not found");
      if (user.credits < cost) throw new Error("insufficient-credits");

      const created = await tx.meshyJob.create({
        data: {
          userId,
          mode,
          prompt: prompt || null,
          imageKey,
          status: "PENDING",
          creditsCharged: cost,
        },
      });

      await tx.creditLedger.create({
        data: {
          userId,
          delta: -cost,
          reason: mode === "TEXT" ? "MESHY_TEXT" : "MESHY_IMAGE",
          refId: created.id,
          note: mode === "TEXT" ? "AI metin → model" : "AI görsel → model",
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } },
      });

      return created;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate failed";
    if (msg === "insufficient-credits") {
      return NextResponse.json(
        { error: "Yetersiz kredi", needed: cost },
        { status: 402 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  void track(
    EVENTS.MESHY_JOB_STARTED,
    { jobId: job.id, mode, creditsCharged: cost, hasPrompt: Boolean(prompt) },
    { userId },
  );
  void track(
    EVENTS.CREDITS_SPENT,
    {
      source: "meshy",
      refId: job.id,
      amount: cost,
      reason: mode === "TEXT" ? "MESHY_TEXT" : "MESHY_IMAGE",
    },
    { userId },
  );

  // Routes to real Meshy if MESHY_PROVIDER=real + MESHY_API_KEY are set,
  // otherwise to the bundled-sample mock.
  scheduleCompletion(job.id);

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    creditsCharged: cost,
  });
}
