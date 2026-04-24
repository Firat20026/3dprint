import { Container } from "@/components/ui/container";
import { UploadFlow } from "@/components/upload/UploadFlow";
import { listActiveProfiles, listMaterialsInStock } from "@/lib/designs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUrlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ meshyJobId?: string }>;

export default async function UploadPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const [materials, profiles] = await Promise.all([
    listMaterialsInStock(),
    listActiveProfiles(),
  ]);

  // Meshy → Print köprüsü: /ai sayfasından "Bunu Bastır" tıklandığında gelen
  // meshyJobId query param ile UploadFlow pre-seed edilir (upload adımı atlanır).
  let meshySeed: {
    jobId: string;
    title: string;
    modelUrl: string;
  } | null = null;
  if (sp.meshyJobId) {
    const session = await auth();
    if (session?.user?.id) {
      const job = await prisma.meshyJob.findUnique({
        where: { id: sp.meshyJobId },
      });
      if (
        job &&
        job.userId === session.user.id &&
        job.status === "DONE" &&
        job.modelFileKey
      ) {
        meshySeed = {
          jobId: job.id,
          title: job.prompt?.slice(0, 60) || "AI modeli",
          modelUrl: publicUrlFor(job.modelFileKey)!,
        };
      }
    }
  }

  return (
    <Container className="py-12 animate-fade-in">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">
          {meshySeed ? "AI Modelini Bastır" : "Kendi Dosyan"}
        </p>
        <h1 className="mt-3 h-display text-4xl md:text-5xl">
          {meshySeed ? meshySeed.title : "STL/3MF yükle, basalım"}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {meshySeed
            ? "AI'ın ürettiği model dilimleniyor — materyal ve kaliteyi seç, fiyat çıkınca sepete ekle."
            : "Dosyanı bırak, materyal ve kaliteyi seç. Slicer gramaj ve süreyi hesaplar, TRY fiyat saniyeler içinde çıkar."}
        </p>
      </div>

      {materials.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-6 text-sm text-[var(--color-danger)]">
          Stokta aktif materyal bulunmuyor — admin stok eklemeden yükleme yapılamaz.
        </div>
      ) : (
        <UploadFlow
          materials={materials.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            colorHex: m.colorHex,
            pricePerGramTRY: Number(m.pricePerGramTRY),
          }))}
          profiles={profiles.map((p) => ({
            id: p.id,
            name: p.name,
            layerHeightMm: p.layerHeightMm,
            infillPercent: p.infillPercent,
            isDefault: p.isDefault,
          }))}
          meshySeed={meshySeed}
        />
      )}
    </Container>
  );
}
