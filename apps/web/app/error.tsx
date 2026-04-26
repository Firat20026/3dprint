"use client";

/**
 * Segment-level error boundary. Renders when an error escapes a server
 * component or async page. Reports to /api/observability/client-error so
 * the error reaches our ErrorLog table.
 */
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const payload = {
      message: error.message || "client segment error",
      stack: error.stack ?? null,
      digest: error.digest ?? null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      severity: "HIGH" as const,
      source: "client:segment-error",
    };
    fetch("/api/observability/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => void 0);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h2 className="font-display text-2xl uppercase tracking-tight">
        Bir şeyler ters gitti
      </h2>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        Sayfa yüklenirken hata oluştu. Tekrar deneyebilirsin; sorun devam ederse
        ekibimize iletildi.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
          Referans: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex h-10 items-center rounded-[var(--radius-button)] bg-[var(--color-brand)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-2)]"
      >
        Tekrar dene
      </button>
    </div>
  );
}
