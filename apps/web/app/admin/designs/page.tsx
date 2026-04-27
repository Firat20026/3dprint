import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Label } from "@/components/ui/input";
import { saveUpload } from "@/lib/storage";
import { slugify } from "@/lib/designs";
import { track, EVENTS } from "@/lib/observability";
import { notify, TEMPLATES } from "@/lib/notifications";
import type { DesignStatus } from "@prisma/client";

const ALLOWED_EXT = [".stl", ".3mf"] as const;
const ALLOWED_IMG = [".jpg", ".jpeg", ".png", ".webp"] as const;
const MAX_MODEL_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_IMG_BYTES = 5 * 1024 * 1024;

async function createDesign(formData: FormData) {
  "use server";
  const user = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const profileId = String(formData.get("profileId") ?? "") || null;
  const publish = formData.get("publish") === "on";

  const modelFile = formData.get("model") as File | null;
  const thumbnailFile = formData.get("thumbnail") as File | null;

  if (!title || title.length < 2) throw new Error("Başlık gerekli");
  if (!modelFile || modelFile.size === 0)
    throw new Error("Model dosyası gerekli");
  if (modelFile.size > MAX_MODEL_BYTES)
    throw new Error("Model dosyası 100MB'dan büyük");

  const modelExt = modelFile.name
    .slice(modelFile.name.lastIndexOf("."))
    .toLowerCase();
  if (!ALLOWED_EXT.includes(modelExt as (typeof ALLOWED_EXT)[number])) {
    throw new Error("Sadece STL veya 3MF kabul ediliyor");
  }

  const modelBytes = Buffer.from(await modelFile.arrayBuffer());
  const { key: modelKey } = await saveUpload("design", modelFile.name, modelBytes);

  let thumbnailKey: string | null = null;
  if (thumbnailFile && thumbnailFile.size > 0) {
    if (thumbnailFile.size > MAX_IMG_BYTES)
      throw new Error("Thumbnail 5MB'dan büyük olamaz");
    const thumbExt = thumbnailFile.name
      .slice(thumbnailFile.name.lastIndexOf("."))
      .toLowerCase();
    if (!ALLOWED_IMG.includes(thumbExt as (typeof ALLOWED_IMG)[number])) {
      throw new Error("Thumbnail jpg/png/webp olmalı");
    }
    const thumbBytes = Buffer.from(await thumbnailFile.arrayBuffer());
    const saved = await saveUpload("thumbnail", thumbnailFile.name, thumbBytes);
    thumbnailKey = saved.key;
  }

  // Unique slug
  const baseSlug = slugify(title) || "tasarim";
  let slug = baseSlug;
  for (let i = 2; i < 100; i++) {
    const exists = await prisma.design.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }

  const status: DesignStatus = publish ? "PUBLISHED" : "DRAFT";

  await prisma.design.create({
    data: {
      slug,
      title,
      description,
      category,
      modelFileKey: modelKey,
      fileFormat: modelExt.replace(".", ""),
      thumbnailUrl: thumbnailKey,
      status,
      source: "ADMIN",
      defaultProfileId: profileId || null,
      uploaderId: user.id,
    },
  });

  revalidatePath("/admin/designs");
  revalidatePath("/designs");
}

async function approveDesign(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");
  const updated = await prisma.design.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      reviewedAt: new Date(),
      reviewedById: admin.id,
      rejectionReason: null,
    },
    select: {
      title: true,
      slug: true,
      uploader: { select: { email: true } },
    },
  });
  void track(
    EVENTS.DESIGN_APPROVED,
    { designId: id, reviewerId: admin.id },
    { userId: admin.id },
  );
  if (updated.uploader?.email) {
    void notify({
      to: updated.uploader.email,
      template: TEMPLATES.DESIGN_APPROVED,
      data: { designTitle: updated.title, designSlug: updated.slug },
    });
  }
  revalidatePath("/admin/designs");
  revalidatePath("/account/my-designs");
  revalidatePath("/designs");
}

async function rejectDesign(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) throw new Error("id gerekli");
  if (reason.length < 3) throw new Error("Red sebebi gerekli (en az 3 karakter)");
  if (reason.length > 500) throw new Error("Red sebebi en fazla 500 karakter");
  const updated = await prisma.design.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: admin.id,
      rejectionReason: reason,
    },
    select: {
      title: true,
      uploader: { select: { email: true } },
    },
  });
  void track(
    EVENTS.DESIGN_REJECTED,
    { designId: id, reviewerId: admin.id, reason: reason.slice(0, 200) },
    { userId: admin.id },
  );
  if (updated.uploader?.email) {
    void notify({
      to: updated.uploader.email,
      template: TEMPLATES.DESIGN_REJECTED,
      data: { designTitle: updated.title, rejectionReason: reason },
    });
  }
  revalidatePath("/admin/designs");
  revalidatePath("/account/my-designs");
}

async function togglePublish(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const currentStatus = String(formData.get("status") ?? "");
  if (!id) throw new Error("id gerekli");
  const newStatus: DesignStatus =
    currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  await prisma.design.update({
    where: { id },
    data: { status: newStatus },
  });
  revalidatePath("/admin/designs");
  revalidatePath("/designs");
  revalidatePath("/account/my-designs");
}

async function deleteDesign(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");
  await prisma.design.delete({ where: { id } });
  revalidatePath("/admin/designs");
  revalidatePath("/designs");
}

export default async function AdminDesignsPage() {
  const [designs, profiles, pending] = await Promise.all([
    prisma.design.findMany({
      orderBy: { createdAt: "desc" },
      include: { defaultProfile: true },
    }),
    prisma.printProfile.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.design.findMany({
      where: { status: "PENDING_REVIEW", source: "USER_MARKETPLACE" },
      orderBy: { createdAt: "asc" },
      include: { uploader: { select: { email: true, name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h2 className="font-display text-xl uppercase tracking-tight">
            Onay Bekleyen Gönderimler ({pending.length})
          </h2>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-accent)]/30">
            <table className="w-full text-sm">
              <thead className="bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)] text-xs uppercase tracking-wider text-[var(--color-accent)]">
                <tr>
                  <th className="px-4 py-3 text-left">Başlık</th>
                  <th className="px-4 py-3 text-left">Gönderen</th>
                  <th className="px-4 py-3 text-left">Kâr %</th>
                  <th className="px-4 py-3 text-left">Tarih</th>
                  <th className="px-4 py-3 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.title}</div>
                      {d.description && (
                        <div className="mt-1 line-clamp-1 text-xs text-[var(--color-text-muted)]">
                          {d.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {d.uploader?.name ?? d.uploader?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      %{d.basePriceMarkupPercent}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {d.createdAt.toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/designs/${d.id}/review`}
                            className="inline-flex h-9 items-center rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-3)]"
                          >
                            İncele
                          </Link>
                          <form action={approveDesign}>
                            <input type="hidden" name="id" value={d.id} />
                            <SubmitButton size="sm" pendingLabel="Onaylanıyor">
                              Onayla
                            </SubmitButton>
                          </form>
                        </div>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-right text-[var(--color-danger)] hover:underline">
                            Hızlı reddet ↓
                          </summary>
                          <form
                            action={rejectDesign}
                            className="mt-2 flex flex-col items-end gap-1.5"
                          >
                            <input type="hidden" name="id" value={d.id} />
                            <textarea
                              name="reason"
                              required
                              minLength={3}
                              maxLength={500}
                              rows={2}
                              placeholder="Red sebebi (kullanıcı görecek)"
                              className="w-64 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-xs text-[var(--color-text)] focus:border-[var(--color-danger)] focus:outline-none"
                            />
                            <SubmitButton
                              size="sm"
                              variant="ghost"
                              pendingLabel="Reddediliyor"
                              style={{ color: "var(--color-danger)" }}
                            >
                              Reddet
                            </SubmitButton>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">
          Yeni Tasarım Yükle
        </h2>
        <form
          action={createDesign}
          className="mt-4 grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              name="title"
              required
              minLength={2}
              maxLength={120}
              placeholder="Örn. Modüler Kablo Düzenleyici"
              className="mt-1.5"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Açıklama</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Kısa tanıtım — boyut, kullanım, özel notlar"
              className="mt-1.5 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand)] focus:outline-none"
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
            <Label htmlFor="profileId">Önerilen Baskı Profili</Label>
            <select
              id="profileId"
              name="profileId"
              className="mt-1.5 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
              defaultValue={
                profiles.find((p) => p.isDefault)?.id ?? profiles[0]?.id
              }
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.layerHeightMm}mm · %{p.infillPercent}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="model">Model Dosyası (STL / 3MF)</Label>
            <input
              id="model"
              name="model"
              type="file"
              accept=".stl,.3mf,model/stl,model/3mf"
              required
              className="mt-1.5 block w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-brand)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--color-brand-2)]"
            />
          </div>
          <div>
            <Label htmlFor="thumbnail">Thumbnail (opsiyonel)</Label>
            <input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/*"
              className="mt-1.5 block w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-surface-2)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--color-text)] hover:file:bg-[var(--color-border)]"
            />
          </div>
          <label className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              name="publish"
              defaultChecked
              className="size-4 rounded border-[var(--color-border)] bg-[var(--color-surface-2)] accent-[var(--color-brand)]"
            />
            <span className="text-sm text-[var(--color-text-muted)]">
              Yükledikten sonra doğrudan yayınla
            </span>
          </label>
          <div className="md:col-span-2">
            <SubmitButton size="lg" pendingLabel="Yükleniyor...">
              Tasarımı Oluştur
            </SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl uppercase tracking-tight">
            Tüm Tasarımlar ({designs.length})
          </h2>
        </div>
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3 text-left">Başlık</th>
                <th className="px-4 py-3 text-left">Kaynak</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-left">Profil</th>
                <th className="px-4 py-3 text-left">Tarih</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {designs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    Henüz tasarım yok. İlkini yukarıdaki formdan yükle.
                  </td>
                </tr>
              )}
              {designs.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                    {d.title}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                    {d.source === "USER_MARKETPLACE"
                      ? "Kullanıcı"
                      : d.source === "MESHY"
                        ? "AI"
                        : "Admin"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {d.category ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        d.status === "PUBLISHED"
                          ? "rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-xs text-[var(--color-success)]"
                          : d.status === "PENDING_REVIEW"
                            ? "rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-xs text-[var(--color-accent)]"
                            : d.status === "REJECTED"
                              ? "rounded-full bg-[var(--color-danger)]/15 px-2 py-0.5 text-xs text-[var(--color-danger)]"
                              : "rounded-full bg-[var(--color-text-muted)]/15 px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {d.defaultProfile?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {d.createdAt.toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {d.status === "PUBLISHED" && (
                        <>
                          <form action={togglePublish}>
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="status" value={d.status} />
                            <SubmitButton size="sm" variant="secondary" pendingLabel="...">
                              Kaldır
                            </SubmitButton>
                          </form>
                          <Link
                            href={`/designs/${d.slug}`}
                            className="inline-flex h-9 items-center rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-3)]"
                          >
                            Görüntüle
                          </Link>
                        </>
                      )}
                      {(d.status === "DRAFT" || d.status === "REJECTED") && (
                        <form action={togglePublish}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="status" value={d.status} />
                          <SubmitButton size="sm" pendingLabel="...">
                            Yayınla
                          </SubmitButton>
                        </form>
                      )}
                      {d.status === "PENDING_REVIEW" && (
                        <span className="text-xs text-[var(--color-text-subtle)]">
                          İncelemede
                        </span>
                      )}
                      <form action={deleteDesign}>
                        <input type="hidden" name="id" value={d.id} />
                        <SubmitButton
                          size="sm"
                          variant="ghost"
                          pendingLabel="..."
                          style={{ color: "var(--color-danger)" }}
                        >
                          Sil
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
