import { prisma } from "@/lib/db";
import { QueueCard } from "@/components/admin/QueueCard";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const COLUMNS: { status: OrderStatus; title: string; hint: string; accent?: string }[] = [
  { status: "PAID",      title: "Ödendi",    hint: "Kuyruğa almayı bekliyor", accent: "var(--color-accent)" },
  { status: "IN_QUEUE",  title: "Kuyrukta",  hint: "Baskı bekleyen" },
  { status: "PRINTING",  title: "Basılıyor", hint: "Yazıcıda aktif" },
  { status: "SHIPPED",   title: "Kargoda",   hint: "Yolda" },
];

export default async function PrintQueuePage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: COLUMNS.map((c) => c.status) } },
    orderBy: { createdAt: "asc" },
    include: { items: true, user: { select: { name: true } } },
  });

  const byStatus = new Map<OrderStatus, typeof orders>();
  for (const col of COLUMNS) byStatus.set(col.status, []);
  for (const o of orders) byStatus.get(o.status)?.push(o);

  return (
    <div>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Her kartın altındaki butonla durumu doğrudan ilerlet. Kart başlığına tıklayınca detay sayfası açılır.
      </p>

      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = byStatus.get(col.status) ?? [];
          return (
            <div
              key={col.status}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="mb-1 flex items-baseline justify-between">
                <h3
                  className="font-display text-base uppercase tracking-tight"
                  style={col.accent ? { color: col.accent } : undefined}
                >
                  {col.title}
                </h3>
                <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                  {list.length}
                </span>
              </div>
              <p className="mb-4 text-[10px] uppercase tracking-wider text-[var(--color-text-subtle)]">
                {col.hint}
              </p>
              {list.length === 0 ? (
                <p className="text-xs text-[var(--color-text-subtle)]">Boş.</p>
              ) : (
                <ul className="space-y-2">
                  {list.map((o) => (
                    <li key={o.id}>
                      <QueueCard
                        orderId={o.id}
                        status={o.status}
                        customerName={o.user.name}
                        items={o.items}
                        totalTRY={String(o.totalTRY)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
