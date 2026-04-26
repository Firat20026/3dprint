/**
 * Admin observability dashboard.
 *
 * Two simple panels:
 *   - Error log (filter: severity, resolved)
 *   - Event log (filter: name, last N hours)
 *
 * Designed for at-a-glance triage; deep-dive details belong in PostHog/Sentry
 * once those are wired up.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ErrorSeverity } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

async function markResolved(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id required");
  await prisma.errorLog.update({
    where: { id },
    data: { resolved: true },
  });
  revalidatePath("/admin/observability");
}

async function markUnresolved(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id required");
  await prisma.errorLog.update({
    where: { id },
    data: { resolved: false },
  });
  revalidatePath("/admin/observability");
}

const SEVERITY_COLORS: Record<ErrorSeverity, string> = {
  CRITICAL:
    "bg-[var(--color-danger)]/20 text-[var(--color-danger)] border-[var(--color-danger)]/30",
  HIGH: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  MEDIUM: "bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
  LOW: "bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)]",
};

type SearchParams = Promise<{
  errorFilter?: string;
  eventFilter?: string;
  showResolved?: string;
}>;

export default async function ObservabilityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const params = await searchParams;
  const showResolved = params.showResolved === "1";
  const errorFilter = params.errorFilter ?? "";
  const eventFilter = params.eventFilter ?? "";

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const [errors, events, errorCount, openCriticalCount, eventCount] =
    await Promise.all([
      prisma.errorLog.findMany({
        where: {
          ...(showResolved ? {} : { resolved: false }),
          ...(errorFilter ? { source: { contains: errorFilter } } : {}),
          occurredAt: { gte: since },
        },
        orderBy: { occurredAt: "desc" },
        take: PAGE_SIZE,
        include: {
          user: { select: { email: true, name: true } },
        },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          ...(eventFilter ? { name: { contains: eventFilter } } : {}),
          occurredAt: { gte: since },
        },
        orderBy: { occurredAt: "desc" },
        take: PAGE_SIZE,
        include: {
          user: { select: { email: true } },
        },
      }),
      prisma.errorLog.count({ where: { resolved: false } }),
      prisma.errorLog.count({
        where: {
          resolved: false,
          severity: { in: ["HIGH", "CRITICAL"] },
        },
      }),
      prisma.analyticsEvent.count({ where: { occurredAt: { gte: since } } }),
    ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-tight">
          Olaylar & Hatalar
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Son 7 günün özeti — analitik olayları ve uygulama hatalarını burada
          incele. Detaylı ürün analitiği için PostHog/Sentry entegrasyonu eklenebilir.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Açık hata"
          value={errorCount}
          tone={errorCount > 0 ? "warn" : "ok"}
        />
        <StatCard
          label="Yüksek/Kritik açık"
          value={openCriticalCount}
          tone={openCriticalCount > 0 ? "danger" : "ok"}
        />
        <StatCard label="Olay (7g)" value={eventCount} tone="ok" />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl uppercase tracking-tight">
            Hata Günlüğü ({errors.length})
          </h2>
          <form className="flex flex-wrap items-end gap-2">
            <input
              type="text"
              name="errorFilter"
              defaultValue={errorFilter}
              placeholder="kaynak filtresi (örn. api:checkout)"
              className="h-8 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-text)]"
            />
            <label className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <input
                type="checkbox"
                name="showResolved"
                value="1"
                defaultChecked={showResolved}
                className="size-3.5 accent-[var(--color-brand)]"
              />
              Çözülmüşleri göster
            </label>
            {eventFilter && (
              <input type="hidden" name="eventFilter" value={eventFilter} />
            )}
            <button
              type="submit"
              className="h-8 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-xs hover:bg-[var(--color-surface-3)]"
            >
              Filtrele
            </button>
          </form>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2 text-left">Zaman</th>
                <th className="px-3 py-2 text-left">Severity</th>
                <th className="px-3 py-2 text-left">Kaynak</th>
                <th className="px-3 py-2 text-left">Mesaj</th>
                <th className="px-3 py-2 text-left">Kullanıcı</th>
                <th className="px-3 py-2 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {errors.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    {showResolved
                      ? "Hata kaydı yok."
                      : "Açık hata yok 🎉"}
                  </td>
                </tr>
              )}
              {errors.map((e) => (
                <tr
                  key={e.id}
                  className={
                    "border-t border-[var(--color-border)] " +
                    (e.resolved
                      ? "bg-[var(--color-surface-2)] opacity-60"
                      : "bg-[var(--color-surface)]")
                  }
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--color-text-muted)]">
                    {e.occurredAt.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        "rounded-full border px-2 py-0.5 text-xs " +
                        SEVERITY_COLORS[e.severity]
                      }
                    >
                      {e.severity}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    {e.source}
                    {e.requestPath && (
                      <span className="ml-1 text-[var(--color-text-subtle)]">
                        {e.requestMethod} {e.requestPath}
                      </span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2 text-[var(--color-text)]"
                    title={e.stack ?? undefined}
                  >
                    <div className="line-clamp-2 max-w-md">{e.message}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                    {e.user?.name ?? e.user?.email ?? (e.userId ?? "—")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={e.resolved ? markUnresolved : markResolved}>
                      <input type="hidden" name="id" value={e.id} />
                      <SubmitButton
                        size="sm"
                        variant="ghost"
                        pendingLabel="..."
                      >
                        {e.resolved ? "Yeniden aç" : "Çözüldü"}
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl uppercase tracking-tight">
            Olay Akışı ({events.length})
          </h2>
          <form className="flex flex-wrap items-end gap-2">
            <input
              type="text"
              name="eventFilter"
              defaultValue={eventFilter}
              placeholder="olay adı (örn. PAYMENT)"
              className="h-8 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-text)]"
            />
            {errorFilter && (
              <input type="hidden" name="errorFilter" value={errorFilter} />
            )}
            {showResolved && (
              <input type="hidden" name="showResolved" value="1" />
            )}
            <button
              type="submit"
              className="h-8 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-xs hover:bg-[var(--color-surface-3)]"
            >
              Filtrele
            </button>
          </form>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2 text-left">Zaman</th>
                <th className="px-3 py-2 text-left">Olay</th>
                <th className="px-3 py-2 text-left">Kullanıcı</th>
                <th className="px-3 py-2 text-left">Detay</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    Henüz olay yok.
                  </td>
                </tr>
              )}
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--color-text-muted)]">
                    {ev.occurredAt.toLocaleString("tr-TR")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    <span className="rounded-full bg-[var(--color-brand)]/10 px-2 py-0.5 text-[var(--color-brand-2)]">
                      {ev.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                    {ev.user?.email ?? (ev.userId ?? "—")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-muted)]">
                    <div className="line-clamp-1 max-w-md">
                      {Object.keys(ev.properties as Record<string, unknown>).length
                        ? JSON.stringify(ev.properties)
                        : "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10"
      : tone === "warn"
        ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10"
        : "border-[var(--color-border)] bg-[var(--color-surface)]";
  return (
    <div
      className={
        "rounded-[var(--radius-card)] border p-4 " + toneClass
      }
    >
      <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl">{value}</div>
    </div>
  );
}
