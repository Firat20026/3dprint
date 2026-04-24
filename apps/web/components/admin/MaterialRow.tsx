"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MaterialType } from "@prisma/client";
import { Info } from "lucide-react";

const MATERIAL_TYPES: MaterialType[] = [
  "PLA", "PETG", "TPU", "ABS", "ASA", "PVA",
  "PA", "PC", "PCTG", "PET", "CARBON_FIBER",
];

type Material = {
  id: string;
  name: string;
  type: MaterialType;
  colorHex: string;
  densityGcm3: number;
  diameterMm: number;
  stockGrams: number;
  pricePerGramTRY: number;
  isActive: boolean;
  notes: string | null;
};

const inputCls =
  "w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand)] focus:outline-none";

export function MaterialRow({ m }: { m: Material }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: "warn" | "err" } | null>(null);
  const [colorHex, setColorHex] = useState(m.colorHex);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setMsg(null);
    try {
      const fd = new FormData(formRef.current);
      const body = {
        name: fd.get("name"),
        type: fd.get("type"),
        colorHex,
        densityGcm3: parseFloat(String(fd.get("densityGcm3"))),
        diameterMm: parseFloat(String(fd.get("diameterMm"))),
        stockGrams: parseFloat(String(fd.get("stockGrams"))),
        pricePerGramTRY: parseFloat(String(fd.get("pricePerGramTRY"))),
        notes: fd.get("notes") || null,
      };
      const res = await fetch(`/api/admin/materials/${m.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
      setEditing(false);
      refresh();
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Bir hata oluştu.", kind: "err" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/materials/${m.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      refresh();
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Hata", kind: "err" });
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setConfirmDelete(false);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/materials/${m.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (data.soft) {
        setMsg({ text: data.message, kind: "warn" });
      }
      refresh();
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Silinemedi.", kind: "err" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Display row */}
      <tr className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <td className="px-4 py-3">
          <div className="font-medium text-[var(--color-text)]">{m.name}</div>
          <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{m.type}</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-5 rounded border border-white/10"
              style={{ backgroundColor: m.colorHex }}
            />
            <span className="font-mono text-xs text-[var(--color-text-muted)]">{m.colorHex}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-[var(--color-text-muted)]">
          {Number(m.stockGrams).toFixed(0)}g
        </td>
        <td className="px-4 py-3 text-[var(--color-text-muted)]">
          ₺{Number(m.pricePerGramTRY).toFixed(3)}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={
              "rounded-full px-2 py-0.5 text-xs font-medium transition-opacity disabled:opacity-50 " +
              (m.isActive
                ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                : "bg-[var(--color-border)] text-[var(--color-text-muted)]")
            }
          >
            {toggling ? "…" : m.isActive ? "Aktif" : "Pasif"}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col items-end gap-1.5">
            {!confirmDelete ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setEditing((v) => !v); setMsg(null); setConfirmDelete(false); }}
                  className="text-xs text-[var(--color-brand-2)] hover:underline"
                >
                  {editing ? "Kapat" : "Düzenle"}
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                  className="text-xs text-[var(--color-danger)] hover:underline disabled:opacity-50"
                >
                  Sil
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)]">Emin misin?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded bg-[var(--color-danger)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/30 disabled:opacity-50"
                >
                  {deleting ? "…" : "Evet, sil"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  İptal
                </button>
              </div>
            )}
            {msg && (
              <div className={
                "flex items-start gap-1 text-right text-[10px] max-w-[200px] " +
                (msg.kind === "warn" ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]")
              }>
                <Info className="mt-0.5 size-3 shrink-0" />
                <span>{msg.text}</span>
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* Inline edit row */}
      {editing && (
        <tr className="border-t border-[var(--color-brand)]/30 bg-[color-mix(in_oklab,var(--color-brand)_4%,var(--color-surface))]">
          <td colSpan={6} className="px-4 py-4">
            <form ref={formRef} onSubmit={handleUpdate}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">İsim</label>
                  <input name="name" defaultValue={m.name} required className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Tür</label>
                  <select name="type" defaultValue={m.type} className={inputCls}>
                    {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Renk</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
                    />
                    <input
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      maxLength={7}
                      className={inputCls + " flex-1 font-mono"}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Stok (g)</label>
                  <input name="stockGrams" type="number" step="1" min="0" defaultValue={m.stockGrams} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">₺ / gram</label>
                  <input name="pricePerGramTRY" type="number" step="0.001" min="0" defaultValue={Number(m.pricePerGramTRY)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Yoğunluk (g/cm³)</label>
                  <input name="densityGcm3" type="number" step="0.01" min="0.1" defaultValue={m.densityGcm3} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Çap (mm)</label>
                  <input name="diameterMm" type="number" step="0.01" min="0.1" defaultValue={m.diameterMm} className={inputCls} />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Notlar</label>
                  <input name="notes" defaultValue={m.notes ?? ""} placeholder="Tedarikçi, ek bilgi..." className={inputCls} />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-[var(--radius-button)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  İptal
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
