"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { TR_CITIES } from "@/lib/tr-cities";

const SHIPPING_FLAT_TRY = 80;
const FREE_SHIPPING_THRESHOLD_TRY = 500;

type FieldKey =
  | "fullName"
  | "phone"
  | "email"
  | "city"
  | "district"
  | "address"
  | "zipCode"
  | "identityNumber"
  | "notes";

export function CheckoutFlow({
  user,
}: {
  user: { email: string; name: string };
}) {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotalTRY());
  const clear = useCart((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState<Record<FieldKey, string>>({
    fullName: user.name,
    phone: "",
    email: user.email,
    city: "İstanbul",
    district: "",
    address: "",
    zipCode: "",
    identityNumber: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mounted) {
    return (
      <div className="h-64 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
        <p className="font-display text-xl uppercase tracking-tight">Sepet boş</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Ödemeye geçmeden önce sepete ürün ekle.
        </p>
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_TRY ? 0 : SHIPPING_FLAT_TRY;
  const total = subtotal + shipping;

  const requiredFields: FieldKey[] = [
    "fullName", "phone", "email", "city", "district", "address",
  ];
  const canSubmit = requiredFields.every((k) => form[k].trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Zorunlu alanları doldur.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => {
          if (i.kind === "design") {
            return {
              kind: "design" as const,
              designId: i.designId,
              materialId: i.materialId,
              profileId: i.profileId,
              quantity: i.quantity,
              unitPriceTRY: i.unitPriceTRY,
              title: i.title,
              materialName: i.materialName,
              profileName: i.profileName,
            };
          }
          return {
            kind: "slice" as const,
            sliceJobId: i.sliceJobId,
            quantity: i.quantity,
            title: i.title,
          };
        }),
        shipping: form,
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      clear();
      // paymentPageUrl: gerçek iyzico → hosted payment form, mock → direkt callback
      window.location.href = data.paymentPageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "bilinmeyen hata");
      setSubmitting(false);
    }
  }

  function setField(k: FieldKey, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        <Section title="İletişim">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Ad Soyad" required value={form.fullName} onChange={(v) => setField("fullName", v)} />
            <TextField label="E-posta" type="email" required value={form.email} onChange={(v) => setField("email", v)} />
            <TextField label="Telefon" placeholder="0555 000 00 00" required value={form.phone} onChange={(v) => setField("phone", v)} />
            <TextField label="TC Kimlik No" placeholder="opsiyonel" value={form.identityNumber} onChange={(v) => setField("identityNumber", v)} />
          </div>
        </Section>

        <Section title="Teslimat Adresi">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="İl"
              required
              value={form.city}
              options={TR_CITIES}
              onChange={(v) => setField("city", v)}
            />
            <TextField label="İlçe" required value={form.district} onChange={(v) => setField("district", v)} />
            <div className="sm:col-span-2">
              <TextField
                label="Açık Adres"
                required
                multiline
                placeholder="Mahalle, sokak, bina no, daire"
                value={form.address}
                onChange={(v) => setField("address", v)}
              />
            </div>
            <TextField label="Posta Kodu" value={form.zipCode} onChange={(v) => setField("zipCode", v)} />
          </div>
        </Section>

        <Section title="Not">
          <TextField
            label=""
            multiline
            placeholder="Baskı/kargo için özel not (opsiyonel)"
            value={form.notes}
            onChange={(v) => setField("notes", v)}
          />
        </Section>
      </div>

      <aside className="h-fit rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display text-lg uppercase tracking-tight">Özet</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 text-[var(--color-text-muted)]">
              <span className="min-w-0">
                <span className="block truncate text-[var(--color-text)]">{i.title}</span>
                <span className="text-[10px] uppercase tracking-wider">
                  {i.materialName} · {i.profileName} · ×{i.quantity}
                </span>
              </span>
              <span className="font-medium text-[var(--color-text)]">
                ₺{(i.unitPriceTRY * i.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-muted)]">Ara toplam</dt>
            <dd className="font-medium">₺{subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-muted)]">Kargo</dt>
            <dd className="font-medium">
              {shipping === 0 ? (
                <span className="text-[var(--color-success)]">Ücretsiz</span>
              ) : (
                `₺${shipping.toFixed(2)}`
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base">
            <dt className="uppercase tracking-wider">Toplam</dt>
            <dd className="font-display text-xl uppercase tracking-tight">
              ₺{total.toFixed(2)}
            </dd>
          </div>
        </dl>

        {error && (
          <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-xs text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          disabled={submitting || !canSubmit}
        >
          {submitting ? "Yönlendiriliyor…" : `₺${total.toFixed(2)} Öde`}
        </Button>
        <p className="mt-3 text-center text-[10px] text-[var(--color-text-subtle)]">
          iyzico güvenli ödeme sayfasına yönlendirileceksin
        </p>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="font-display text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TextField({
  label,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
  multiline,
}: {
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const common =
    "w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand)] focus:outline-none";
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
          {label} {required && <span className="text-[var(--color-accent)]">*</span>}
        </span>
      )}
      {multiline ? (
        <textarea
          className={common + " min-h-[80px]"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <input
          type={type}
          className={common}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label} {required && <span className="text-[var(--color-accent)]">*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
