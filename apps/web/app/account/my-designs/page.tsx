import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Container } from "@/components/ui/container";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/storage";
import { slugify } from "@/lib/designs";
import { track, EVENTS } from "@/lib/observability";
import { parse3mfMetadata } from "@/lib/3mf-parser";
import { enqueueDesignThumbnail } from "@/lib/queue";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_MODEL = [".stl", ".3mf"] as const;
const ALLOWED_IMG = [".jpg", ".jpeg", ".png", ".webp"] as const;
const MAX_MODEL = 100 * 1024 * 1024;
const MAX_IMG = 5 * 1024 * 1024;

async function submitDesign(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const markupRaw = Number(formData.get("markup") ?? 20);
  const markup = Number.isFinite(markupRaw)
    ? Math.max(0, Math.min(200, Math.round(markupRaw)))
    : 20;

  if (title.length < 2) throw new Error("Başlık gerekli");

  const modelFile = formData.get("model") as File | null;
  const thumbnailFile = formData.get("thumbnail") as File | null;
  if (!modelFile || modelFile.size === 0) throw new Error("Model dosyası gerekli");
  if (modelFile.size > MAX_MODEL) throw new Error("Model 100MB'dan büyük");

  const ext = modelFile.name.slice(modelFile.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_MODEL.includes(ext as (typeof ALLOWED_MODEL)[number])) {
    throw new Error("Sadece STL veya 3MF");
  }

  const modelBytes = Buffer.from(await modelFile.arrayBuffer());
  const { key: modelKey } = await saveUpload("design", modelFile.name, modelBytes);

  let plateCount = 1;
  let materialGroups: Prisma.InputJsonValue = [];
  if (ext === ".3mf") {
    const meta = await parse3mfMetadata(modelBytes);
    plateCount = meta.plateCount;
    materialGroups = meta.materialGroups as unknown as Prisma.InputJsonValue;
  }

  let thumbnailKey: string | null = null;
  if (thumbnailFile && thumbnailFile.size > 0) {
    if (thumbnailFile.size > MAX_IMG) throw new Error("Thumbnail 5MB üstü");
    const iext = thumbnailFile.name.slice(thumbnailFile.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_IMG.includes(iext as (typeof ALLOWED_IMG)[number])) {
      throw new Error("Thumbnail jpg/png/webp olmalı");
    }
    const b = Buffer.from(await thumbnailFile.arrayBuffer());
    const saved = await saveUpload("thumbnail", thumbnailFile.name, b);
    thumbnailKey = saved.key;
  }

  const baseSlug = slugify(title) || "tasarim";
  let slug = baseSlug;
  for (let i = 2; i < 200; i++) {
    const exists = await prisma.design.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }

  const created = await prisma.design.create({
    data: {
      slug,
      title,
      description,
      category,
      modelFileKey: modelKey,
      fileFormat: ext.replace(".", ""),
      thumbnailUrl: thumbnailKey,
      status: "PENDING_REVIEW",
      source: "USER_MARKETPLACE",
      basePriceMarkupPercent: markup,
      uploaderId: session.user.id,
      plateCount,
      materialGroups,
      thumbnailGeneratedAt: thumbnailKey ? new Date() : null,
    },
    select: { id: true, title: true },
  });

  void track(
    EVENTS.DESIGN_SUBMITTED,
    { designId: created.id, title: created.title, markup },
    { userId: session.user.id },
  );

  if (!thumbnailKey) {
    await enqueueDesignThumbnail(created.id).catch(() => void 0);
  }

  revalidatePath("/account/my-designs");
  revalidatePath("/admin/designs");
}

async function resubmitDesign(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id required");

  // Owner-only: ensure the design belongs to this user before status change.
  const design = await prisma.design.findUnique({
    where: { id },
    select: { id: true, uploaderId: true, status: true },
  });
  if (!design || design.uploaderId !== session.user.id) {
    throw new Error("NOT_FOUND");
  }
  if (design.status !== "REJECTED") {
    throw new Error("Sadece reddedilmiş tasarımlar yeniden gönderilebilir");
  }

  await prisma.design.update({
    where: { id },
    data: {
      status: "PENDING_REVIEW",
      rejectionReason: null,
      reviewedAt: null,
      reviewedById: null,
    },
  });

  revalidatePath("/account/my-designs");
  revalidatePath("/admin/designs");
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İnceleniyor",
  PUBLISHED: "Yayında",
  REJECTED: "Reddedildi",
  ARCHIVED: "Arşiv",
};

export default async function MyDesignsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirect=/account/my-designs");

  const designs = await prisma.design.findMany({
    where: { uploaderId: session.user.id, source: "USER_MARKETPLACE" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Hesap</p>
      <div className="mt-3 flex items-center justify-between gap-6">
        <h1 className="h-display text-4xl md:text-5xl">
          Tasarımlarım
        </h1>
        <nav className="hidden gap-4 text-sm text-muted-foreground md:flex">
          <Link href="/account/orders" className="hover:text-foreground">
            Siparişler
          </Link>
          <Link href="/account/credits" className="hover:text-foreground">
            Krediler
          </Link>
          <Link href="/account/my-designs" className="text-foreground">
            Tasarımlar
          </Link>
        </nav>
      </div>

      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Tasarımını yükle, onaylandığında katalogda herkes bastırabilir — her
        satışta kâr markupın kadar sana geçer.
      </p>

      {/* Upload form */}
      <section className="mt-10">
        <h2 className="font-display text-xl uppercase tracking-tight">
          Yeni Tasarım Gönder
        </h2>
        <form
          action={submitDesign}
          className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              name="title"
              required
              minLength={2}
              maxLength={120}
              placeholder="Örn. Mini Saksı Seti"
              className="mt-1.5"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Açıklama</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Boyut, kullanım, ek not..."
              className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              name="category"
              placeholder="Organizasyon / Hediyelik / Teknik"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="markup">Kâr Markupın (%)</Label>
            <Input
              id="markup"
              name="markup"
              type="number"
              min={0}
              max={200}
              defaultValue={20}
              className="mt-1.5"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Platform komisyonu ayrıca düşülür.
            </p>
          </div>
          <div>
            <Label htmlFor="model">Model (STL / 3MF)</Label>
            <input
              id="model"
              name="model"
              type="file"
              accept=".stl,.3mf"
              required
              className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90"
            />
          </div>
          <div>
            <Label htmlFor="thumbnail">Thumbnail (opsiyonel)</Label>
            <input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-border"
            />
          </div>
          <div className="md:col-span-2">
            <SubmitButton size="lg" pendingLabel="Gönderiliyor...">
              Onaya Gönder
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* Submissions list */}
      <section className="mt-12">
        <h2 className="font-display text-xl uppercase tracking-tight">
          Gönderimlerim ({designs.length})
        </h2>
        {designs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Henüz gönderim yok.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Başlık</th>
                  <th className="px-4 py-3 text-left">Kategori</th>
                  <th className="px-4 py-3 text-left">Kâr %</th>
                  <th className="px-4 py-3 text-left">Durum</th>
                  <th className="px-4 py-3 text-left">Tarih</th>
                  <th className="px-4 py-3 text-right">Bağlantı</th>
                </tr>
              </thead>
              <tbody>
                {designs.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-border bg-card align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.title}</div>
                      {d.status === "REJECTED" && d.rejectionReason && (
                        <div className="mt-2 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                          <span className="font-semibold">Red sebebi:</span>{" "}
                          {d.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      %{d.basePriceMarkupPercent}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          d.status === "PUBLISHED"
                            ? "success"
                            : d.status === "REJECTED"
                              ? "default"
                              : d.status === "PENDING_REVIEW"
                                ? "accent"
                                : "default"
                        }
                        className={
                          d.status === "REJECTED"
                            ? "border-destructive/40 bg-destructive/15 text-destructive"
                            : ""
                        }
                      >
                        {STATUS_LABELS[d.status] ?? d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.createdAt.toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.status === "PUBLISHED" ? (
                        <Link
                          href={`/designs/${d.slug}`}
                          className="text-sm font-medium text-foreground hover:underline"
                        >
                          Katalogda →
                        </Link>
                      ) : d.status === "REJECTED" ? (
                        <form action={resubmitDesign}>
                          <input type="hidden" name="id" value={d.id} />
                          <SubmitButton size="sm" pendingLabel="Gönderiliyor...">
                            Yeniden Gönder
                          </SubmitButton>
                        </form>
                      ) : (
                        <span className="text-sm text-muted-foreground/70">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Container>
  );
}
