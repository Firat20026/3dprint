import { AlertTriangle } from "lucide-react";

/**
 * Dev-only banner shown when the catalog is rendering demo fixtures instead of
 * live Shopier data (no token, API unreachable, or empty store). Helps avoid
 * mistaking sample products for the real catalog during development.
 */
export function FixtureNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300 " +
        className
      }
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">Örnek ürünler gösteriliyor</p>
        <p className="mt-0.5 text-xs opacity-90">
          Shopier&apos;den canlı ürün çekilemedi (token, bağlantı veya boş
          mağaza). Mağazaya ürün eklenip API erişimi açıldığında gerçek ürünler
          otomatik görünecek.
        </p>
      </div>
    </div>
  );
}
