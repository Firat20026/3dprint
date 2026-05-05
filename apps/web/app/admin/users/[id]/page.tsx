/**
 * /admin/users/[id] — user detail + admin actions.
 *
 * Shows: profile fields, credit balance, ledger history, recent orders.
 * Allows admin to:
 *   - Grant credits (positive delta, reason "ADMIN_GRANT")
 *   - Revoke credits (negative delta, reason "ADMIN_REVOKE")
 *   - Promote/demote role
 *
 * Idempotency: ledger writes are atomic with User.credits update via
 * $transaction. Ledger refId is null for admin actions (manual entries),
 * so the (refId, reason) unique constraint allows multiple grants.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { track, EVENTS } from "@/lib/observability";
import { Sparkles, ShieldCheck, Mail, Phone, MapPin, IdCard } from "lucide-react";

export const dynamic = "force-dynamic";

const MIN_GRANT = 1;
const MAX_GRANT = 100_000;

async function grantCredits(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const amountRaw = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId) throw new Error("userId required");
  if (!Number.isFinite(amountRaw) || amountRaw < MIN_GRANT || amountRaw > MAX_GRANT) {
    redirect(`/admin/users/${userId}?err=amount-bounds`);
  }
  if (reason.length < 3 || reason.length > 240) {
    redirect(`/admin/users/${userId}?err=reason-length`);
  }
  const amount = Math.floor(amountRaw);

  await prisma.$transaction([
    prisma.creditLedger.create({
      data: {
        userId,
        delta: amount,
        reason: "ADMIN_GRANT",
        note: `[admin:${admin.email ?? admin.id}] ${reason}`,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
  ]);

  void track(
    EVENTS.CREDITS_REFUNDED,
    { source: "admin-grant", targetUserId: userId, amount, reason },
    { userId: admin.id },
  );

  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?ok=grant-${amount}`);
}

async function revokeCredits(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const amountRaw = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId) throw new Error("userId required");
  if (!Number.isFinite(amountRaw) || amountRaw < MIN_GRANT || amountRaw > MAX_GRANT) {
    redirect(`/admin/users/${userId}?err=amount-bounds`);
  }
  if (reason.length < 3 || reason.length > 240) {
    redirect(`/admin/users/${userId}?err=reason-length`);
  }
  const amount = Math.floor(amountRaw);

  // Atomic: deduct only if user has enough credits.
  const updated = await prisma.user.updateMany({
    where: { id: userId, credits: { gte: amount } },
    data: { credits: { decrement: amount } },
  });
  if (updated.count === 0) {
    redirect(`/admin/users/${userId}?err=insufficient`);
  }
  await prisma.creditLedger.create({
    data: {
      userId,
      delta: -amount,
      reason: "ADMIN_REVOKE",
      note: `[admin:${admin.email ?? admin.id}] ${reason}`,
    },
  });

  void track(
    "ADMIN_CREDITS_REVOKED",
    { targetUserId: userId, amount, reason },
    { userId: admin.id },
  );

  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?ok=revoke-${amount}`);
}

async function setUserRole(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "ADMIN" && role !== "USER") throw new Error("invalid role");
  if (userId === admin.id) {
    redirect(`/admin/users/${userId}?err=self-demote`);
  }
  await prisma.user.update({
    where: { id: userId },
    data: { role: role as "ADMIN" | "USER" },
  });
  void track(
    role === "ADMIN" ? "ADMIN_ROLE_PROMOTED" : "ADMIN_ROLE_DEMOTED",
    { targetUserId: userId },
    { userId: admin.id },
  );
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/admin/users`);
  redirect(`/admin/users/${userId}?ok=role-${role.toLowerCase()}`);
}

const ERR_MESSAGES: Record<string, string> = {
  "amount-bounds": `Tutar ${MIN_GRANT}–${MAX_GRANT} arası olmalı`,
  "reason-length": "Sebep 3–240 karakter olmalı",
  insufficient: "Kullanıcının yeterli kredisi yok",
  "self-demote": "Kendi rolünü değiştiremezsin",
};

const REASON_LABELS: Record<string, string> = {
  PURCHASE: "Satın alma",
  MESHY_TEXT: "AI metin",
  MESHY_IMAGE: "AI görsel",
  REFUND: "İade",
  ADMIN_GRANT: "Admin ekleme",
  ADMIN_REVOKE: "Admin kesme",
};

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const [user, ledger, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
        phone: true,
        identityNumber: true,
        city: true,
        registrationAddress: true,
        createdAt: true,
        _count: { select: { orders: true, designs: true, meshyJobs: true } },
      },
    }),
    prisma.creditLedger.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        totalTRY: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) notFound();

  const okMsg = sp.ok ? interpretOk(sp.ok) : null;
  const errMsg = sp.err ? ERR_MESSAGES[sp.err] : null;

  return (
    <Container className="py-2 space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Kullanıcı listesi
        </Link>
        <h1 className="mt-2 font-display text-2xl uppercase tracking-tight">
          {user.name ?? user.email}
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      {okMsg && (
        <div className="rounded-xl border border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10 p-3 text-sm text-[hsl(var(--success))]">
          ✓ {okMsg}
        </div>
      )}
      {errMsg && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          ✗ {errMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg uppercase tracking-tight">
            Profil
          </h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Field icon={<Mail className="size-3.5" />} label="E-posta">
              <code className="text-xs">{user.email}</code>
            </Field>
            <Field icon={<Phone className="size-3.5" />} label="Telefon">
              {user.phone ?? <em className="text-muted-foreground/70">—</em>}
            </Field>
            <Field icon={<IdCard className="size-3.5" />} label="TCKN">
              {user.identityNumber ? (
                <code className="text-xs">
                  {user.identityNumber.slice(0, 3)}*****
                  {user.identityNumber.slice(-2)}
                </code>
              ) : (
                <em className="text-muted-foreground/70">—</em>
              )}
            </Field>
            <Field icon={<MapPin className="size-3.5" />} label="Şehir">
              {user.city ?? <em className="text-muted-foreground/70">—</em>}
            </Field>
            <Field icon={null} label="Adres">
              {user.registrationAddress ? (
                <span className="text-xs">{user.registrationAddress}</span>
              ) : (
                <em className="text-muted-foreground/70">—</em>
              )}
            </Field>
          </dl>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Üyelik: {user.createdAt.toLocaleDateString("tr-TR")}</span>
            <span>· {user._count.orders} sipariş</span>
            <span>· {user._count.designs} tasarım</span>
            <span>· {user._count.meshyJobs} AI üretim</span>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="eyebrow">Rol</p>
              <div className="mt-1">
                {user.role === "ADMIN" ? (
                  <Badge tone="accent">
                    <ShieldCheck className="size-3" />
                    Admin
                  </Badge>
                ) : (
                  <span className="text-sm">Kullanıcı</span>
                )}
              </div>
            </div>
            <form action={setUserRole}>
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="hidden"
                name="role"
                value={user.role === "ADMIN" ? "USER" : "ADMIN"}
              />
              <SubmitButton size="sm" variant="ghost" pendingLabel="...">
                {user.role === "ADMIN" ? "Admin'i kaldır" : "Admin yap"}
              </SubmitButton>
            </form>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow">Kredi Bakiyesi</p>
              <p className="mt-2 flex items-center gap-2 font-display text-4xl">
                <Sparkles className="size-6 text-primary" />
                {user.credits}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <form action={grantCredits} className="space-y-2">
              <input type="hidden" name="userId" value={user.id} />
              <Label htmlFor={`grant-amount-${user.id}`}>Kredi ekle</Label>
              <Input
                id={`grant-amount-${user.id}`}
                name="amount"
                type="number"
                min={MIN_GRANT}
                max={MAX_GRANT}
                step={1}
                placeholder="örn. 100"
                required
              />
              <textarea
                name="reason"
                required
                minLength={3}
                maxLength={240}
                rows={2}
                placeholder="Sebep (örn. promosyon, manuel iade)"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <SubmitButton size="sm" pendingLabel="Ekleniyor...">
                + Ekle
              </SubmitButton>
            </form>

            <form action={revokeCredits} className="space-y-2">
              <input type="hidden" name="userId" value={user.id} />
              <Label htmlFor={`revoke-amount-${user.id}`}>Kredi kes</Label>
              <Input
                id={`revoke-amount-${user.id}`}
                name="amount"
                type="number"
                min={MIN_GRANT}
                max={user.credits}
                step={1}
                placeholder="örn. 50"
                required
              />
              <textarea
                name="reason"
                required
                minLength={3}
                maxLength={240}
                rows={2}
                placeholder="Sebep (örn. hatalı ödeme, abuse)"
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground focus:border-destructive focus:outline-none"
              />
              <SubmitButton
                size="sm"
                variant="ghost"
                pendingLabel="Kesiliyor..."
                style={{ color: "var(--color-danger)" }}
              >
                − Kes
              </SubmitButton>
            </form>
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl uppercase tracking-tight">
          Kredi Geçmişi ({ledger.length})
        </h2>
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Zaman</th>
                <th className="px-3 py-2 text-left">Sebep</th>
                <th className="px-3 py-2 text-right">Δ</th>
                <th className="px-3 py-2 text-left">Not</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    Hareket yok.
                  </td>
                </tr>
              )}
              {ledger.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-border bg-card"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted-foreground">
                    {l.createdAt.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {REASON_LABELS[l.reason] ?? l.reason}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    <span
                      className={
                        l.delta > 0
                          ? "text-[hsl(var(--success))]"
                          : "text-destructive"
                      }
                    >
                      {l.delta > 0 ? "+" : ""}
                      {l.delta}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {l.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl uppercase tracking-tight">
          Son Siparişler ({orders.length})
        </h2>
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Tarih</th>
                <th className="px-3 py-2 text-left">Sipariş</th>
                <th className="px-3 py-2 text-left">Durum</th>
                <th className="px-3 py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    Sipariş yok.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-border bg-card"
                >
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                    {o.createdAt.toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-xs font-medium text-foreground hover:underline"
                    >
                      {o.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    ₺{Number(o.totalTRY).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}

function interpretOk(value: string): string {
  if (value.startsWith("grant-")) {
    return `${value.slice(6)} kredi eklendi`;
  }
  if (value.startsWith("revoke-")) {
    return `${value.slice(7)} kredi kesildi`;
  }
  if (value === "role-admin") return "Admin yapıldı";
  if (value === "role-user") return "Admin kaldırıldı";
  return "İşlem tamamlandı";
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right text-sm text-foreground">
        {children}
      </span>
    </div>
  );
}
