"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";

type MaterialOption = {
  id: string;
  name: string;
  type: string;
  colorHex: string;
  pricePerGramTRY: number;
};

type ProfileOption = {
  id: string;
  name: string;
  layerHeightMm: number;
  infillPercent: number;
};

type Props = {
  designId: string;
  designSlug: string;
  title: string;
  thumbnailUrl: string | null;
  materials: MaterialOption[];
  profiles: ProfileOption[];
  defaultProfileId?: string | null;
  estimatedGrams?: number; // Faz 2 slice sonuçsuz bir placeholder estimate
};

export function AddToCartForm({
  designId,
  designSlug,
  title,
  thumbnailUrl,
  materials,
  profiles,
  defaultProfileId,
  estimatedGrams = 40,
}: Props) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [profileId, setProfileId] = useState(
    defaultProfileId ?? profiles.find((p) => p.name === "Standart")?.id ?? profiles[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);

  const material = useMemo(
    () => materials.find((m) => m.id === materialId) ?? materials[0],
    [materials, materialId],
  );
  const profile = useMemo(
    () => profiles.find((p) => p.id === profileId) ?? profiles[0],
    [profiles, profileId],
  );

  // Faz 1 placeholder fiyat — Faz 2'de slice sonucu + pricing engine ile gerçeğe dönecek.
  // Şimdilik: ~40g estimate × pricePerGramTRY + setup (15) × margin (1.40)
  const estimatedUnitPrice = material
    ? Math.round(
        (estimatedGrams * material.pricePerGramTRY + 15) * 1.4 * 100,
      ) / 100
    : 0;

  function handleAdd(goToCart: boolean) {
    if (!material || !profile) return;
    addItem({
      kind: "design",
      designId,
      designSlug,
      title,
      thumbnailUrl,
      materialId: material.id,
      materialName: material.name,
      materialColorHex: material.colorHex,
      profileId: profile.id,
      profileName: profile.name,
      quantity,
      unitPriceTRY: estimatedUnitPrice,
    });
    if (goToCart) router.push("/cart");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
          Materyal
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {materials.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMaterialId(m.id)}
              className={
                "flex items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-xs transition-colors " +
                (m.id === materialId
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-text)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:border-[var(--color-border)]/80 hover:text-[var(--color-text)]")
              }
            >
              <span
                className="size-4 shrink-0 rounded-full border border-white/10"
                style={{ backgroundColor: m.colorHex }}
              />
              <span className="flex-1 truncate">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
          Baskı Kalitesi
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProfileId(p.id)}
              className={
                "rounded-[10px] border px-3 py-2.5 text-left text-xs transition-colors " +
                (p.id === profileId
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)]/80")
              }
            >
              <p className="font-medium text-[var(--color-text)]">{p.name}</p>
              <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                {p.layerHeightMm}mm · %{p.infillPercent}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            Adet
          </p>
          <div className="mt-2 inline-flex items-center overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            >
              −
            </button>
            <span className="w-10 text-center font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(20, quantity + 1))}
              className="px-3 py-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            Tahmini fiyat
          </p>
          <p className="mt-2 font-display text-2xl uppercase tracking-tight text-[var(--color-text)]">
            ₺{estimatedUnitPrice.toFixed(2)}
          </p>
          <p className="text-[10px] text-[var(--color-text-subtle)]">
            Kesin fiyat slicing sonrası netleşir
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          onClick={() => handleAdd(false)}
          disabled={!material || !profile}
        >
          Sepete Ekle
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="flex-1"
          onClick={() => handleAdd(true)}
          disabled={!material || !profile}
        >
          Hemen Satın Al
        </Button>
      </div>
    </div>
  );
}
