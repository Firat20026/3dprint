/**
 * /admin/users — list + search.
 *
 * Filter by email or name (substring), order by createdAt desc, paginate
 * with simple ?page=N (default 1, 50 per page).
 */
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ q?: string; page?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Container className="py-2">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight">
            Kullanıcılar
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Toplam {total} kullanıcı · Sayfa {page}/{totalPages}
          </p>
        </div>
        <form className="flex items-end gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="email veya isim ara"
            className="h-9 w-72 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text)]"
          />
          <button
            type="submit"
            className="h-9 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm hover:bg-[var(--color-surface-3)]"
          >
            Ara
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3 text-left">E-posta</th>
              <th className="px-4 py-3 text-left">Ad</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-right">Kredi</th>
              <th className="px-4 py-3 text-right">Sipariş</th>
              <th className="px-4 py-3 text-left">Üyelik</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[var(--color-text-muted)]"
                >
                  {q ? "Eşleşen kullanıcı yok." : "Henüz kullanıcı yok."}
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">
                  {u.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {u.role === "ADMIN" ? (
                    <Badge tone="accent">
                      <ShieldCheck className="size-3" />
                      Admin
                    </Badge>
                  ) : (
                    <span className="text-xs text-[var(--color-text-subtle)]">
                      Kullanıcı
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Sparkles className="size-3 text-[var(--color-brand-2)]" />
                    {u.credits}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">
                  {u._count.orders}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                  {u.createdAt.toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-sm text-[var(--color-brand-2)] hover:underline"
                  >
                    Detay →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={`?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${page - 1}`}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-surface-2)]"
            >
              ← Önceki
            </Link>
          )}
          <span className="text-[var(--color-text-muted)]">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${page + 1}`}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-surface-2)]"
            >
              Sonraki →
            </Link>
          )}
        </nav>
      )}
    </Container>
  );
}
