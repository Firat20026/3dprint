"use client";

/**
 * AddToCartForm — material + profile + (optional) plate picker for catalog
 * design pages.
 *
 * Key design choices:
 *  - For multi-plate designs (plateCount > 1) we show a plate selector with
 *    a "Hepsi" option. Selecting a single plate adds one cart line; "Hepsi"
 *    adds N lines (one per plate, all with the currently-chosen material).
 *  - Estimated price uses the SAME helper the server uses
 *    (`estimateDesignUnitPrice`) so the preview matches the order total.
 *    Server still recomputes at checkout — preview is just a hint.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { estimateDesignUnitPrice } from "@/lib/pricing";

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
  /** Multi-plate 3MF: 1 means single-plate (default). */
  plateCount?: number;
  /** Marketplace seller markup % from Design.basePriceMarkupPercent. */
  designerMarkupPercent?: number;
  /** Platform pricing knobs from app settings. Required for an honest
   *  preview that matches the server-side computation. */
  marginPercent: number;
  setupFeeTRY: number;
};

export function AddToCartForm({
  designId,
  designSlug,
  title,
  thumbnailUrl,
  materials,
  profiles,
  defaultProfileId,
  plateCount = 1,
  designerMarkupPercent = 0,
  marginPercent,
  setupFeeTRY,
}: Props) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [profileId, setProfileId] = useState(
    defaultProfileId ?? profiles.find((p) => p.name === "Standart")?.id ?? profiles[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  // null → "Hepsi" (add every plate as its own line). 1-based plate id when
  // a specific plate is selected.
  const [selectedPlate, setSelectedPlate] = useState<number | null>(
    plateCount > 1 ? null : 1,
  );

  const material = useMemo(
    () => materials.find((m) => m.id === materialId) ?? materials[0],
    [materials, materialId],
  );
  const profile = useMemo(
    () => profiles.find((p) => p.id === profileId) ?? profiles[0],
    [profiles, profileId],
  );

  const estimatedUnitPrice = material
    ? estimateDesignUnitPrice({
        pricePerGramTRY: material.pricePerGramTRY,
        designerMarkupPercent,
        settings: { marginPercent, setupFeeTRY },
      })
    : 0;

  // What the cart total preview shows depending on plate selection.
  const platesToAdd = selectedPlate === null ? plateCount : 1;
  const previewTotal = estimatedUnitPrice * platesToAdd * quantity;

  function handleAdd(goToCart: boolean) {
    if (!material || !profile) return;

    const plateIndices: number[] =
      selectedPlate === null
        ? Array.from({ length: plateCount }, (_, i) => i + 1)
        : [selectedPlate];

    for (const plateIndex of plateIndices) {
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
        plateIndex,
      });
    }

    if (goToCart) router.push("/cart");
  }

  return (
    <div className="space-y-5">
      {plateCount > 1 && (
        <div>
          <p
            id="atc-plate-label"
            className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]"
          >
            Plate Seçimi
          </p>
          <p className="mt-1 text-[10px] text-[var(--color-text-subtle)]">
            Bu tasarım {plateCount} plate'ten oluşuyor. Tek plate seç veya
            hepsini birden ayrı satır olarak ekle.
          </p>
          <div
            role="radiogroup"
            aria-labelledby="atc-plate-label"
            className="mt-2 flex flex-wrap gap-1.5"
          >
            <PlateChip
              label="Hepsi"
              active={selectedPlate === null}
              onClick={() => setSelectedPlate(null)}
            />
            {Array.from({ length: plateCount }, (_, i) => i + 1).map((p) => (
              <PlateChip
                key={p}
                label={`Plate ${p}`}
                active={selectedPlate === p}
                onClick={() => setSelectedPlate(p)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p
          id="atc-material-label"
          className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]"
        >
          Materyal
        </p>
        <div
          role="radiogroup"
          aria-labelledby="atc-material-label"
          className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {materials.map((m) => {
            const checked = m.id === materialId;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={`${m.name} (${m.type})`}
                onClick={() => setMaterialId(m.id)}
                className={
                  "flex items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-xs transition-colors " +
                  (checked
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-text)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:border-[var(--color-border)]/80 hover:text-[var(--color-text)]")
                }
              >
                <span
                  className="size-4 shrink-0 rounded-full border border-white/10"
                  style={{ backgroundColor: m.colorHex }}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p
          id="atc-profile-label"
          className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]"
        >
          Baskı Kalitesi
        </p>
        <div
          role="radiogroup"
          aria-labelledby="atc-profile-label"
          className="mt-2 grid grid-cols-3 gap-2"
        >
          {profiles.map((p) => {
            const checked = p.id === profileId;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={`${p.name}, ${p.layerHeightMm}mm layer, %${p.infillPercent} infill`}
                onClick={() => setProfileId(p.id)}
                className={
                  "rounded-[10px] border px-3 py-2.5 text-left text-xs transition-colors " +
                  (checked
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10"
                    : "border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)]/80")
                }
              >
                <p className="font-medium text-[var(--color-text)]">{p.name}</p>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                  {p.layerHeightMm}mm · %{p.infillPercent}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <p
            id="atc-qty-label"
            className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]"
          >
            Adet
          </p>
          <div
            role="spinbutton"
            aria-labelledby="atc-qty-label"
            aria-valuemin={1}
            aria-valuemax={20}
            aria-valuenow={quantity}
            className="mt-2 inline-flex items-center overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-border)]"
          >
            <button
              type="button"
              aria-label="Adeti azalt"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            >
              −
            </button>
            <span className="w-10 text-center font-medium" aria-hidden="true">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Adeti artır"
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
            ₺{previewTotal.toFixed(2)}
          </p>
          <p className="text-[10px] text-[var(--color-text-subtle)]">
            {platesToAdd > 1
              ? `${platesToAdd} plate × ₺${estimatedUnitPrice.toFixed(2)} (kalite: tahmini)`
              : "Kesin fiyat slicing sonrası netleşir"}
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
          {platesToAdd > 1 ? `${platesToAdd} Plate'i Sepete Ekle` : "Sepete Ekle"}
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

function PlateChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 text-xs transition-colors " +
        (active
          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-2)]"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand)]/40 hover:text-[var(--color-text)]")
      }
    >
      {label}
    </button>
  );
}
