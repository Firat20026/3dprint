import { prisma } from "@/lib/db";
import { Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { MaterialRow } from "@/components/admin/MaterialRow";
import { createMaterial } from "./actions";
import type { MaterialType } from "@prisma/client";

export const dynamic = "force-dynamic";

const MATERIAL_TYPES: MaterialType[] = [
  "PLA", "PETG", "TPU", "ABS", "ASA", "PVA",
  "PA", "PC", "PCTG", "PET", "CARBON_FIBER",
];

const inputCls =
  "mt-1.5 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand)] focus:outline-none";

export default async function AdminMaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* New Material Form */}
      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">Yeni Materyal</h2>
        <form
          action={createMaterial}
          className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Label htmlFor="mat-name">Materyal İsmi</Label>
              <input
                id="mat-name"
                name="name"
                required
                placeholder="Örn. PLA Mat Siyah"
                className={inputCls}
              />
            </div>
            <div>
              <Label htmlFor="mat-type">Tür</Label>
              <select id="mat-type" name="type" defaultValue="PLA" className={inputCls}>
                {MATERIAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Renk</Label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="color"
                  name="colorHex"
                  defaultValue="#ffffff"
                  className="h-10 w-14 cursor-pointer rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1"
                />
                <input
                  name="colorHexText"
                  placeholder="#ffffff"
                  defaultValue="#ffffff"
                  maxLength={7}
                  className={inputCls + " flex-1 !mt-0 font-mono"}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mat-stock">Stok (gram)</Label>
              <input id="mat-stock" name="stockGrams" type="number" step="1" min="0" defaultValue="1000" className={inputCls} />
            </div>
            <div>
              <Label htmlFor="mat-price">₺ / gram</Label>
              <input id="mat-price" name="pricePerGramTRY" type="number" step="0.001" min="0" defaultValue="0.1" className={inputCls} />
            </div>
            <div>
              <Label htmlFor="mat-density">Yoğunluk (g/cm³)</Label>
              <input id="mat-density" name="densityGcm3" type="number" step="0.01" min="0.1" defaultValue="1.24" className={inputCls} />
            </div>
            <div>
              <Label htmlFor="mat-diam">Çap (mm)</Label>
              <input id="mat-diam" name="diameterMm" type="number" step="0.01" min="0.1" defaultValue="1.75" className={inputCls} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Label htmlFor="mat-notes">Notlar (opsiyonel)</Label>
              <input id="mat-notes" name="notes" placeholder="Tedarikçi, renk tonu, özel notlar..." className={inputCls} />
            </div>
            <div>
              <SubmitButton size="md" pendingLabel="Ekleniyor...">Materyal Ekle</SubmitButton>
            </div>
          </div>
        </form>
      </section>

      {/* All Materials Table */}
      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">
          Tüm Materyaller ({materials.length})
        </h2>
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3 text-left">Materyal</th>
                <th className="px-4 py-3 text-left">Renk</th>
                <th className="px-4 py-3 text-left">Stok</th>
                <th className="px-4 py-3 text-left">₺/gram</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    Henüz materyal yok. Yukarıdaki formdan ekle.
                  </td>
                </tr>
              )}
              {materials.map((m) => (
                <MaterialRow key={m.id} m={m} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
