/**
 * /admin/profiles — print profile management.
 *
 * Profiles drive slicing parameters (layer height, infill, supports, speed).
 * Materials × Profiles is the price matrix users see in the pricing page.
 */
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import {
  createProfile,
  updateProfile,
  toggleProfileActive,
  deleteProfile,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProfilesPage() {
  await requireAdmin();
  const profiles = await prisma.printProfile.findMany({
    orderBy: [{ sortOrder: "asc" }, { layerHeightMm: "asc" }],
    include: {
      _count: { select: { sliceJobs: true, designs: true, cartItems: true } },
    },
  });

  return (
    <Container className="py-2 space-y-8">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-tight">
          Baskı Profilleri
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Slicing parametreleri — layer height, infill, support, hız. Aktif
          profiller pricing sayfasında ve cart'ta seçilebilir.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">
          Yeni Profil
        </h2>
        <form
          action={createProfile}
          className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-3"
        >
          <div>
            <Label htmlFor="new-name">İsim</Label>
            <Input
              id="new-name"
              name="name"
              required
              maxLength={60}
              placeholder="Örn. Standart"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="new-layer">Layer Height (mm)</Label>
            <Input
              id="new-layer"
              name="layerHeightMm"
              type="number"
              step={0.01}
              min={0.05}
              max={1}
              defaultValue={0.2}
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="new-infill">Infill (%)</Label>
            <Input
              id="new-infill"
              name="infillPercent"
              type="number"
              min={0}
              max={100}
              defaultValue={15}
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="new-speed">Hız (mm/s)</Label>
            <Input
              id="new-speed"
              name="speedMmPerS"
              type="number"
              min={10}
              max={500}
              defaultValue={180}
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="new-sort">Sıra</Label>
            <Input
              id="new-sort"
              name="sortOrder"
              type="number"
              defaultValue={0}
              className="mt-1.5"
            />
          </div>
          <div className="flex flex-col gap-2 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="supportsEnabled"
                className="size-4 accent-[var(--color-brand)]"
              />
              Support aktif
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isDefault"
                className="size-4 accent-[var(--color-brand)]"
              />
              Varsayılan yap
            </label>
          </div>
          <div className="md:col-span-3">
            <SubmitButton size="lg" pendingLabel="Oluşturuluyor...">
              Oluştur
            </SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl uppercase tracking-tight">
          Tüm Profiller ({profiles.length})
        </h2>
        <div className="space-y-3">
          {profiles.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Henüz profil yok.
            </p>
          )}
          {profiles.map((p) => {
            const referenced =
              p._count.sliceJobs + p._count.cartItems + p._count.designs;
            return (
              <details
                key={p.id}
                className="rounded-xl border border-border bg-card"
              >
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-base uppercase tracking-tight">
                      {p.name}
                    </span>
                    {p.isDefault && <Badge tone="brand">Varsayılan</Badge>}
                    {!p.isActive && (
                      <span className="rounded-full bg-[var(--color-text-muted)]/15 px-2 py-0.5 text-xs text-muted-foreground">
                        Pasif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{p.layerHeightMm}mm</span>
                    <span>%{p.infillPercent} dolgu</span>
                    <span>{p.speedMmPerS}mm/s</span>
                    {p.supportsEnabled && <span>+ destek</span>}
                    <span>· {referenced} kayıt</span>
                  </div>
                </summary>

                <form
                  action={updateProfile}
                  className="grid gap-4 border-t border-border p-5 md:grid-cols-3"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <div>
                    <Label htmlFor={`name-${p.id}`}>İsim</Label>
                    <Input
                      id={`name-${p.id}`}
                      name="name"
                      defaultValue={p.name}
                      required
                      maxLength={60}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`layer-${p.id}`}>Layer Height (mm)</Label>
                    <Input
                      id={`layer-${p.id}`}
                      name="layerHeightMm"
                      type="number"
                      step={0.01}
                      min={0.05}
                      max={1}
                      defaultValue={p.layerHeightMm}
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`infill-${p.id}`}>Infill (%)</Label>
                    <Input
                      id={`infill-${p.id}`}
                      name="infillPercent"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={p.infillPercent}
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`speed-${p.id}`}>Hız (mm/s)</Label>
                    <Input
                      id={`speed-${p.id}`}
                      name="speedMmPerS"
                      type="number"
                      min={10}
                      max={500}
                      defaultValue={p.speedMmPerS}
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`sort-${p.id}`}>Sıra</Label>
                    <Input
                      id={`sort-${p.id}`}
                      name="sortOrder"
                      type="number"
                      defaultValue={p.sortOrder}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="supportsEnabled"
                        defaultChecked={p.supportsEnabled}
                        className="size-4 accent-[var(--color-brand)]"
                      />
                      Support aktif
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="isDefault"
                        defaultChecked={p.isDefault}
                        className="size-4 accent-[var(--color-brand)]"
                      />
                      Varsayılan
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:col-span-3">
                    <SubmitButton size="sm" pendingLabel="Kaydediliyor...">
                      Kaydet
                    </SubmitButton>
                    <form action={toggleProfileActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="current"
                        value={String(p.isActive)}
                      />
                      <SubmitButton size="sm" variant="secondary" pendingLabel="...">
                        {p.isActive ? "Pasife Al" : "Aktife Al"}
                      </SubmitButton>
                    </form>
                    <form action={deleteProfile}>
                      <input type="hidden" name="id" value={p.id} />
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
                </form>
              </details>
            );
          })}
        </div>
      </section>
    </Container>
  );
}
