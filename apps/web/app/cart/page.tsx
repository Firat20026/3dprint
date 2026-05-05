import { Container } from "@/components/ui/container";
import { CartContents } from "@/components/shop/CartContents";

export default function CartPage() {
  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Sepet</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">
        Siparişin
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Kesin fiyat slicing tamamlandıktan sonra netleşir. Şu an gösterilen
        tahmini fiyat — 40g varsayılan model kütlesi üstünden hesaplandı.
      </p>
      <div className="mt-8">
        <CartContents />
      </div>
    </Container>
  );
}
