"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelViewer } from "@/components/viewer/ModelViewer";

type Mode = "TEXT" | "IMAGE";
type JobStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";
type JobState = {
  id: string;
  status: JobStatus;
  modelUrl: string | null;
  errorText: string | null;
  creditsCharged: number;
};

export function AIGenerateForm({
  balance,
  textCost,
  imageCost,
}: {
  balance: number;
  textCost: number;
  imageCost: number;
}) {
  const [mode, setMode] = useState<Mode>("TEXT");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobState | null>(null);
  const [currentBalance, setCurrentBalance] = useState(balance);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cost = mode === "TEXT" ? textCost : imageCost;
  const canAfford = currentBalance >= cost;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/meshy/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJob({
          id: data.id,
          status: data.status,
          modelUrl: data.modelUrl,
          errorText: data.errorText,
          creditsCharged: data.creditsCharged,
        });
        if (data.status === "DONE" || data.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // silent retry
      }
    }, 1500);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canAfford) {
      setError(`Yetersiz kredi (gerekli: ${cost}, bakiye: ${currentBalance}).`);
      return;
    }
    if (mode === "TEXT" && prompt.trim().length < 3) {
      setError("Prompt en az 3 karakter olmalı.");
      return;
    }
    if (mode === "IMAGE" && !imageFile) {
      setError("Bir görsel seçin.");
      return;
    }

    setSubmitting(true);
    setJob(null);

    const fd = new FormData();
    fd.set("mode", mode);
    if (mode === "TEXT") fd.set("prompt", prompt);
    if (mode === "IMAGE" && imageFile) fd.set("image", imageFile);

    try {
      const res = await fetch("/api/meshy/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Üretim başlatılamadı");
      setCurrentBalance((b) => b - data.creditsCharged);
      setJob({
        id: data.jobId,
        status: data.status,
        modelUrl: null,
        errorText: null,
        creditsCharged: data.creditsCharged,
      });
      startPolling(data.jobId);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || (job !== null && (job.status === "PENDING" || job.status === "RUNNING"));

  return (
    <div className="grid gap-8 md:grid-cols-5">
      <form
        onSubmit={submit}
        className="md:col-span-2 flex flex-col gap-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        {/* Mode tabs */}
        <div className="flex rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1">
          {(["TEXT", "IMAGE"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-[calc(var(--radius-button)-2px)] px-3 py-2 text-sm transition-colors ${
                mode === m
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {m === "TEXT" ? "Metin" : "Görsel"}
            </button>
          ))}
        </div>

        {mode === "TEXT" ? (
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Prompt
            </label>
            <textarea
              className="mt-2 w-full min-h-[120px] rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm outline-none focus:border-[var(--color-brand)]/50"
              placeholder="Örnek: minimalist robot figürü, 10cm, stilize"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {prompt.length}/500
            </p>
          </div>
        ) : (
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Görsel
            </label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-2"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              PNG/JPEG/WEBP · max 10MB
            </p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm">
          <span className="text-[var(--color-text-muted)]">Maliyet</span>
          <span className="font-mono">{cost} kredi</span>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Bakiye: {currentBalance} kredi</span>
          {!canAfford && (
            <Link
              href="/account/credits"
              className="text-[var(--color-accent)] hover:underline"
            >
              Kredi al →
            </Link>
          )}
        </div>

        <Button type="submit" disabled={busy || !canAfford}>
          {submitting ? "Başlatılıyor…" : busy ? "Üretiliyor…" : "Üret"}
        </Button>

        {error && (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        )}
      </form>

      {/* Output */}
      <div className="md:col-span-3">
        {!job ? (
          <div className="flex h-[420px] items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-center text-sm text-[var(--color-text-muted)]">
            Prompt gir veya görsel yükle · üretim sonucu burada görünecek
          </div>
        ) : job.status === "FAILED" ? (
          <div className="flex h-[420px] flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--color-danger)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_8%,transparent)] p-6 text-center">
            <p className="font-display text-xl uppercase text-[var(--color-danger)]">
              Üretim başarısız
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {job.errorText ?? "Bilinmeyen bir hata oluştu."}
            </p>
            {job.creditsCharged > 0 && (
              <p className="rounded-full bg-[var(--color-success)]/15 px-3 py-1 text-xs text-[var(--color-success)]">
                ✓ {job.creditsCharged} kredi iade edildi
              </p>
            )}
          </div>
        ) : job.status !== "DONE" ? (
          <div className="flex h-[420px] flex-col items-center justify-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="size-12 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              AI modeli oluşturuluyor… (~3 sn)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {job.modelUrl && <ModelViewer url={job.modelUrl} format="stl" />}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/upload?meshyJobId=${job.id}`}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-brand)] px-5 text-sm font-medium text-[var(--color-brand-fg)] shadow-[var(--shadow-glow-brand)] transition-colors hover:bg-[var(--color-brand-2)]"
              >
                Bunu Bastır →
              </Link>
              {job.modelUrl && (
                <a
                  href={job.modelUrl}
                  download
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border-strong)] bg-transparent px-5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  STL İndir
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
