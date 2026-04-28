"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);

    fetch("/api/observability/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message || "client global error",
        stack: error.stack ?? null,
        digest: error.digest ?? null,
        severity: "CRITICAL",
        source: "client:global-error",
      }),
      keepalive: true,
    }).catch(() => void 0);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "4rem 1.5rem",
          textAlign: "center",
          background: "#0b0b0d",
          color: "#fafafa",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", textTransform: "uppercase" }}>
          Beklenmedik bir hata oluştu
        </h1>
        <p style={{ opacity: 0.7, marginTop: "0.75rem", fontSize: "0.9rem" }}>
          Uygulama yüklenemedi. Lütfen birazdan tekrar dene.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            padding: "0.6rem 1.2rem",
            background: "#ea580c",
            border: 0,
            color: "white",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Yeniden yükle
        </button>
      </body>
    </html>
  );
}
