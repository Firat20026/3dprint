"use client";

import { useState } from "react";
import { Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const inputCls =
  "mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none";

export type ProductInitial = {
  id?: string;
  title?: string;
  description?: string | null;
  priceTRY?: string;
  oldPriceTRY?: string;
  images?: string; // newline-separated, primary first
  category?: string | null;
  buyUrl?: string;
  inStock?: boolean;
  featured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export function ProductForm({
  action,
  initial = {},
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: ProductInitial;
  submitLabel: string;
}) {
  const [buyUrl, setBuyUrl] = useState(initial.buyUrl ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [images, setImages] = useState(initial.images ?? "");
  const [price, setPrice] = useState(initial.priceTRY ?? "");
  const [oldPrice, setOldPrice] = useState(initial.oldPriceTRY ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);

  async function autofill() {
    setFetchMsg(null);
    if (!buyUrl.trim()) {
      setFetchMsg("Önce Shopier linkini yapıştır.");
      return;
    }
    setFetching(true);
    try {
      const res = await fetch("/api/admin/catalog/fetch-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: buyUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setFetchMsg(data.error ?? "Bilgi çekilemedi.");
        return;
      }
      if (data.title) setTitle(data.title);
      if (data.image) setImages((prev) => (prev.trim() ? prev : data.image));
      if (data.description) setDescription(data.description);
      if (data.price) setPrice(String(data.price));
      const found = [data.title && "başlık", data.image && "görsel", data.price && "fiyat"]
        .filter(Boolean)
        .join(", ");
      setFetchMsg(
        found
          ? `Çekilenler: ${found}. Kontrol edip kaydet.`
          : "Sayfadan otomatik bilgi bulunamadı — elle gir.",
      );
    } catch {
      setFetchMsg("Bağlantı hatası.");
    } finally {
      setFetching(false);
    }
  }

  return (
    <form action={action} className="rounded-xl border border-border bg-card p-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Shopier link + autofill */}
        <div className="sm:col-span-2">
          <Label htmlFor="p-buyUrl">Shopier Linki</Label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="p-buyUrl"
              name="buyUrl"
              required
              value={buyUrl}
              onChange={(e) => setBuyUrl(e.target.value)}
              placeholder="https://www.shopier.com/..."
              className={inputCls + " !mt-0 flex-1"}
            />
            <button
              type="button"
              onClick={autofill}
              disabled={fetching}
              className="shrink-0 rounded-lg border border-border bg-secondary px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-60"
            >
              {fetching ? "Çekiliyor..." : "Linkten Doldur"}
            </button>
          </div>
          {fetchMsg && (
            <p className="mt-1.5 text-xs text-muted-foreground">{fetchMsg}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="p-title">Başlık</Label>
          <input
            id="p-title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ürün adı"
            className={inputCls}
          />
        </div>

        <div>
          <Label htmlFor="p-price">Fiyat (₺)</Label>
          <input
            id="p-price"
            name="priceTRY"
            inputMode="decimal"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="199.00"
            className={inputCls}
          />
        </div>
        <div>
          <Label htmlFor="p-oldprice">Eski Fiyat (opsiyonel — indirim için)</Label>
          <input
            id="p-oldprice"
            name="oldPriceTRY"
            inputMode="decimal"
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
            placeholder="249.00"
            className={inputCls}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="p-images">
            Görsel URL&apos;leri (her satıra bir tane, ilki kapak)
          </Label>
          <textarea
            id="p-images"
            name="images"
            rows={2}
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="https://...jpg"
            className={inputCls}
          />
        </div>

        <div>
          <Label htmlFor="p-category">Kategori</Label>
          <input
            id="p-category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Dekorasyon"
            className={inputCls}
          />
        </div>
        <div>
          <Label htmlFor="p-sort">Sıra (küçük önce)</Label>
          <input
            id="p-sort"
            name="sortOrder"
            type="number"
            step="1"
            defaultValue={initial.sortOrder ?? 0}
            className={inputCls}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="p-desc">Açıklama</Label>
          <textarea
            id="p-desc"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ürün açıklaması"
            className={inputCls}
          />
        </div>

        <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="inStock"
              defaultChecked={initial.inStock ?? true}
              className="size-4"
            />
            Stokta
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initial.featured ?? false}
              className="size-4"
            />
            Öne çıkan (anasayfa)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initial.isActive ?? true}
              className="size-4"
            />
            Yayında
          </label>
        </div>

        <div className="sm:col-span-2">
          <SubmitButton size="md" pendingLabel="Kaydediliyor...">
            {submitLabel}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
