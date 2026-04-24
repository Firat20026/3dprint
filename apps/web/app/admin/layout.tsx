import { requireAdmin } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <Container className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Admin Paneli</p>
          <h1 className="mt-2 h-display text-3xl">frint3d</h1>
        </div>
      </div>
      <AdminNav />
      <div>{children}</div>
    </Container>
  );
}
