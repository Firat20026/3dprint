import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/ProductForm";
import {
  toggleProductActive,
  toggleProductFeatured,
  deleteProduct,
  createProduct,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.catalogProduct.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">Yeni Ürün</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shopier linkini yapıştır, &quot;Linkten Doldur&quot; ile başlık/görsel/fiyatı
          otomatik çek, kontrol edip kaydet.
        </p>
        <div className="mt-4">
          <ProductForm action={createProduct} submitLabel="Ürün Ekle" />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">
          Tüm Ürünler ({products.length})
        </h2>
        <div className="mt-4 overflow-hidden overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Ürün</th>
                <th className="px-4 py-3 text-left">Fiyat</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-left">Öne çıkan</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Henüz ürün yok. Yukarıdaki formdan ekle.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border bg-card align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="size-10 shrink-0 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-[9px] text-muted-foreground">
                          görsel
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{p.title}</p>
                        <a
                          href={p.buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-xs text-muted-foreground hover:underline"
                        >
                          {p.buyUrl}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono">
                    {formatMoney(Number(p.priceTRY))}
                    {p.oldPriceTRY != null && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        {formatMoney(Number(p.oldPriceTRY))}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={toggleProductFeatured}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="current" value={String(p.featured)} />
                      <button
                        type="submit"
                        className={
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors " +
                          (p.featured
                            ? "bg-foreground text-background"
                            : "border border-border text-muted-foreground hover:text-foreground")
                        }
                      >
                        {p.featured ? "Öne çıkan" : "Normal"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleProductActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="current" value={String(p.isActive)} />
                      <button
                        type="submit"
                        className={
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors " +
                          (p.isActive
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {p.isActive ? "Yayında" : "Gizli"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-secondary"
                      >
                        Düzenle
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Sil
                        </button>
                      </form>
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
