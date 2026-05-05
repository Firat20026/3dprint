import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { AIGenerateForm } from "@/components/ai/AIGenerateForm";
import { isRealMeshyEnabled } from "@/lib/meshy/client";

export const dynamic = "force-dynamic";

export default async function AIPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirect=/ai");

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    }),
    getSettings(),
  ]);

  const balance = user?.credits ?? 0;
  const realMeshy = isRealMeshyEnabled();

  return (
    <Container className="py-12 animate-fade-in">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="eyebrow">AI ile üret</p>
          <h1 className="mt-3 h-display text-4xl md:text-5xl">
            Metin veya Görselden 3D Model
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Prompt yaz veya görsel yükle — AI sana bir 3D model çıkarsın.
            Beğenirsen aynı sayfadan bastırmaya gönder.
          </p>
        </div>
        <Link
          href="/account/credits"
          className="shrink-0 rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:border-primary/40"
        >
          Bakiye: <span className="font-mono">{balance}</span> kredi
        </Link>
      </div>

      {realMeshy ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge tone="success">Meshy API bağlı</Badge>
          <span>
            Üretim süresi 1–10 dk arası değişebilir (Meshy queue'una bağlı).
          </span>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge tone="brand">Mock mode</Badge>
          <span>
            Şu an gerçek Meshy API bağlı değil — 3 sn sonra örnek bir model döner.
          </span>
        </div>
      )}

      <div className="mt-10">
        <AIGenerateForm
          balance={balance}
          textCost={settings.meshyTextCost}
          imageCost={settings.meshyImageCost}
        />
      </div>
    </Container>
  );
}
