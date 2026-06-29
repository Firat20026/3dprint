import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct } from "../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const p = await prisma.catalogProduct.findUnique({ where: { id } });
  if (!p) notFound();

  const extra = Array.isArray(p.imagesJson)
    ? (p.imagesJson as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  const images = [p.imageUrl, ...extra].filter(Boolean).join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl uppercase tracking-tight">Ürünü Düzenle</h2>
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Listeye dön
        </Link>
      </div>

      <ProductForm
        action={updateProduct}
        submitLabel="Kaydet"
        initial={{
          id: p.id,
          title: p.title,
          description: p.description,
          priceTRY: String(p.priceTRY),
          oldPriceTRY: p.oldPriceTRY != null ? String(p.oldPriceTRY) : "",
          images,
          category: p.category,
          buyUrl: p.buyUrl,
          inStock: p.inStock,
          featured: p.featured,
          isActive: p.isActive,
          sortOrder: p.sortOrder,
        }}
      />
    </div>
  );
}
