/**
 * /admin/designs/[id]/review — dedicated review page for a single user submission.
 *
 * Shows full metadata + 3D preview, with approve/reject forms inline. Reject
 * captures a required reason (≥3 chars) which becomes Design.rejectionReason
 * and surfaces to the user in /account/my-designs.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { ModelViewer } from "@/components/viewer/ModelViewer";
import { publicUrlFor } from "@/lib/urls";
import { track, EVENTS } from "@/lib/observability";
import { notify, TEMPLATES } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function approveDesign(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id required");
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
    { designId: id, reviewerId: admin.id, fromReviewPage: true },
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
  redirect("/admin/designs?approved=" + id);
}

async function rejectDesign(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) throw new Error("id required");
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
    {
      designId: id,
      reviewerId: admin.id,
      reason: reason.slice(0, 200),
      fromReviewPage: true,
    },
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
  redirect("/admin/designs?rejected=" + id);
}

export default async function DesignReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const design = await prisma.design.findUnique({
    where: { id },
    include: {
      uploader: { select: { email: true, name: true, createdAt: true } },
      defaultProfile: true,
      reviewedBy: { select: { email: true, name: true } },
    },
  });

  if (!design) notFound();

  const modelUrl = publicUrlFor(design.modelFileKey);
  const fileFormat = design.fileFormat as "stl" | "3mf";

  return (
    <Container className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/designs"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ← Tasarım listesi
          </Link>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-tight">
            Tasarım İncelemesi
          </h1>
        </div>
        <Badge
          tone={
            design.status === "PUBLISHED"
              ? "success"
              : design.status === "PENDING_REVIEW"
                ? "accent"
                : design.status === "REJECTED"
                  ? "default"
                  : "default"
          }
          className={
            design.status === "REJECTED"
              ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
              : ""
          }
        >
          {design.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {modelUrl ? (
              <ModelViewer url={modelUrl} format={fileFormat} />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-[var(--color-text-muted)]">
                Model dosyası bulunamadı
              </div>
            )}
          </div>
          <a
            href={modelUrl ?? "#"}
            download
            className="inline-flex items-center gap-2 text-xs text-[var(--color-brand-2)] hover:underline"
          >
            Dosyayı indir ({fileFormat.toUpperCase()})
          </a>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-display text-lg uppercase tracking-tight">
              {design.title}
            </h2>
            {design.description && (
              <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-text-muted)]">
                {design.description}
              </p>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <Row label="Slug" value={design.slug} mono />
              <Row label="Kaynak" value={design.source} />
              <Row label="Kategori" value={design.category ?? "—"} />
              <Row
                label="Kâr Marjı"
                value={`%${design.basePriceMarkupPercent}`}
              />
              <Row
                label="Profil"
                value={design.defaultProfile?.name ?? "—"}
              />
              <Row
                label="Yüklendi"
                value={design.createdAt.toLocaleString("tr-TR")}
              />
            </dl>
          </div>

          {design.uploader && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="eyebrow">Gönderen</p>
              <p className="mt-1 font-medium">
                {design.uploader.name ?? design.uploader.email}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {design.uploader.email}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                Üyelik:{" "}
                {design.uploader.createdAt.toLocaleDateString("tr-TR")}
              </p>
            </div>
          )}

          {design.reviewedAt && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
              <p className="eyebrow">Önceki İnceleme</p>
              <p className="mt-1 text-sm">
                {design.reviewedBy?.name ?? design.reviewedBy?.email ?? "—"}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {design.reviewedAt.toLocaleString("tr-TR")}
              </p>
              {design.rejectionReason && (
                <p className="mt-2 rounded-[var(--radius-button)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-2 text-xs text-[var(--color-danger)]">
                  {design.rejectionReason}
                </p>
              )}
            </div>
          )}

          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="eyebrow">Karar</p>
            <form action={approveDesign} className="mt-3">
              <input type="hidden" name="id" value={design.id} />
              <SubmitButton
                size="lg"
                pendingLabel="Onaylanıyor..."
                style={{ width: "100%" }}
              >
                ✓ Onayla ve Yayınla
              </SubmitButton>
            </form>

            <form action={rejectDesign} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={design.id} />
              <textarea
                name="reason"
                required
                minLength={3}
                maxLength={500}
                rows={3}
                defaultValue={design.rejectionReason ?? ""}
                placeholder="Red sebebi (kullanıcı görecek) — örn. ölçeklendirme hatalı, kalite yetersiz"
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-danger)] focus:outline-none"
              />
              <SubmitButton
                size="sm"
                variant="ghost"
                pendingLabel="Reddediliyor..."
                style={{ width: "100%", color: "var(--color-danger)" }}
              >
                Reddet
              </SubmitButton>
            </form>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-subtle)]">
        {label}
      </dt>
      <dd
        className={
          "mt-0.5 text-[var(--color-text)] " +
          (mono ? "font-mono text-[11px]" : "text-xs")
        }
      >
        {value}
      </dd>
    </div>
  );
}
