/**
 * /admin/coupons — Coupon management
 *
 * Create, toggle active/inactive, and view usage stats for promo codes.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { SubmitButton } from "@/components/ui/submit-button";
import type { DiscountType } from "@prisma/client";

export const dynamic = "force-dynamic";

const inputCls =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none";

// ─── Server Actions ────────────────────────────────────────────────────────

async function createCoupon(fd: FormData) {
  "use server";
  const code = (fd.get("code") as string).trim().toUpperCase();
  if (!code) throw new Error("Kod boş olamaz");

  const discountType = fd.get("discountType") as DiscountType;
  const discountValue = parseFloat(fd.get("discountValue") as string);
  const minOrderRaw = fd.get("minOrderTRY") as string;
  const maxUsageTotalRaw = fd.get("maxUsageTotal") as string;
  const maxUsagePerUser = parseInt(fd.get("maxUsagePerUser") as string, 10) || 1;
  const expiresAtRaw = fd.get("expiresAt") as string;
  const description = (fd.get("description") as string).trim() || null;

  await prisma.coupon.create({
    data: {
      code,
      description,
      discountType,
      discountValue,
      minOrderTRY: minOrderRaw ? parseFloat(minOrderRaw) : null,
      maxUsageTotal: maxUsageTotalRaw ? parseInt(maxUsageTotalRaw, 10) : null,
      maxUsagePerUser,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
    },
  });

  revalidatePath("/admin/coupons");
}

async function toggleCoupon(fd: FormData) {
  "use server";
  const id = fd.get("id") as string;
  const current = fd.get("isActive") === "true";
  await prisma.coupon.update({ where: { id }, data: { isActive: !current } });
  revalidatePath("/admin/coupons");
}

async function deleteCoupon(fd: FormData) {
  "use server";
  const id = fd.get("id") as string;
  // Only allow deleting coupons with zero uses to avoid breaking audit trail
  const uses = await prisma.couponUse.count({ where: { couponId: id } });
  if (uses > 0) throw new Error("Kullanılmış kupon silinemez.");
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { uses: true } } },
  });

  return (
    <div className="space-y-10">
      {/* Create form */}
      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">Yeni Kupon Oluştur</h2>
        <form
          action={createCoupon}
          className="mt-4 rounded-xl border border-border bg-card p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Kod <span className="text-muted-foreground">*</span>
              </label>
              <input
                name="code"
                required
                placeholder="WELCOME10"
                className={inputCls + " font-mono uppercase tracking-widest"}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Açıklama
              </label>
              <input name="description" placeholder="Admin notu" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                İndirim Tipi <span className="text-muted-foreground">*</span>
              </label>
              <select name="discountType" required className={inputCls}>
                <option value="PERCENT">Yüzde (%)</option>
                <option value="FIXED">Sabit (₺)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                İndirim Değeri <span className="text-muted-foreground">*</span>
              </label>
              <input
                type="number"
                name="discountValue"
                required
                min="0"
                step="0.01"
                placeholder="10"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Min. Sipariş (₺)
              </label>
              <input
                type="number"
                name="minOrderTRY"
                min="0"
                step="0.01"
                placeholder="boş = sınırsız"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Maks. Toplam Kullanım
              </label>
              <input
                type="number"
                name="maxUsageTotal"
                min="1"
                placeholder="boş = sınırsız"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Kullanıcı Başı Kullanım
              </label>
              <input
                type="number"
                name="maxUsagePerUser"
                min="1"
                defaultValue="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Son Kullanım Tarihi
              </label>
              <input type="date" name="expiresAt" className={inputCls} />
            </div>
          </div>
          <div className="mt-5">
            <SubmitButton size="sm" pendingLabel="Oluşturuluyor…">
              Kupon Oluştur
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* List */}
      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">
          Kuponlar ({coupons.length})
        </h2>
        {coupons.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Henüz kupon yok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Kod</th>
                  <th className="px-4 py-3 text-left">İndirim</th>
                  <th className="px-4 py-3 text-left">Min. Sipariş</th>
                  <th className="px-4 py-3 text-left">Kullanım</th>
                  <th className="px-4 py-3 text-left">Son Tarih</th>
                  <th className="px-4 py-3 text-left">Durum</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {coupons.map((c) => {
                  const isExpired = c.expiresAt ? c.expiresAt < new Date() : false;
                  const limitHit =
                    c.maxUsageTotal !== null && c.usageCount >= c.maxUsageTotal;
                  const effectivelyActive = c.isActive && !isExpired && !limitHit;

                  return (
                    <tr key={c.id} className="hover:bg-secondary">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium tracking-widest">
                          {c.code}
                        </span>
                        {c.description && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {c.description}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.discountType === "PERCENT"
                          ? `%${Number(c.discountValue).toFixed(0)}`
                          : `₺${Number(c.discountValue).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.minOrderTRY ? `₺${Number(c.minOrderTRY).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={limitHit ? "text-destructive" : ""}>
                          {c.usageCount}
                          {c.maxUsageTotal !== null ? ` / ${c.maxUsageTotal}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.expiresAt ? (
                          <span className={isExpired ? "text-destructive" : ""}>
                            {c.expiresAt.toLocaleDateString("tr-TR")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider " +
                            (effectivelyActive
                              ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                              : "bg-secondary text-muted-foreground/70")
                          }
                        >
                          {effectivelyActive ? "Aktif" : isExpired ? "Süresi Doldu" : limitHit ? "Limit Doldu" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <form action={toggleCoupon}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="isActive" value={String(c.isActive)} />
                            <SubmitButton
                              size="sm"
                              variant="ghost"
                              pendingLabel="…"
                            >
                              {c.isActive ? "Pasifleştir" : "Aktifleştir"}
                            </SubmitButton>
                          </form>
                          {c._count.uses === 0 && (
                            <form action={deleteCoupon}>
                              <input type="hidden" name="id" value={c.id} />
                              <SubmitButton
                                size="sm"
                                variant="ghost"
                                pendingLabel="…"
                                style={{ color: "var(--color-danger)" }}
                              >
                                Sil
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
