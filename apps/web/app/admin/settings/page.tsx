import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings, updateSetting } from "@/lib/settings";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

async function saveSettings(formData: FormData) {
  "use server";
  await requireAdmin();

  const fields = [
    "machineCostPerHourTRY",
    "setupFeeTRY",
    "marginPercent",
    "shippingFlatTRY",
    "freeShippingThresholdTRY",
    "meshyTextCost",
    "meshyImageCost",
    "marketplaceCommissionPercent",
  ] as const;

  for (const key of fields) {
    const raw = formData.get(key);
    const value = raw !== null && raw !== "" ? Number(raw) : 0;
    await updateSetting(key, value);
  }

  revalidatePath("/admin/settings");
}

async function createCreditPack(formData: FormData) {
  "use server";
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const credits = parseInt(String(formData.get("credits") ?? "0"), 10);
  const priceTRY = parseFloat(String(formData.get("priceTRY") ?? "0"));
  const badge = String(formData.get("badge") ?? "").trim() || null;
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  if (!name) throw new Error("İsim gerekli");
  if (credits <= 0) throw new Error("Kredi sayısı 0'dan büyük olmalı");
  if (priceTRY <= 0) throw new Error("Fiyat 0'dan büyük olmalı");

  await prisma.creditPack.create({
    data: { name, credits, priceTRY, badge, sortOrder, isActive: true },
  });

  revalidatePath("/admin/settings");
}

async function toggleCreditPack(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");

  const pack = await prisma.creditPack.findUniqueOrThrow({ where: { id } });
  await prisma.creditPack.update({
    where: { id },
    data: { isActive: !pack.isActive },
  });

  revalidatePath("/admin/settings");
}

async function deleteCreditPack(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");

  await prisma.creditPack.delete({ where: { id } });
  revalidatePath("/admin/settings");
}

const SETTING_LABELS: Record<string, { label: string; step: string }> = {
  machineCostPerHourTRY: { label: "Makine Maliyeti (₺/saat)", step: "0.01" },
  setupFeeTRY: { label: "Kurulum Ücreti (₺)", step: "0.01" },
  marginPercent: { label: "Kâr Marjı (%)", step: "0.01" },
  shippingFlatTRY: { label: "Sabit Kargo Ücreti (₺)", step: "0.01" },
  freeShippingThresholdTRY: { label: "Ücretsiz Kargo Eşiği (₺)", step: "0.01" },
  meshyTextCost: { label: "Meshy Text Kredi Maliyeti", step: "1" },
  meshyImageCost: { label: "Meshy Image Kredi Maliyeti", step: "1" },
  marketplaceCommissionPercent: { label: "Pazar Yeri Komisyonu (%)", step: "0.01" },
};

export default async function AdminSettingsPage() {
  const [settings, packs] = await Promise.all([
    getSettings(),
    prisma.creditPack.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-10">
      {/* Pricing Settings */}
      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">
          Fiyatlandırma Ayarları
        </h2>
        <form
          action={saveSettings}
          className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(SETTING_LABELS) as (keyof typeof SETTING_LABELS)[]).map(
              (key) => {
                const { label, step } = SETTING_LABELS[key];
                const value = settings[key as keyof typeof settings];
                return (
                  <div key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      name={key}
                      type="number"
                      step={step}
                      min="0"
                      defaultValue={String(value)}
                      className="mt-1.5"
                    />
                  </div>
                );
              }
            )}
          </div>
          <div className="mt-6">
            <SubmitButton size="md" pendingLabel="Kaydediliyor...">
              Ayarları Kaydet
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* Credit Packs */}
      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">
          AI Kredi Paketleri
        </h2>

        <div className="mt-4 overflow-hidden overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3 text-left">İsim</th>
                <th className="px-4 py-3 text-left">Kredi</th>
                <th className="px-4 py-3 text-left">Fiyat (₺)</th>
                <th className="px-4 py-3 text-left">Rozet</th>
                <th className="px-4 py-3 text-left">Aktif</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {packs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    Henüz kredi paketi yok.
                  </td>
                </tr>
              )}
              {packs.map((pack) => (
                <tr
                  key={pack.id}
                  className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <td className="px-4 py-3 font-medium">{pack.name}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {pack.credits}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    ₺{Number(pack.priceTRY).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {pack.badge ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        pack.isActive
                          ? "rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-xs text-[var(--color-success)]"
                          : "rounded-full bg-[var(--color-danger)]/15 px-2 py-0.5 text-xs text-[var(--color-danger)]"
                      }
                    >
                      {pack.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <form action={toggleCreditPack}>
                        <input type="hidden" name="id" value={pack.id} />
                        <SubmitButton size="sm" variant="secondary" pendingLabel="...">
                          {pack.isActive ? "Devre Dışı" : "Etkinleştir"}
                        </SubmitButton>
                      </form>
                      <form action={deleteCreditPack}>
                        <input type="hidden" name="id" value={pack.id} />
                        <SubmitButton
                          size="sm"
                          variant="ghost"
                          pendingLabel="Siliniyor..."
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

        {/* Add New Pack Form */}
        <form
          action={createCreditPack}
          className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Yeni Paket Ekle
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Label htmlFor="pack-name">Paket İsmi</Label>
              <Input
                id="pack-name"
                name="name"
                required
                placeholder="Örn. Başlangıç Paketi"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="pack-credits">Kredi Miktarı</Label>
              <Input
                id="pack-credits"
                name="credits"
                type="number"
                step="1"
                min="1"
                required
                placeholder="100"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="pack-price">Fiyat (₺)</Label>
              <Input
                id="pack-price"
                name="priceTRY"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="49.90"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="pack-sort">Sıra</Label>
              <Input
                id="pack-sort"
                name="sortOrder"
                type="number"
                step="1"
                min="0"
                defaultValue="0"
                className="mt-1.5"
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="pack-badge">Rozet (opsiyonel)</Label>
              <Input
                id="pack-badge"
                name="badge"
                placeholder="Örn. Popüler"
                className="mt-1.5"
              />
            </div>
            <div className="lg:col-span-3 flex items-end">
              <SubmitButton size="md" pendingLabel="Ekleniyor...">
                Paket Ekle
              </SubmitButton>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
